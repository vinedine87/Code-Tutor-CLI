const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'TEST> '
});

console.log('안녕하세요! readline 테스트입니다. 메시지를 입력해주세요.\n');
rl.prompt();

rl.on('line', (line) => {
  console.log(`입력받은 메시지: ${line.trim()}`);
  rl.prompt();
}).on('close', () => {
  console.log('readline 테스트를 종료합니다.\n');
  process.exit(0);
});
