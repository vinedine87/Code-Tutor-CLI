function buildTutorMessages({ question, level = 'elem', lang = 'python' }) {
  const levelGuide = levelToGuide(level);
  const sys = [
    '당신은 친절한 코딩 튜터입니다.',
    `학습 레벨: ${levelGuide.name}. 말투/깊이를 레벨에 맞추세요.`,
    '구성: 개념 → 코드 → 실행 예시 → 오해 포인트 → 연습문제',
    `코드 언어 우선: ${lang}`
  ].join('\n');

  const user = [
    `질문: ${question}`,
    `요청: 난이도(${levelGuide.name})에 맞춘 설명과 실행 가능한 예제 코드 1개 작성`,
    '출력 형식: 짧은 요약 → 코드 블록 → 실행 예시 1~2개 → 연습문제 1개'
  ].join('\n');

  return [
    { role: 'system', content: sys },
    { role: 'user', content: user }
  ];
}

function levelToGuide(level) {
  const map = {
    elem: { name: '초등', detail: '쉬운 어휘, 짧은 코드, 풍부한 주석' },
    middle: { name: '중등', detail: '기본 문법, 조건/반복, 간단 함수' },
    high: { name: '고등', detail: '알고리즘 개념, 복잡도 간단 표기' },
    college: { name: '대학', detail: '자료구조/예외처리, 테스트 스텁' },
    basic: { name: '일반 기초', detail: '실무 톤 간결 설명, 베스트프랙티스' }
  };
  return map[level] || map.elem;
}

module.exports = { buildTutorMessages };

