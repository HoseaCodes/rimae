<#
Set GitHub repository secrets using GitHub CLI (`gh`).

Usage:
  - To set secrets by prompting:
      ./scripts/set-github-secrets.ps1

  - To set secrets from current environment variables:
      ./scripts/set-github-secrets.ps1 -FromEnv

Requirements:
  - GitHub CLI `gh` installed and authenticated (run `gh auth login`).
#>

param(
    [string]$Repo = "",
    [switch]$FromEnv
)

function Fail($msg){ Write-Error $msg; exit 1 }

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Fail "GitHub CLI 'gh' is required. Install from https://github.com/cli/cli" }

if (-not $Repo) {
    $Repo = gh repo view --json nameWithOwner -q .nameWithOwner 2>$null
    if (-not $Repo) { Fail "Unable to detect repo. Provide -Repo owner/repo or run inside a cloned repo." }
}

Write-Host "Setting secrets on repository: $Repo"

if ($FromEnv) {
    $url = $Env:NEXT_PUBLIC_SUPABASE_URL
    $anon = $Env:NEXT_PUBLIC_SUPABASE_ANON_KEY
    $service = $Env:SUPABASE_SERVICE_ROLE_KEY
} else {
    $url = Read-Host "NEXT_PUBLIC_SUPABASE_URL"
    $anon = Read-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    $service = Read-Host "SUPABASE_SERVICE_ROLE_KEY"
}

if (-not $url) { Fail "NEXT_PUBLIC_SUPABASE_URL is empty" }
if (-not $anon) { Fail "NEXT_PUBLIC_SUPABASE_ANON_KEY is empty" }
if (-not $service) { Fail "SUPABASE_SERVICE_ROLE_KEY is empty" }

gh secret set NEXT_PUBLIC_SUPABASE_URL --repo $Repo --body "$url"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo $Repo --body "$anon"
gh secret set SUPABASE_SERVICE_ROLE_KEY --repo $Repo --body "$service"

Write-Host "Secrets set successfully."
