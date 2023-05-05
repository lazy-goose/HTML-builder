const fs = require('fs');
const path = require('path');
const readline = require('readline');

const writeStream = fs.createWriteStream(path.join(__dirname, 'out.txt'));

const rl = readline.createInterface({ input: process.stdin });

const exit = () => {
  rl.close();
  console.log();
  console.log('See you in the next check...');
};

console.log('Type "exit" or press <Ctrl>+C to end');
console.log();

rl.on('line', (read) => {
  if (read.trimEnd() === 'exit') {
    exit();
    return;
  }
  writeStream.write(read + '\n');
});

process.on('SIGINT', exit);
