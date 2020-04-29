//import gsplit from 'https://taisukef.github.io/GraphemeSplitter/GraphemeSplitterJS/StringSplitter.Grapheme.mjs'
//import gsplit from './GraphemeBreaker.js'
import gsplit from '../src/GraphemeBreaker.mjs'

console.log(gsplit.break("👨‍👨‍👧‍👦👩‍👩‍👧‍👦👨‍👨‍👧‍👦"))
console.log(gsplit.break('👩‍❤️‍👩😜🇺🇸👍🏻'))

/*

//const s = 'a\nb'
//const s = "👨‍👨‍👧‍👦"
//const s = "🍓👨‍👨‍👧‍👦🍓"
//const s = "👨‍👨‍👧‍👦👩‍👩‍👧‍👦🇮🇸🇮🇪👨‍⚕️👩🏽‍⚕️👵👨‍❤️‍💋‍👨👩‍👧‍👧"
//const s = "a‍🛑"
//const s = ' 🏻'
//const s = '👩‍❤️‍👩😜🇺🇸👍🏻'
//const s = '👩‍❤️‍👩'
//÷ 200D ÷ 231A ÷	#  ÷ [0.2] ZERO WIDTH JOINER (ZWJ_ExtCccZwj) ÷ [999.0] WATCH (ExtPict) ÷ [0.3]
//const s = '\u200d\u231a' // "⌚"
const s = '\u200D\u0308\u0020'
//const s = '\u0061\u200D\u1F6D1'
//const s = '\u000D\u0308\u034F' // 000D ÷ 0308 × 034F

//const s = 'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢'

console.log(exports.break(s))


const ptest = function(str) {
    var brk, index, res, str;
    index = str.length;
    res = [];
    while ((brk = exports.previousBreak(str, index)) > 0) {
      res.push(str.slice(brk, index));
      index = brk;
    }
    res.push(str.slice(0, index));
    console.log(res)

    //return expect(res).to.deep.equal(['Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍', 'A̴̵̜̰͔ͫ͗͢', 'L̠ͨͧͩ͘', 'G̴̻͈͍͔̹̑͗̎̅͛́', 'Ǫ̵̹̻̝̳͂̌̌͘', '!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞'].reverse());
  }
ptest(s)
*/
/*
for (let i = 0; i < s.length; i++) {
  console.log(i, classTrie.get(codePointAt(s, i)))
}
*/
//ZWJ == 13, ExtPict == 14
