import fs from 'fs'
import fetch from 'node-fetch'
import UnicodeTrieBuilder from 'unicode-trie/builder.js'

//v10.0.0
//{"Other":0,"Prepend":1,"CR":2,"LF":3,"Control":4,"Extend":5,"Regional_Indicator":6,"SpacingMark":7,"L":8,"V":9,"T":10,"LV":11,"LVT":12,"E_Base":13,"E_Modifier":14,"ZWJ":15,"Glue_After_Zwj":16,"E_Base_GAZ":17}}
//v13.0.0
//{"Other":0,"Prepend":1,"CR":2,"LF":3,"Control":4,"Extend":5,"Regional_Indicator":6,"SpacingMark":7,"L":8,"V":9,"T":10,"LV":11,"LVT":12,"ZWJ":13}}

const main = async function() {
  const UNICODE_VERSION = '13.0.0'
  //const UNICODE_VERSION = '10.0.0'
  const url = `https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/auxiliary/GraphemeBreakProperty.txt`
  console.log(url)

  const data = await (await fetch(url)).text()
  
  const re = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([A-Za-z_]+)/gm
  let nextClass = 1
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
    const type = match[3]
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
  fs.writeFileSync(`./classes-v${UNICODE_VERSION}.mjs`, 'export default ' + JSON.stringify(output))

  const key = []
  for (const n in classes) {
    key.push(n)
  }
  console.log('const { ' + key.join(', ') + '} = classesmjs.classes')
}
main()
