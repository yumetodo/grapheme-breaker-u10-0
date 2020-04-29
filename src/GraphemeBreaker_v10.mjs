import classesmjs from './classes-v10.0.0.mjs'
const trie = classesmjs.trie
const { Other, Prepend, CR, LF, Control, Extend, Regional_Indicator, SpacingMark, L, V, T, LV, LVT, E_Base, E_Modifier, ZWJ, Glue_After_Zwj, E_Base_GAZ } = classesmjs.classes

//import UnicodeTrie from 'unicode-trie'
import UnicodeTrie from './unicode-trie/index.mjs'

let data = null
if (globalThis['window']) {
  const bin = window.atob(trie)
  data = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++)
    data[i] = bin.charCodeAt(i)
} else {
  data = Buffer.from(trie, 'base64')
}
//console.log(data, data.length)
const classTrie = new UnicodeTrie(data)

const codePointAt = function(str, idx) { // different from String#codePointAt with low surrogate
  const code = str.charCodeAt(idx)
  // High surrogate
  if ((0xD800 <= code && code <= 0xDBFF)) {
    const hi = code
    const low = str.charCodeAt(idx + 1)
    if ((0xDC00 <= low && low <= 0xDFFF)) {
      return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000
    }
    return hi
  }
  // Low surrogate
  if ((0xDC00 <= code && code <= 0xDFFF)) {
    const hi = str.charCodeAt(idx - 1)
    const low = code
    if ((0xD800 <= hi && hi <= 0xDBFF)) {
      return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000
    }
    return low
  }
  return code
}

const isSurrogate = function(str, pos) {
  let ref, ref1
  return (0xd800 <= (ref = str.charCodeAt(pos)) && ref <= 0xdbff) && (0xdc00 <= (ref1 = str.charCodeAt(pos + 1)) && ref1 <= 0xdfff)
}

const BreakType = {
  NotBreak: 0,
  BreakStart: 1,
  Break: 2,
  BreakLastRegional: 3,
  BreakPenultimateRegional: 4
}

// Returns whether a break is allowed within a sequence of grapheme breaking classes
const shouldBreak = function(reverse, start, mid, end) {
  const all = [start].concat(mid).concat([end])
  const previous = reverse ? start : all[all.length - 2]
  const next = reverse ? all[1] : end
  // Lookahead termintor for:
  // GB10. (E_Base | EBG) Extend* ×	E_Modifier
  let eModifierIndex = all.lastIndexOf(E_Modifier)
  if (eModifierIndex > 1 && all.slice(1, eModifierIndex).every(c => c === Extend) && (start !== Extend && start !== E_Base && start !== E_Base_GAZ)) {
    return BreakType.Break
  }
  // Lookahead termintor for:
  // GB12. ^ (RI RI)* RI	×	RI
  // GB13. [^RI] (RI RI)* RI	×	RI
  let rIIndex = all.lastIndexOf(Regional_Indicator)
  if (rIIndex > 0 && all.slice(1, rIIndex).every(c => c === Regional_Indicator) && (previous !== Prepend && previous !== Regional_Indicator)) {
    if (all.filter(c => c === Regional_Indicator).length % 2 === 1) {
      return BreakType.BreakLastRegional
    } else {
      return BreakType.BreakPenultimateRegional
    }
  }
  // GB3. CR X LF
  if (previous === CR && next === LF) {
    return BreakType.NotBreak
  }
  // GB4. (Control|CR|LF) ÷
  if (previous === Control || previous === CR || previous === LF) {
    if (next === E_Modifier && mid.every(c => c === Extend)) {
      return BreakType.Break
    } else {
      return BreakType.BreakStart
    }
  }
  // GB5. ÷ (Control|CR|LF)
  if (next === Control || next === CR || next === LF) {
    return BreakType.BreakStart
  }
  // GB6. L X (L|V|LV|LVT)
  if (previous === L && (next === L || next === V || next === LV || next === LVT)) {
    return BreakType.NotBreak
  }
  // GB7. (LV|V) X (V|T)
  if ((previous === LV || previous === V) && (next === V || next === T)) {
    return BreakType.NotBreak
  }
  // GB8. (LVT|T) X (T)
  if ((previous === LVT || previous === T) && next === T) {
    return BreakType.NotBreak
  }
  // GB9. X (Extend|ZWJ)
  if (next === Extend || next === ZWJ) {
    return BreakType.NotBreak
  }
  // GB9a. X SpacingMark
  if (next === SpacingMark) {
    return BreakType.NotBreak
  }
  // GB9b. Prepend X
  if (previous === Prepend) {
    return BreakType.NotBreak
  }
  // GB10. (E_Base | EBG) Extend* ×	E_Modifier
  if (reverse) {
    eModifierIndex = all.lastIndexOf(E_Modifier)
    if ((previous === E_Base || previous === E_Base_GAZ || previous === Extend) && eModifierIndex > 0 && all.slice(1, eModifierIndex).every(c => c === Extend)) {
      return BreakType.NotBreak
    }
  } else {
    let ref
    const previousNonExtendIndex = all.indexOf(Extend) >= 0 ? all.lastIndexOf(Extend) - 1 : all.length - 2
    if (((ref = all[previousNonExtendIndex]) === E_Base || ref === E_Base_GAZ) && all.slice(previousNonExtendIndex + 1, -1).every(c => c === Extend) && next === E_Modifier) {
      return BreakType.NotBreak
    }
  }
  // GB11. ZWJ	×	(Glue_After_Zwj | EBG)
  if (previous === ZWJ && (next === Glue_After_Zwj || next === E_Base_GAZ)) {
    return BreakType.NotBreak
  }
  // GB12. ^ (RI RI)* RI	×	RI
  // GB13. [^RI] (RI RI)* RI	×	RI
  if (!reverse && mid.indexOf(Regional_Indicator) >= 0) {
    return BreakType.Break
  }
  if (previous === Regional_Indicator && next === Regional_Indicator) {
    return BreakType.NotBreak
  }
  // GB999. Any ÷ Any
  return BreakType.BreakStart
}

const getUnicodeByteOffset = function(str, start, unicodeOffset) {
  while (unicodeOffset--) {
    start += isSurrogate(str, start) ? 2 : 1
  }
  return start
}

const exports = {}

// Returns the next grapheme break in the string after the given index
exports.nextBreak = function(string, index = 0) {
  if (index < 0) {
    return 0
  }
  if (index >= string.length - 1) {
    return string.length
  }
  const prev = classTrie.get(string.codePointAt(index))
  const mid = []
  let i, j, ref, ref1
  for (i = j = ref = index + 1, ref1 = string.length; j < ref1; i = j += 1) {
    if (isSurrogate(string, i - 1)) {
      // check for already processed low surrogates
      continue
    }
    const next = classTrie.get(string.codePointAt(i))
    if (shouldBreak(false, prev, mid, next)) {
      return i
    }
    mid.push(next)
  }
  return string.length
}

// Returns the next grapheme break in the string before the given index
exports.previousBreak = function(string, index = string.length) {
  if (index > string.length) {
    return string.length
  }
  if (index <= 1) {
    return 0
  }
  index--
  let mid = []
  let next = classTrie.get(codePointAt(string, index))
  let i, j, ref
  for (i = j = ref = index - 1; j >= -1; i = j += -1) {
    if (isSurrogate(string, i)) {
      // check for already processed high surrogates
      continue
    }
    let prev = classTrie.get(codePointAt(string, i))
    switch (shouldBreak(true, prev, mid, next)) {
      case BreakType.Break:
        return i + mid.length + 1
      case BreakType.BreakStart:
        return i + 1
      case BreakType.BreakLastRegional:
        const offset = getUnicodeByteOffset(string, i, mid.concat(next).lastIndexOf(Regional_Indicator) + 1)
        return offset
      case BreakType.BreakPenultimateRegional:
        return getUnicodeByteOffset(string, i, mid.concat(next).lastIndexOf(Regional_Indicator))
    }
    mid.unshift(prev)
  }
}

// Breaks the given string into an array of grapheme cluster strings
exports.break = function(str) {
  const res = []
  let index = 0
  let brk
  while ((brk = exports.nextBreak(str, index)) < str.length) {
    res.push(str.slice(index, brk))
    index = brk
  }
  if (index < str.length) {
    res.push(str.slice(index))
  }
  return res
}

// Returns the number of grapheme clusters there are in the given string
exports.countBreaks = function(str) {
  let count = 0
  let index = 0
  let brk
  while ((brk = exports.nextBreak(str, index)) < str.length) {
    index = brk
    count++
  }
  if (index < str.length) {
    count++
  }
  return count
}

//console.log(exports.break("👨‍👨‍👧‍👦👩‍👩‍👧‍👦👨‍👨‍👧‍👦"))

//const s = "🍓👨‍👨‍👧‍👦🍓"
//const s = "👨‍👨‍👧‍👦👩‍👩‍👧‍👦🇮🇸🇮🇪👨‍⚕️👩🏽‍⚕️👵"
//const s = 'a\nb'
//const s = "👨‍👨‍👧‍👦👩‍👩‍👧‍👦🇮🇸🇮🇪👨‍⚕️👩🏽‍⚕️👵👨‍❤️‍💋‍👨👩‍👧‍👧"
const s = ' 🏻'
//const s = 'a\nb'
console.log(exports.break(s))

export default exports
