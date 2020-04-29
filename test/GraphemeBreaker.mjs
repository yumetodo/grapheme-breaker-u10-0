import GraphemeBreaker from '../src/GraphemeBreaker.mjs'
import chai from 'chai'
import fs from 'fs'
import punycode from 'punycode'

const __dirname = 'test'
const expect = chai.expect

describe('GraphemeBreaker', function() {
  it('basic test', function() {
    var broken;
    broken = GraphemeBreaker.break('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞');
    return expect(broken).to.deep.equal(['Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍', 'A̴̵̜̰͔ͫ͗͢', 'L̠ͨͧͩ͘', 'G̴̻͈͍͔̹̑͗̎̅͛́', 'Ǫ̵̹̻̝̳͂̌̌͘', '!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞']);
  });
  it('nextBreak', function() {
    var brk, index, res, str;
    str = 'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞';
    index = 0;
    res = [];
    while ((brk = GraphemeBreaker.nextBreak(str, index)) < str.length) {
      res.push(str.slice(index, brk));
      index = brk;
    }
    res.push(str.slice(index));
    return expect(res).to.deep.equal(['Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍', 'A̴̵̜̰͔ͫ͗͢', 'L̠ͨͧͩ͘', 'G̴̻͈͍͔̹̑͗̎̅͛́', 'Ǫ̵̹̻̝̳͂̌̌͘', '!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞']);
  });
  it('nextBreak intermediate indexes', function() {
    var breaks, brk, i, j, ref, str;
    str = 'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞';
    breaks = {};
    for (i = j = -1, ref = str.length; j < ref; i = j += 1) {
      brk = GraphemeBreaker.nextBreak(str, i);
      breaks[brk] = brk;
    }
    return expect(Object.keys(breaks).map(function(b) {
      return breaks[b];
    })).to.deep.equal([0, 19, 28, 34, 47, 58, 75]);
  });
  it('previousBreak', function() {
    var brk, index, res, str;
    str = 'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞';
    index = str.length;
    res = [];
    while ((brk = GraphemeBreaker.previousBreak(str, index)) > 0) {
      res.push(str.slice(brk, index));
      index = brk;
    }
    res.push(str.slice(0, index));
    return expect(res).to.deep.equal(['Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍', 'A̴̵̜̰͔ͫ͗͢', 'L̠ͨͧͩ͘', 'G̴̻͈͍͔̹̑͗̎̅͛́', 'Ǫ̵̹̻̝̳͂̌̌͘', '!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞'].reverse());
  });
  it('previousBreak intermediate indexes', function() {
    var breaks, brk, i, j, ref, str;
    str = 'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞';
    breaks = {};
    for (i = j = ref = str.length + 1; j >= 0; i = j += -1) {
      brk = GraphemeBreaker.previousBreak(str, i);
      breaks[brk] = brk;
    }
    return expect(Object.keys(breaks).map(function(b) {
      return breaks[b];
    })).to.deep.equal([0, 19, 28, 34, 47, 58, 75]);
  });
  it('previousBreak handles astral characters (e.g. emoji)', function() {
    var brk, index, res, str;
    str = '👩‍❤️‍👩😜🇺🇸👍🏻';
    res = [];
    index = str.length;
    while ((brk = GraphemeBreaker.previousBreak(str, index)) > 0) {
      res.push(str.slice(brk, index));
      index = brk;
    }
    res.push(str.slice(0, index));
    return expect(res).to.deep.equal(['👍🏻', '🇺🇸', '😜', '👩‍❤️‍👩']);
  });
  it('nextBreak handles astral characters (e.g. emoji)', function() {
    var brk, index, res, str;
    str = '👩‍❤️‍👩😜🇺🇸👍🏻';
    res = [];
    index = 0;
    while ((brk = GraphemeBreaker.nextBreak(str, index)) < str.length) {
      res.push(str.slice(index, brk));
      index = brk;
    }
    res.push(str.slice(index));
    return expect(res).to.deep.equal(['👩‍❤️‍👩', '😜', '🇺🇸', '👍🏻']);
  });
  it('should pass all tests in GraphemeBreakTest.txt', function() {
    var codePoints, cols, comment, data, expected, j, len, line, lines, results, str;
    data = fs.readFileSync(__dirname + '/GraphemeBreakTest.txt', 'utf8');
    lines = data.split('\n');
    results = [];
    for (j = 0, len = lines.length; j < len; j++) {
      line = lines[j];
      if (!line || /^#/.test(line)) {
        continue;
      }
      [cols, comment] = line.split('#');
      codePoints = cols.split(/\s*[×÷]\s*/).filter(Boolean).map(function(c) {
        return parseInt(c, 16);
      });
      str = punycode.ucs2.encode(codePoints);
      expected = cols.split(/\s*÷\s*/).filter(Boolean).map(function(c) {
        var codes;
        codes = c.split(/\s*×\s*/);
        codes = codes.map(function(c) {
          return parseInt(c, 16);
        });
        return punycode.ucs2.encode(codes);
      });
      comment = comment.trim();
      expect(GraphemeBreaker.break(str)).to.deep.equal(expected, comment);
      results.push(expect(GraphemeBreaker.countBreaks(str)).to.equal(expected.length, comment));
    }
    return results;
  });
  it('should pass all tests in GraphemeBreakTest.txt in reverse', function() {
    var brk, codePoints, cols, comment, data, expected, index, j, len, line, lines, res, results, str;
    data = fs.readFileSync(__dirname + '/GraphemeBreakTest.txt', 'utf8');
    lines = data.split('\n');
    results = [];
    for (j = 0, len = lines.length; j < len; j++) {
      line = lines[j];
      if (!line || /^#/.test(line)) {
        continue;
      }
      [cols, comment] = line.split('#');
      codePoints = cols.split(/\s*[×÷]\s*/).filter(Boolean).map(function(c) {
        return parseInt(c, 16);
      });
      str = punycode.ucs2.encode(codePoints);
      expected = cols.split(/\s*÷\s*/).filter(Boolean).map(function(c) {
        var codes;
        codes = c.split(/\s*×\s*/);
        codes = codes.map(function(c) {
          return parseInt(c, 16);
        });
        return punycode.ucs2.encode(codes);
      });
      res = [];
      index = str.length;
      while ((brk = GraphemeBreaker.previousBreak(str, index)) > 0) {
        res.push(str.slice(brk, index));
        index = brk;
      }
      res.push(str.slice(0, index));
      results.push(expect(res).to.deep.equal(expected.reverse(), comment.trim()));
    }
    return results;
  });
  it('should pass all tests in emoji-test.txt', function() {
    var codePoints, cols, comment, data, j, len, line, lines, results, str;
    data = fs.readFileSync(__dirname + '/emoji-test.txt', 'utf8');
    lines = data.split('\n');
    results = [];
    for (j = 0, len = lines.length; j < len; j++) {
      line = lines[j];
      if (!line || /^#/.test(line)) {
        continue;
      }
      [cols, comment] = line.split(';');
      codePoints = cols.split(/\s+/).filter(Boolean).map(function(c) {
        return parseInt(c, 16);
      });
      str = punycode.ucs2.encode(codePoints);
      comment = comment.trim();
      expect(GraphemeBreaker.break(str)).to.deep.equal([str], comment);
      expect(GraphemeBreaker.countBreaks(str)).to.equal(1, comment);
      results.push(expect(GraphemeBreaker.nextBreak(str)).to.equal(str.length, comment));
    }
    return results;
  });
  return it('should pass all tests in emoji-test.txt in reverse', function() {
    var codePoints, cols, comment, data, j, len, line, lines, results, str;
    data = fs.readFileSync(__dirname + '/emoji-test.txt', 'utf8');
    lines = data.split('\n');
    results = [];
    for (j = 0, len = lines.length; j < len; j++) {
      line = lines[j];
      if (!line || /^#/.test(line)) {
        continue;
      }
      [cols, comment] = line.split(';');
      codePoints = cols.split(/\s+/).filter(Boolean).map(function(c) {
        return parseInt(c, 16);
      });
      str = punycode.ucs2.encode(codePoints);
      comment = comment.trim();
      expect(GraphemeBreaker.break(str)).to.deep.equal([str], comment);
      expect(GraphemeBreaker.countBreaks(str)).to.equal(1, comment);
      results.push(expect(GraphemeBreaker.previousBreak(str, str.length)).to.equal(0, comment));
    }
    return results;
  });
});
