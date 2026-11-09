#!/usr/bin/env bash
set -euo pipefail

# Filesystem content is provided by the project bind mount.
# Never generate or print credentials here.
if [ ! -d /home/vscode/.pi ]; then
  echo 'Missing project .pi directory. Create .pi/ on the host before opening the Dev Container.' >&2
  exit 1
fi

if [ -f .mise.toml ]; then
  mise install
fi

printf 'Ready: Python %s | Node %s | pi: %s | mise: %s\n' \
  "$(python --version 2>&1)" "$(node --version)" "$(command -v pi)" "$(mise --version)"
