# TRD - Code Tutor CLI

## 1. 개발 환경
- 언어: Node.js (LTS)
- CLI 프레임워크: Commander.js
- 패키징: npm publish + pkg(윈도우/Linux/macOS 실행파일)
- IDE: Cursor (AI 코드 어시스트 + GitHub 연동)

## 2. AI 모델 선택
- 기본 모델(로컬/무료 우선)
  - Qwen2-7B: 한국어 이해력 우수, 학생 학습용 적합
  - Llama 3 8B: 범용성, Ollama에서 쉽게 실행
- 코드 생성 보조
  - StarCoder2-7B: 코드 생성/설명 최적화

## 3. 실행 환경
- Ollama 로컬 모델 실행(Windows/Linux/macOS)
- Node.js에서 axios로 로컬 REST API 호출

## 4. 명령 개요
- tutor: 자연어 → 코드 예시 + 난이도별 해설, 선택적으로 실행 파일 생성
- quest: 문제팩 생성/실행(자동 채점)
- doctor: 실행 실패 로그 기반 원인 분석 및 수정 가이드
- models: 로컬 모델 목록 조회, pull 안내

