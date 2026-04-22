$ErrorActionPreference = "Stop"

$lockPath = ".cursor/hooks/.auto-sync.lock"
$lastErrorPath = ".cursor/hooks/last-sync-error.log"

if (Test-Path $lockPath) {
  exit 0
}

New-Item -ItemType File -Path $lockPath -Force | Out-Null

try {
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

  $changedFiles = @(git diff --cached --name-only)
  $changedText = ($changedFiles -join "`n")

  # Decide commit type automatically.
  $type = "chore"
  if ($changedText -match "(^|`n)README\.md$|(^|`n).*\.md$") {
    $type = "docs"
  }
  if ($changedText -match "(^|`n)src/|(^|`n)supabase/|(^|`n)utils/|(^|`n).*\.tsx?$|(^|`n).*\.jsx?$") {
    $type = "feat"
  }

  $stagedDiff = git diff --cached
  if ($stagedDiff -match "(?i)\bfix\b|\bbug\b|\berror\b|\bresolve\b|\bhotfix\b") {
    $type = "fix"
  }

  # Build check for app-impacting changes before commit/push.
  $needsBuild = $false
  foreach ($file in $changedFiles) {
    if ($file -match "^src/" -or $file -match "^utils/" -or $file -match "^supabase/" -or $file -match "^package(-lock)?\.json$" -or $file -match "^vite\.config\.(ts|js|mjs)$" -or $file -match "^postcss\.config\.(js|mjs|ts)$") {
      $needsBuild = $true
      break
    }
  }

  if ($needsBuild -and (Test-Path "package.json")) {
    npm run build *> $null
    if ($LASTEXITCODE -ne 0) {
      $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
      "[$now] Auto-sync build failed. Commit/push skipped." | Out-File -FilePath $lastErrorPath -Encoding utf8
      exit 0
    }
  }

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $message = "${type}: auto-sync $timestamp"
  git commit -m $message *> $null
  if ($LASTEXITCODE -ne 0) {
    exit 0
  }

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
} finally {
  if (Test-Path $lockPath) {
    Remove-Item $lockPath -Force
  }
}

exit 0
