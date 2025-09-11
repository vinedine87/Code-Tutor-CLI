# Code Tutor CLI

AI 튜터/연습/도우미 CLI (Ollama 연동)

## 설치

- 전역 설치: npm에 배포 후 다음으로 설치합니다
  - `npm install -g code-tutor-cli`
- 로컬(개발 중) 전역 설치:
  - 레포 루트에서 `npm install -g .`

설치 시 Ollama 미설치가 감지되면 OS별 설치/실행/모델 준비 가이드를 출력합니다.

## Ollama 준비(필수)

1) 서버 실행: `ollama serve`
2) 기본 모델 다운로드: `ollama pull qwen2:7b`

환경 변수(선택):
- `CT_OLLAMA_HOST` (기본 127.0.0.1)
- `CT_OLLAMA_PORT` (기본 11434)
- `CT_MODEL_PRIMARY` (기본 qwen2:7b)
- `CT_TIMEOUT_MS` (기본 60000)

## 빠른 시작

- 도움말: `ct --help`
- 대화형: `ct chat`
  - 모드(초/중/고/대/일반) 선택 → 핵심 명령어 안내 → 자연어 대화

### ct tutor

질문 설명 + 실행 가능한 예제 코드/README 생성

```
ct tutor "리스트 최대값 구하는 법" --level elem --lang python --runnable
ct tutor "구구단" --langs py,c,java --basename gugudan --runnable
ct tutor "정렬 알고리즘" --no-ai --lang javascript --runnable
```

### ct quest

학습 문제 생성/채점

```
ct quest new "리스트 최대값" --level elem --lang python
ct quest run <퀘스트ID> --file my_solution.py --timeout 3
```

### ct doctor

코드 실행 → 오류 수집 → (선택) AI 설명/수정 가이드

```
ct doctor src/main.py --lang python --explain
```

### ct models

Ollama 모델 관리

```
ct models --list
ct models --pull qwen2:7b
```

## 구조

- `bin/ct.js`: CLI 엔트리
- `src/cli/*`: 서브커맨드 구현 (tutor, quest, doctor, models)
- `src/ai/ollama.js`: Ollama REST API 클라이언트
- `src/tutor/prompt.js`: 튜터 프롬프트 빌더
- `src/generate/codegen.js`: 코드/README 생성 유틸
- `src/config/index.js`: 설정 로딩/병합
- `src/utils/fs.js`: 파일/디렉터리 유틸

## 배포 준비

`package.json`의 `files`, `bin`, `postinstall`이 설정되어 있습니다. 퍼블리시:

```
npm publish
```

## 참고

- Ollama 연결 오류 시: `ollama serve` 실행, `ollama pull qwen2:7b`로 모델 준비
- Windows PowerShell에서 파이프/리다이렉션은 `Get-Content ... | node ...` 형태로 사용

