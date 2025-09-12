# Code Tutor CLI

[![npm version](https://img.shields.io/npm/v/code-tutor-cli.svg?style=flat-square)](https://www.npmjs.com/package/code-tutor-cli)
[![License](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](https://opensource.org/licenses/ISC)

**Code Tutor CLI**는 인공지능 기반의 대화형 코딩 튜터로, 학습과 문제 해결을 돕는 강력한 CLI 도구입니다. OpenAI 연동을 통해 다양한 프로그래밍 언어에 대한 질문에 답변하고, 코드 예제를 생성하며, 오류를 진단하고 수정 가이드를 제공합니다. 온라인 전용으로 동작하며, 즉시 설치하여 사용할 수 있습니다.

## 🚀 빠른 시작

`Code Tutor CLI`를 설치하고 대화형 모드를 즉시 시작해보세요!

1.  **전역 설치:**
    ```bash
    npm install -g code-tutor-cli
    ```

2.  **OpenAI API 키 설정:**
    `OPENAI_API_KEY` 환경 변수에 OpenAI API 키를 설정해야 합니다. 자세한 발급 방법은 [OpenAI API Keys](https://platform.openai.com/api-keys)를 참조하세요.

    *   **현재 세션에 등록 (예시: Git Bash, zsh, PowerShell):**
        ```bash
        # Git Bash / zsh
        export OPENAI_API_KEY="sk-YOUR_API_KEY"
        
        # PowerShell
        $env:OPENAI_API_KEY = "sk-YOUR_API_KEY"
        ```
    *   **영구 등록 (선택 사항):**
        사용하는 셸의 설정 파일(예: `~/.bashrc`, `~/.zshrc`)이나 시스템 환경 변수에 영구적으로 등록할 수 있습니다.
        
3.  **대화 모드 실행:**
    ```bash
    ct chat
    ```
    학습 난이도 모드(초등/중학/고등/대학/일반)를 선택한 뒤 AI 튜터와 대화를 시작하세요.

    *(Tip: CLI 사용 예시 GIF 또는 스크린샷을 여기에 추가하면 더욱 좋습니다!)*

### 온라인 모델 설정
기본적으로 `gpt-4o-mini` 모델이 사용됩니다. `CT_OPENAI_MODEL` 환경 변수를 통해 다른 OpenAI 모델을 지정할 수 있습니다.

```bash
CT_OPENAI_MODEL=gpt-3.5-turbo ct chat
```

## 📚 명령어

`ct` CLI는 세 가지 주요 명령어를 제공합니다:

- **`ct chat`**: AI 튜터와의 대화형 모드를 시작합니다 (온라인 전용: OpenAI).
  - 학습 난이도 선택 (`1`~`5` 또는 `elem`, `middle`, `high`, `college`, `adult`).
  - 대화 중 `exit`, `/help`, `/mode`, `/usage on|off` 명령 사용 가능.

- **`ct quest`**: 프로그래밍 학습 문제를 생성하고 자동으로 채점합니다.
  - `ct quest new`: 새로운 학습 문제를 생성합니다.
  - `ct quest run <문제_ID>`: 생성된 문제를 실행하고 해결책을 채점합니다.

- **`ct doctor`**: 코드 실행 중 발생한 오류를 분석하고 AI 기반의 수정 가이드를 제공합니다.
  - 오류 메시지와 스택 트레이스를 기반으로 원인을 진단하고 해결책을 제시합니다.

## ⚙️ 설정

사용자 설정은 `~/.codetutor/config.json` 파일에 저장됩니다. 기본 제공자는 `openai`이며, 이 파일을 통해 모델, 토큰 제한, 온도(temperature) 등 다양한 AI 설정을 조정할 수 있습니다.

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

### 에디터 연동
`ct` CLI는 생성된 코드 파일을 자동으로 선호하는 편집기로 열 수 있습니다. 기본적으로 VS Code를 시도하며, `CT_EDITOR`, `EDITOR`, `VISUAL` 환경 변수를 통해 사용자 지정 편집기를 설정할 수 있습니다.

*   **VS Code (기본):** `code -r -g <file>` 명력으로 열려 있는 VS Code 창을 재사용하고 해당 파일/위치로 이동합니다.
*   **Windows 환경 (VS Code 없을 시):** `notepad`로 파일을 엽니다.
*   **macOS / Linux:** 각 OS의 기본 앱(`open`, `xdg-open`)으로 파일을 엽니다.

#### 사용자 지정 편집기 설정 예시:
*   **PowerShell:** `setx CT_EDITOR "code -r -g"` (새 터미널 필요)
*   **Bash/Zsh:** `export CT_EDITOR="code -r -g"`

### 사용량 및 비용 추정
대화 중 AI 토큰 사용량과 대략적인 비용을 확인할 수 있습니다.

*   **활성화 방법:**
    *   채팅 시작 시: `ct chat --show-usage` 또는 `CT_SHOW_USAGE=1 ct chat`
    *   채팅 중 토글: `/usage on` 또는 `/usage off`
*   **표시 내용:** `model, prompt/completion/total 토큰, 추정 비용(USD)`
*   **주의:** 비용은 공개 단가 기준의 대략적인 추정치이며 실제 청구와 다를 수 있습니다.

## ⚠️ 참고

*   네트워크 상태 및 AI 모델/요청 크기에 따라 응답 시간이 달라질 수 있습니다.
*   본 CLI는 온라인 OpenAI 서비스에 전적으로 의존합니다. 오프라인 또는 로컬 백엔드 지원은 제공되지 않습니다.

## 🛠️ 개발자 가이드

### 릴리즈 및 검증
프로젝트 릴리즈 및 검증을 위한 스크립트:

*   **버전/파일 검증:** `npm run smoke` (CLI 진입 및 기본 의존성 확인)
*   **API 스모크 테스트:** `OPENAI_API_KEY=... npm run smoke:api` (API 키 유효성 및 기본 API 호출 테스트)
*   **배포 전 점검:** `npm run prepublishOnly` (필수 파일 및 의존성 정책 검사)

### Conventional Commits
이 프로젝트는 [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) 사양을 따릅니다. 커밋 메시지는 `feat: 새로운 기능 추가`, `fix: 버그 수정` 등 명확한 유형을 포함해야 합니다.

### 파일 구조
주요 파일 및 디렉토리 구조:
*   `bin/ct.js`: CLI 엔트리 포인트 (`ct chat|quest|doctor` 명령 처리)
*   `src/cli/interactive.js`: 대화형 REPL (모드 선택, AI 호출, 배너 출력)
*   `src/cli/quest.js`: 학습 문제 생성 및 채점 로직
*   `src/cli/doctor.js`: 코드 실행 및 오류 분석, AI 설명 제공
*   `src/ai/provider.js`: AI 클라이언트 (항상 OpenAI 클라이언트를 반환)
*   `src/ai/openai.js`: OpenAI Chat Completions API 래퍼
*   `src/config/index.js`: 설정 관리 (provider=`openai` 고정, OpenAI 설정 유지)
*   `src/utils/fs.js`: 파일 시스템 유틸리티 (안전한 파일 쓰기 등)
*   `docs/`: 프로젝트 문서 (PRD, TRD, PROMPTS 등)

## 📝 라이선스

이 프로젝트는 ISC 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하십시오.
