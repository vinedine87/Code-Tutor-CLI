# Code Tutor CLI

설치 즉시 사용 가능한 대화형 코딩 튜터 CLI입니다. 온라인(Hugging Face Inference) 전용으로 동작합니다.

## 설치

- 전역 설치: `npm install -g code-tutor-cli`

## 빠른 시작

- 대화 모드 실행: `ct chat`
  - `HF_API_TOKEN`을 설정해 Hugging Face Inference를 사용합니다.
  - 학습 난이도 모드(초등/중학/고등/대학/일반)를 선택한 뒤 질문을 입력하세요.

온라인 모델 사용(기본)
- Hugging Face Inference: `HF_API_TOKEN=... ct chat`

예시
```
ct chat
ct[elem] > 파이썬으로 구구단 코드 만들어줘
```

## 명령어

- `ct chat`      대화형 모드(온라인 전용: Hugging Face Inference)
- `ct quest`     학습 문제 생성/채점(실행 중심)
- `ct doctor`    코드 실행 오류 수집 및(선택) 수정 가이드

## 설정(선택)

- 사용자 설정 파일: `~/.codetutor/config.json`
- 기본 제공자(provider)는 `huggingface`입니다. 사용자 설정 파일(`~/.codetutor/config.json`)에서 모델 등을 조정할 수 있습니다.
```json
{
  "provider": "huggingface",
  "huggingface": {
    "modelPrimary": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    "maxNewTokens": 256,
    "temperature": 0.7
  }
}
```

## 참고

- 네트워크 상태 및 모델/요청 크기에 따라 응답 시간이 달라질 수 있습니다.

## 릴리즈/검증(개발자용)

- 버전/파일 검증: `npm run smoke` (CLI 진입/의존성 확인)
- API 스모크: `HF_API_TOKEN=... npm run smoke:api` (토큰 없으면 자동 스킵)
- 배포 전 점검: `npm run prepublishOnly` (필수 파일/의존성 정책 검사)

## Windows(Git Bash, MINGW64) 설치/실행 순서

1) 패키지 설치
```
npm install -g code-tutor-cli
```

2) Hugging Face 토큰 발급(로그인 필요)
- 링크: https://huggingface.co/settings/tokens → New token → 권한 Read

3) 현재 세션에 토큰 등록(즉시 반영)
```
export HF_API_TOKEN="hf_발급받은_토큰값"
```

4) 영구 등록(선택)
```
echo 'export HF_API_TOKEN="hf_발급받은_토큰값"' >> ~/.bashrc && source ~/.bashrc
```

5) 실행
```
ct chat
```

문제 해결 팁
- 모델 페이지에서 사용 약관 동의가 필요한 경우, 해당 모델 페이지에서 먼저 동의해야 API 호출이 정상 동작합니다.
- 토큰 오타/만료 여부와 네트워크 상태를 확인하세요.

## Windows(PowerShell) 설치/실행 순서

1) 패키지 설치
```
npm install -g code-tutor-cli
```

2) Hugging Face 토큰 발급(로그인 필요)
- 링크: https://huggingface.co/settings/tokens → New token → 권한 Read

3) 현재 세션에 토큰 등록(즉시 반영)
```
$env:HF_API_TOKEN = "hf_발급받은_토큰값"
```

4) 영구 등록(새 터미널부터 적용)
```
setx HF_API_TOKEN "hf_발급받은_토큰값"
```

5) 실행
```
ct chat
```

문제 해결 팁
- `echo $env:HF_API_TOKEN`로 값 확인, 새 터미널 필요 여부 확인.
- 모델 약관 동의/네트워크 상태 점검.

## Windows(CMD) 설치/실행 순서

1) 설치: `npm install -g code-tutor-cli`

2) 현재 세션 등록: `set HF_API_TOKEN=hf_발급받은_토큰값`

3) 영구 등록: `setx HF_API_TOKEN "hf_발급받은_토큰값"` (새 창 필요)

4) 실행: `ct chat`

## macOS(zsh) 설치/실행 순서

1) 설치: `npm install -g code-tutor-cli`

2) 현재 세션 등록
```
export HF_API_TOKEN="hf_발급받은_토큰값"
```

3) 영구 등록
```
echo 'export HF_API_TOKEN="hf_발급받은_토큰값"' >> ~/.zshrc && source ~/.zshrc
```

4) 실행: `ct chat`

## Linux(bash) 설치/실행 순서

1) 설치: `npm install -g code-tutor-cli`

2) 현재 세션 등록
```
export HF_API_TOKEN="hf_발급받은_토큰값"
```

3) 영구 등록
```
echo 'export HF_API_TOKEN="hf_발급받은_토큰값"' >> ~/.bashrc && source ~/.bashrc
```

4) 실행: `ct chat`
