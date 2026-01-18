const fs = require('fs');
const TurndownService = require('turndown');
const turndown = new TurndownService({ headingStyle: 'atx' });

const html = fs.readFileSync('tools/input.html', 'utf8');
const md = turndown.turndown(html);

fs.writeFileSync('tools/output.md', md);
console.log('Done: tools/output.md');
