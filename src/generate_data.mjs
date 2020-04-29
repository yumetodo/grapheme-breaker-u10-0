// orginal

import fs from 'fs'
import fetch from 'node-fetch'
import UnicodeTrieBuilder from 'unicode-trie/builder.js'

const main = async function() {
  const UNICODE_VERSION = '10.0.0'
  //UNICODE_VERSION = '13.0.0' // not supported yet

  const BASE_URL = `http://www.unicode.org/Public/${UNICODE_VERSION}/ucd`

  // for Unicode 8.0.0 and parses it to combine ranges and generate
  //const url = `${BASE_URL}/auxiliary/GraphemeBreakProperty-10.0.0d13.txt` // not found
  const url = `${BASE_URL}/auxiliary/GraphemeBreakProperty.txt`

  const data = await (await fetch(url)).text()
  const re = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([A-Za-z_]+)/gm;
  let nextClass = 1;
  const classes = {
    Other: 0
  }
  const trie = new UnicodeTrieBuilder(classes.Other)
  // collect entries in the table into ranges to keep things smaller.
  let match = null
  while (match = re.exec(data)) {
    const start = match[1]
    const ref = match[2]
    const end = ref ? ref : start
    const type = match[3];
    if (classes[type] == null) {
      classes[type] = nextClass++
    }
    trie.setRange(parseInt(start, 16), parseInt(end, 16), classes[type])
  }
  const output = {
    trie: trie.toBuffer().toString('base64'),
    classes
  }
  // write the trie and classes to a file
  fs.writeFileSync('./classes.mjs', 'export default ' + JSON.stringify(output))
}
main()
