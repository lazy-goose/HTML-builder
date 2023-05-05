const fs = require('fs');
const path = require('path');
const process = require('process');

fs
    .createReadStream(path.join(__dirname, 'text.txt'))
    .on('end', () => process.stdout.write('\n'))
    .pipe(process.stdout)
