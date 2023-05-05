const fs = require('fs');
const path = require('path');
const process = require('process');

fs.createReadStream(path.join(__dirname, 'text.txt'))
  .on('data', (data) => {
    process.stdout.write(data);
  })
  .on('end', () => {
    // If we don’t put the break line at the end we will get a weird character after our string
    process.stdout.write('\n');
  });
