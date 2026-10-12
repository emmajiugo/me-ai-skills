#!/usr/bin/env bash
# Uninstall a skill, vendored or hand-written.
#
#   scripts/remove-skill.sh <name>
#
# Example:
#   scripts/remove-skill.sh grill-with-docs
#
# Drops the skill directory, and for a vendored skill also its manifest row and
# its copy under .vendor/. The rebuild then fails if a skill you kept still
# calls the one you removed, so you find out before an agent does.
set -euo pipefail
cd "$(dirname "$0")/.."

name=${1:-}
if [ -z "$name" ]; then
  sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi

row=$(awk -F'\t' -v n="$name" '!/^#/ && $1==n' skills.manifest)
if [ -z "$row" ] && [ ! -d "$name" ]; then
  echo "no skill called $name" >&2
  exit 1
fi

if [ -n "$row" ]; then
  url=$(echo "$row" | cut -f2)
  path=$(echo "$row" | cut -f3)
  key=$(echo "$url" | awk -F/ '{print $(NF-1)"-"$NF}')
  rm -rf ".vendor/$key/$(basename "$path")"
  awk -F'\t' -v n="$name" '/^#/ || $1!=n' skills.manifest > skills.manifest.tmp
  mv skills.manifest.tmp skills.manifest
  echo "removed $name from skills.manifest and .vendor/$key"
fi

rm -rf "$name"
echo "removed $name/"
node scripts/build.mjs
