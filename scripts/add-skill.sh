#!/usr/bin/env bash
# Vendor a new skill. Same route every skill here took.
#
#   scripts/add-skill.sh <repo-url> <path/inside/repo> [local-name]
#
# Example:
#   scripts/add-skill.sh https://github.com/mattpocock/skills skills/engineering/teach
#
# Steps it runs for you:
#   1. append the entry to skills.manifest
#   2. shallow clone or update the source repo under .cache/
#   3. copy the upstream directory into .vendor/ untouched
#   4. seed <name>/frontmatter.yml from upstream, then generate <name>/SKILL.md
#   5. check no skill now calls a skill you did not install
#   6. rebuild index.html
#
# Afterwards: edit <name>/frontmatter.yml to sharpen the description, then
# rerun `make build`. Pass a local-name that differs from the upstream
# directory to rename a skill; the build rewrites references to the old name.
set -euo pipefail
cd "$(dirname "$0")/.."

url=${1:-}; path=${2:-}; name=${3:-$(basename "${path:-}")}
if [ -z "$url" ] || [ -z "$path" ]; then
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi

if awk -F'\t' -v n="$name" '!/^#/ && $1==n {found=1} END{exit !found}' skills.manifest; then
  echo "$name is already in skills.manifest" >&2
  exit 1
fi
if [ -e "$name" ]; then
  echo "$name/ already exists and is not vendored. Pick another local name." >&2
  exit 1
fi

printf '%s\t%s\t%s\n' "$name" "$url" "$path" >> skills.manifest
echo "added $name -> $url $path"
scripts/sync.sh
