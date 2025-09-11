# Code Tutor CLI

설치 즉시 사용 가능한 대화형 코딩 튜터 CLI입니다. 내장 Transformers 백엔드(무료, 오픈모델)로 별도 서버 없이 바로 동작하며, 첫 실행 시 모델 가중치를 자동 다운로드합니다.

## 설치

- 전역 설치: `npm install -g code-tutor-cli`

## 빠른 시작

- 대화 모드 실행: `ct chat`
  - 첫 실행 시 내장 모델(기본: `Xenova/Qwen2-0.5B-Instruct`) 가중치를 자동 다운로드합니다. 인터넷이 필요하며, 다운로드 후에는 오프라인에서도 사용 가능합니다.
  - 학습 난이도 모드(초등/중학/고등/대학/일반)를 선택한 뒤 질문을 입력하세요.

예시
```
ct chat
ct[elem] > 파이썬으로 구구단 코드 만들어줘
```

## 명령어

- `ct chat`      대화형 모드(기본: 내장 Transformers)
- `ct quest`     학습 문제 생성/채점(실행 중심)
- `ct doctor`    코드 실행 오류 수집 및(선택) 수정 가이드

## 설정(선택)

- 사용자 설정 파일: `~/.codetutor/config.json`
- 기본 제공자(provider)는 `transformers`이며, 기본 모델은 `Xenova/Qwen2-0.5B-Instruct`입니다.
- 필요 시 다음과 같이 수정할 수 있습니다.

```json
{
  "provider": "transformers",
  "transformers": {
    "modelPrimary": "Xenova/Qwen2-0.5B-Instruct",
    "maxNewTokens": 256,
    "temperature": 0.7
  }
}
```

## 참고

- 첫 실행 시 모델 다운로드 시간이 다소 소요될 수 있습니다(네트워크 필요). 이후에는 캐시되어 빠르게 동작합니다.
- CPU만으로 동작하며, 장시간 대화/코드 생성 시 성능은 시스템 사양에 따라 달라질 수 있습니다.