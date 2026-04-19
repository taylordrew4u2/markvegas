#!/usr/bin/env bash
# Set up this project with Vercel: installs the CLI, logs in, links the
# project, and seeds Turso env vars from a local .env file (if present).

set -euo pipefail

cd "$(dirname "$0")/.."

info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
error() { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

command -v node >/dev/null || error "node is required (>=18). Install from https://nodejs.org"
command -v npm  >/dev/null || error "npm is required. Install Node.js from https://nodejs.org"

if ! command -v vercel >/dev/null; then
  info "Installing Vercel CLI globally"
  npm install -g vercel
else
  info "Vercel CLI already installed ($(vercel --version))"
fi

if ! vercel whoami >/dev/null 2>&1; then
  info "Logging in to Vercel"
  vercel login
else
  info "Logged in as $(vercel whoami)"
fi

info "Installing project dependencies"
npm install

if [ -d .vercel ]; then
  info "Project already linked (.vercel exists) — skipping link"
else
  info "Linking project to Vercel"
  vercel link
fi

ENV_FILE="${ENV_FILE:-.env}"
if [ -f "$ENV_FILE" ]; then
  info "Pushing env vars from $ENV_FILE to Vercel (production, preview, development)"

  # Parse key=value pairs safely instead of sourcing the file.
  # Supports optional surrounding quotes; ignores comments and blank lines.
  get_env_value() {
    local key="$1"
    # Use fixed-string grep (-F) to avoid regex injection from key names.
    grep -F "${key}=" "$ENV_FILE" \
      | grep -E "^${key}=" \
      | head -1 \
      | cut -d= -f2- \
      | sed -e "s/^['\"]//;s/['\"]$//"
  }

  push_env() {
    local key="$1"
    local value
    value="$(get_env_value "$key")"
    if [ -z "$value" ]; then
      warn "$key is empty in $ENV_FILE — skipping"
      return
    fi
    for target in production preview development; do
      # remove existing value silently, then add
      vercel env rm "$key" "$target" --yes >/dev/null 2>&1 || true
      printf '%s' "$value" | vercel env add "$key" "$target" >/dev/null
      info "  set $key on $target"
    done
  }

  push_env TURSO_DB_URL
  push_env TURSO_DATABASE_URL
  push_env TURSO_DB_AUTH_TOKEN
  push_env TURSO_AUTH_TOKEN
else
  warn "No $ENV_FILE found — copy .env.example to .env and fill it in, then re-run to push secrets."
fi

info "Pulling latest env + project settings into .vercel/"
vercel pull --yes --environment=development

cat <<'EOF'

Setup complete. Next steps:
  - npm run dev          # start local dev server (vercel dev)
  - vercel               # deploy a preview
  - vercel --prod        # deploy to production

EOF
