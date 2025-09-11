#!/usr/bin/env node
// Postinstall notice: brief setup hint for Hugging Face token.
try {
  const lines = [
    '',
    '[Code Tutor CLI] 온라인 사용을 위해 HF_API_TOKEN을 설정하세요.',
    '- 발급: https://huggingface.co/settings/tokens (Read 권한)',
    '- 예: Windows Git Bash  => export HF_API_TOKEN="hf_xxx"',
    '      PowerShell       => setx HF_API_TOKEN "hf_xxx" (새 터미널)',
    '      macOS/Linux(zsh) => echo "export HF_API_TOKEN=hf_xxx" >> ~/.zshrc',
    ''
  ];
  console.log(lines.join('\n'));
} catch (_) {
  // ignore
}

