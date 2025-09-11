# TRD - Code Tutor CLI

## 1. 개발 환경
- 언어: Node.js (LTS)
- CLI 프레임워크: Commander.js
- 패키징: npm publish + pkg(윈도우/Linux/macOS 실행파일)
- IDE: Cursor (AI 코드 어시스트 + GitHub 연동)

## 2. AI 모델 선택
- 온라인 추론(Hugging Face Inference) 기반
  - 예시: HuggingFaceH4/zephyr-7b-beta, Llama 3 Instruct, Gemma 2 IT 등
  - 한국어 지원 모델을 우선 고려

## 3. 실행 환경
- Hugging Face Inference API 호출(Node.js 공식 SDK 사용)

## 4. 명령 개요
- tutor: 자연어 → 코드 예시 + 난이도별 해설, 선택적으로 실행 파일 생성
- quest: 문제팩 생성/실행(자동 채점)
- doctor: 실행 실패 로그 기반 원인 분석 및 수정 가이드
- models: (삭제) 온라인 전용으로 단순화

