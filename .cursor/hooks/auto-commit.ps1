$ErrorActionPreference = "Stop"

# Consume hook payload from stdin (kept for future filtering needs).
$null = [Console]::In.ReadToEnd()

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
  exit 0
}

# Stage tracked and untracked changes.
git add -A

# Skip commit if nothing is staged.
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$message = "chore: auto-commit $timestamp"
git commit -m $message *> $null

exit 0
