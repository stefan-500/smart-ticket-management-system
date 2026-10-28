#!/bin/bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [[ ! -f app.env ]]; then
  echo 'Create app.env from app.env.example; see README.md.' >&2
  exit 1
fi
chmod 600 app.env
compose=(docker compose --env-file app.env -f compose.yaml)
"${compose[@]}" config --quiet

case "${1:-up}" in
  up)
    # Build one image at a time to limit memory usage on the demo instance.
    "${compose[@]}" build backend
    "${compose[@]}" build frontend
    "${compose[@]}" up -d --wait --wait-timeout 300
    "${compose[@]}" ps --all
    echo 'Application ready. Open the app_url from terraform output.'
    ;;
  status) "${compose[@]}" ps --all ;;
  logs) "${compose[@]}" logs --tail=100 -f ;;
  down) "${compose[@]}" down ;; # Retain the MySQL volume.
  *) echo 'Usage: sudo bash deploy.sh [up|status|logs|down]' >&2; exit 1 ;;
esac
