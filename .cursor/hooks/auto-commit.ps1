$ErrorActionPreference = "Stop"

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

# Auto-sync: push to current branch's upstream when available.
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ([string]::IsNullOrWhiteSpace($branch) -or $branch -eq "HEAD") {
  exit 0
}

git rev-parse --abbrev-ref --symbolic-full-name "@{u}" *> $null
if ($LASTEXITCODE -eq 0) {
  git push origin $branch *> $null
} else {
  git push -u origin $branch *> $null
}

exit 0
