# Code Tutor CLI

설치 즉시 사용 가능한 대화형 코딩 튜터 CLI입니다. 온라인(OpenAI) 전용으로 동작합니다.

## 설치

- 전역 설치: `npm install -g code-tutor-cli`

## 빠른 시작

- 대화 모드 실행: `ct chat`
  - `OPENAI_API_KEY`를 설정해 OpenAI API를 사용합니다.
  - 학습 난이도 모드(초등/중학/고등/대학/일반)를 선택한 뒤 질문을 입력하세요.

온라인 모델 사용(기본)
- OpenAI(기본 모델: gpt-4o-mini): `OPENAI_API_KEY=... ct chat`
  - 다른 모델을 쓰려면: `CT_OPENAI_MODEL=모델이름 ct chat`

예시
```
ct chat
ct[elem] > 파이썬으로 구구단 코드 만들어줘
```

## 명령어

- `ct chat`      대화형 모드(온라인 전용: OpenAI)
- `ct quest`     학습 문제 생성/채점(실행 중심)
- `ct doctor`    코드 실행 오류 수집 및(선택) 수정 가이드

## 설정(선택)

- 사용자 설정 파일: `~/.codetutor/config.json`
- 기본 제공자(provider)는 `openai`입니다. 사용자 설정 파일(`~/.codetutor/config.json`)에서 모델 등을 조정할 수 있습니다.
```json
{
  "provider": "openai",
  "openai": {
    "modelPrimary": "gpt-4o-mini",
    "maxTokens": 256,
    "temperature": 0.7
  }
}
```

### 에디터 연동(파일 자동 열기)
- 기본: VS Code로 파일을 엽니다. `code -r -g <file>` 사용(열려 있는 창 재사용, 위치 이동).
- VS Code가 없고 Windows인 경우: 메모장(`notepad`)으로 엽니다.
- 그 외: OS 기본 앱으로 엽니다(macOS `open`, Linux `xdg-open`).
- 사용자 지정 예시:
  - PowerShell: `setx CT_EDITOR "code -r -g"` (새 터미널 필요)
  - Git Bash/zsh: `export CT_EDITOR="code -r -g"`

### 사용량/비용 표시(선택)
- 대화 중 토큰 사용량과 대략 비용을 보고 싶다면 다음을 사용하세요.
  - 채팅 시작 시: `ct chat --show-usage` 또는 환경변수 `CT_SHOW_USAGE=1 ct chat`
  - 채팅 중 토글: `/usage on` 또는 `/usage off`
- 표시 내용: `model, prompt/completion/total 토큰, 추정 비용(USD)`
- 주의: 비용은 공개 단가 기준의 대략 추정이며 실제 청구와 다를 수 있습니다.

## 참고

- 네트워크 상태 및 모델/요청 크기에 따라 응답 시간이 달라질 수 있습니다.

## 릴리즈/검증(개발자용)

- 버전/파일 검증: `npm run smoke` (CLI 진입/의존성 확인)
- API 스모크: `OPENAI_API_KEY=... npm run smoke:api` (키 없으면 자동 스킵)
- 배포 전 점검: `npm run prepublishOnly` (필수 파일/의존성 정책 검사)

## Windows(Git Bash, MINGW64) 설치/실행 순서

1) 패키지 설치
```
npm install -g code-tutor-cli
```

2) OpenAI API 키 발급(로그인 필요)
- 링크: https://platform.openai.com/api-keys

3) 현재 세션에 키 등록(즉시 반영)
```
export OPENAI_API_KEY="sk-발급받은_키값"
```

4) 영구 등록(선택)
```
echo 'export OPENAI_API_KEY="sk-발급받은_키값"' >> ~/.bashrc && source ~/.bashrc
```

5) 실행
```
ct chat
```

문제 해결 팁
- 키 오타/만료 여부와 네트워크 상태를 확인하세요.
- 일시적 오류가 발생하면 잠시 후 재시도하거나 `CT_OPENAI_MODEL`로 다른 모델을 지정하세요.

## Windows(PowerShell) 설치/실행 순서

1) 패키지 설치
```
npm install -g code-tutor-cli
```

2) OpenAI API 키 발급(로그인 필요)
- 링크: https://platform.openai.com/api-keys

3) 현재 세션에 키 등록(즉시 반영)
```
$env:OPENAI_API_KEY = "sk-발급받은_키값"
```

4) 영구 등록(새 터미널부터 적용)
```
setx OPENAI_API_KEY "sk-발급받은_키값"
```

5) 실행
```
ct chat
```

문제 해결 팁
- `echo $env:OPENAI_API_KEY`로 값 확인, 새 터미널 필요 여부 확인.
- 네트워크 상태 점검.

## Windows(CMD) 설치/실행 순서

1) 설치: `npm install -g code-tutor-cli`

2) 현재 세션 등록: `set OPENAI_API_KEY=sk-발급받은_키값`

3) 영구 등록: `setx OPENAI_API_KEY "sk-발급받은_키값"` (새 창 필요)

4) 실행: `ct chat`

## macOS(zsh) 설치/실행 순서

1) 설치: `npm install -g code-tutor-cli`

2) 현재 세션 등록
```
export OPENAI_API_KEY="sk-발급받은_키값"
```

3) 영구 등록
```
echo 'export OPENAI_API_KEY="sk-발급받은_키값"' >> ~/.zshrc && source ~/.zshrc
```

4) 실행: `ct chat`

## Linux(bash) 설치/실행 순서

1) 설치: `npm install -g code-tutor-cli`

2) 현재 세션 등록
```
export OPENAI_API_KEY="sk-발급받은_키값"
```

3) 영구 등록
```
echo 'export OPENAI_API_KEY="sk-발급받은_키값"' >> ~/.bashrc && source ~/.bashrc
```

4) 실행: `ct chat`
