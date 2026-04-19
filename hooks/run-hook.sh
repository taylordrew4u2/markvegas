#!/usr/bin/env bash
set -euo pipefail

event="${1:-unknown}"

case "$event" in
  session-start)
    exit 0
    ;;
  *)
    exit 0
    ;;
esac
