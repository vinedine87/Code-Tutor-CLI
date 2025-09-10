# Code Tutor CLI

자연어 질문 → 난이도별 코드 예시/해설, 실습 문제(Coding Quest) 채점, 디버깅(Bug Doctor) 가이드를 제공하는 터미널 도구입니다. 로컬 Ollama 모델(Qwen2/Llama3/StarCoder2)과 연동하여 오프라인 친화적으로 동작합니다.

## 설치

1) Node.js LTS(>=18) 설치
2) 의존성 설치
```
npm i
```
3) 도움말
```
node bin/ct.js --help
```

## Ollama 준비(튜터/닥터 AI 기능)

기본 엔드포인트: `http://127.0.0.1:11434`
```
ollama serve
ollama pull qwen2:7b
```

환경변수로 커스터마이즈
- `CT_OLLAMA_HOST`(기본 127.0.0.1)
- `CT_OLLAMA_PORT`(기본 11434)
- `CT_MODEL_PRIMARY`(기본 qwen2:7b)
- `CT_MODEL_CODE`(기본 starcoder2:7b)
- `CT_TIMEOUT_MS`(기본 60000)

## 사용법

### Tutor(학습)

자연어 질문에 답변을 출력하고, 선택적으로 실행 가능한 코드 파일을 생성합니다.
```
# 기본(파이썬 예시 생성)
ct tutor "리스트에서 최대값 구하기" --level elem --lang python --runnable

# 여러 언어 파일 동시 생성(.py, .c, .java)
ct tutor "리스트에서 최대값 구하기" --level elem --langs py,c,java --runnable

# 파일명 지정(예: gugudan.py/c/Java)
ct tutor "파이썬으로 구구단" --langs py,c,java --basename gugudan --runnable

# AI 호출 없이 파일만 생성(네트워크/모델 불필요)
ct tutor "샘플" --no-ai --langs py,c,java --runnable
```

### Quest(실습)

문제 생성 후, 학생 코드를 실행하여 간단 채점합니다.
```
# 문제 생성
ct quest new "문자열 뒤집기" --level elem --lang python

# 채점 실행
ct quest run quests/<id> --file my.py --timeout 3
```

### Doctor(디버깅)

코드를 실행하여 에러를 수집하고, 옵션으로 AI 수정 가이드를 제공합니다.
```
ct doctor src/main.py --lang python --explain
```

### Models(Ollama)
```
ct models --list
ct models --pull qwen2:7b   # 안내만 출력, 실제 pull은 터미널에서 실행
```

## 실행 가이드(언어별)
- Python: `python <file>.py`
- C: `gcc -O2 -std=c11 -o main <file>.c && ./main`
- C++: `g++ -O2 -std=c++17 -o main <file>.cpp && ./main`
- Java: `javac <ClassName>.java && java <ClassName>`
- JS: `node <file>.mjs`

## 디렉터리 구조
- `bin/ct.js`: 엔트리
- `src/cli/*.js`: 명령 구현(tutor/quest/doctor/models)
- `src/ai/ollama.js`: Ollama REST 클라이언트
- `src/tutor/prompt.js`: 난이도별 프롬프트
- `src/generate/codegen.js`: 실행 가능한 코드/README 생성
- `src/config/index.js`: 설정 로더
- `src/utils/fs.js`: 경로/파일 유틸
- `docs/`: PRD/TRD/PROMPTS 문서

## 패키징/배포
- 단일 실행파일: `npm run build:pkg`  → `dist/ct-*`
- npm 배포: `npm publish` (필요 시 `files` 필드 조정)

## 트러블슈팅
- “Ollama 연결 실패”: `ollama serve` 실행 여부, 포트/방화벽 확인
- Windows에서 한글 경로 깨짐: PowerShell 7/UTF-8 권장
- `ora is not a function`: 의존성 버전 확인(본 프로젝트는 ora@5)

