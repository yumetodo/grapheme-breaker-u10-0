{Other,Prepend,CR,LF,Control,Extend,Regional_Indicator,SpacingMark,L,V,T,LV,LVT,E_Base,E_Modifier,ZWJ,Glue_After_Zwj,E_Base_GAZ} = require './classes.json'
UnicodeTrie = require 'unicode-trie'
fs = require 'fs'
classTrie = new UnicodeTrie fs.readFileSync __dirname + '/classes.trie'

numArrayEq = (a, b) -> "#{a}" is "#{b}"
isSurrogate = (str, pos) -> 0xd800 <= str.charCodeAt(pos) <= 0xdbff and 0xdc00 <= str.charCodeAt(pos + 1) <= 0xdfff

BreakType =
  NotBreak: 0
  BreakStart: 1
  Break: 2
  BreakLastRegional: 3
  BreakPenultimateRegional: 4

# Gets a code point from a UTF-16 string
# handling surrogate pairs appropriately
codePointAt = (str, idx) ->
  idx = idx or 0
  code = str.charCodeAt(idx)

  # High surrogate
  if 0xD800 <= code <= 0xDBFF
    hi = code
    low = str.charCodeAt(idx + 1)
    if 0xDC00 <= low <= 0xDFFF
      return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000

    return hi

  # Low surrogate
  if 0xDC00 <= code <= 0xDFFF
    hi = str.charCodeAt(idx - 1)
    low = code
    if 0xD800 <= hi <= 0xDBFF
      return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000

    return low

  return code

# Returns whether a break is allowed within a sequence of grapheme breaking classes
shouldBreak = (reverse) -> (start, mid, end) ->
  all = [start].concat(mid).concat([end])
  previous = if reverse then start else all[all.length - 2]
  next = if reverse then all[1] else end

  # Lookahead termintor for:
  # GB10. (E_Base | EBG) Extend* ×	E_Modifier
  eModifierIndex = all.lastIndexOf(E_Modifier)
  if eModifierIndex > 1 and
      all.slice(1, eModifierIndex).every((c) -> c == Extend) and
      start not in [Extend, E_Base, E_Base_GAZ]
    return BreakType.Break

  # Lookahead termintor for:
  # GB12. ^ (RI RI)* RI	×	RI
  # GB13. [^RI] (RI RI)* RI	×	RI
  rIIndex = all.lastIndexOf(Regional_Indicator)
  if rIIndex > 0 and
      all.slice(1, rIIndex).every((c) -> c == Regional_Indicator) and
      previous not in [Prepend, Regional_Indicator]
    return if all.filter((c) -> c == Regional_Indicator).length % 2 == 1
    then BreakType.BreakLastRegional
    else BreakType.BreakPenultimateRegional

  # GB3. CR X LF
  if previous is CR and next is LF
    return BreakType.NotBreak

  # GB4. (Control|CR|LF) ÷
  if previous in [Control, CR, LF]
    return if next is E_Modifier and mid.every((c) -> c == Extend) then BreakType.Break else BreakType.BreakStart

  # GB5. ÷ (Control|CR|LF)
  if next in [Control, CR, LF]
    return BreakType.BreakStart

  # GB6. L X (L|V|LV|LVT)
  if previous is L and next in [L, V, LV, LVT]
    return BreakType.NotBreak

  # GB7. (LV|V) X (V|T)
  if previous in [LV, V] and next in [V, T]
    return BreakType.NotBreak

  # GB8. (LVT|T) X (T)
  if previous in [LVT, T] and next is T
    return BreakType.NotBreak

  # GB9. X (Extend|ZWJ)
  if next in [Extend, ZWJ]
    return BreakType.NotBreak

  # GB9a. X SpacingMark
  if next is SpacingMark
    return BreakType.NotBreak

  # GB9b. Prepend X
  if previous is Prepend
    return BreakType.NotBreak

  # GB10. (E_Base | EBG) Extend* ×	E_Modifier
  if reverse
    eModifierIndex = all.lastIndexOf(E_Modifier)
    if previous in [E_Base, E_Base_GAZ, Extend] and
        eModifierIndex > 0 and
        all.slice(1, eModifierIndex).every((c) -> c == Extend)
      return BreakType.NotBreak
  else
    previousNonExtendIndex = if Extend in all then all.lastIndexOf(Extend) - 1 else all.length - 2
    if all[previousNonExtendIndex] in [E_Base, E_Base_GAZ] and
        all.slice(previousNonExtendIndex + 1, -1).every((c) -> c == Extend) and
        next is E_Modifier
      return BreakType.NotBreak

  # GB11. ZWJ	×	(Glue_After_Zwj | EBG)
  if previous is ZWJ and next in [Glue_After_Zwj, E_Base_GAZ]
    return BreakType.NotBreak

  # GB12. ^ (RI RI)* RI	×	RI
  # GB13. [^RI] (RI RI)* RI	×	RI
  if not reverse and Regional_Indicator in mid
      return BreakType.Break
  if previous is Regional_Indicator and next is Regional_Indicator
    return BreakType.NotBreak

  # GB999. Any ÷ Any
  return BreakType.BreakStart

getUnicodeByteOffset = (str, start, unicodeOffset) ->
  while unicodeOffset--
    start += if isSurrogate(str, start) then 2 else 1
  start

# Returns the next grapheme break in the string after the given index
exports.nextBreak = (string, index = 0) ->
  if index < 0
    return 0

  if index >= string.length - 1
    return string.length

  prev = classTrie.get codePointAt(string, index)
  mid = []
  for i in [index + 1...string.length] by 1
    # check for already processed low surrogates
    continue if isSurrogate(string, i - 1)

    next = classTrie.get codePointAt(string, i)
    if shouldBreak(false) prev, mid, next
      return i

    mid.push next

  return string.length

# Returns the next grapheme break in the string before the given index
exports.previousBreak = (string, index = string.length) ->
  if index > string.length
    return string.length

  if index <= 1
    return 0

  index--
  mid = []
  next = classTrie.get codePointAt(string, index)
  for i in [index - 1..-1] by -1
    # check for already processed high surrogates
    continue if isSurrogate(string, i)

    prev = classTrie.get(codePointAt(string, i))
    switch shouldBreak(true) prev, mid, next
      when BreakType.Break
        return i + mid.length + 1
      when BreakType.BreakStart
        return i + 1
      when BreakType.BreakLastRegional
        offset = getUnicodeByteOffset(string, i, mid.concat(next).lastIndexOf(Regional_Indicator) + 1)
        return offset
      when BreakType.BreakPenultimateRegional
        return getUnicodeByteOffset(string, i, mid.concat(next).lastIndexOf(Regional_Indicator))

    mid.unshift prev

# Breaks the given string into an array of grapheme cluster strings
exports.break = (str) ->
  res = []
  index = 0

  while (brk = exports.nextBreak(str, index)) < str.length
    res.push str.slice(index, brk)
    index = brk

  if index < str.length
    res.push str.slice(index)

  return res

# Returns the number of grapheme clusters there are in the given string
exports.countBreaks = (str) ->
  count = 0
  index = 0

  while (brk = exports.nextBreak(str, index)) < str.length
    index = brk
    count++

  if index < str.length
    count++

  return count
