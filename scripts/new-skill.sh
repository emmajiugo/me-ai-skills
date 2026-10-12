#!/usr/bin/env bash
# Scaffold a hand-written skill, one with no upstream to vendor.
#
#   scripts/new-skill.sh <name>
#
# Example:
#   scripts/new-skill.sh scope-ticket
#
# Hand-written skills stay out of skills.manifest and have no frontmatter.yml.
# Their frontmatter lives inline in SKILL.md and the build never rewrites it,
# though it is still link-checked and still lands in index.html.
#
# Afterwards: fill in the description, write the body, rerun `make build`.
set -euo pipefail
cd "$(dirname "$0")/.."

name=${1:-}
if [ -z "$name" ]; then
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi
case "$name" in
  *[!a-z0-9-]*|-*|"")
    echo "skill names are lowercase letters, digits and dashes: $name" >&2
    exit 1;;
esac
if [ -e "$name" ]; then
  echo "$name/ already exists" >&2
  exit 1
fi

title=$(echo "$name" | tr '-' ' ')
mkdir -p "$name"
cat > "$name/SKILL.md" <<SKILL
---
name: $name
description:
---

# ${title}

SKILL

echo "created $name/SKILL.md"
echo "fill in description: it decides when the agent reaches for this skill"
node scripts/build.mjs
