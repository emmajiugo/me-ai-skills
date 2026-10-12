#!/usr/bin/env bash
# Refresh every vendored skill from its upstream repo, then rebuild.
set -euo pipefail
cd "$(dirname "$0")/.."

CACHE=.cache
mkdir -p "$CACHE" .vendor

key_of() { echo "$1" | awk -F/ '{print $(NF-1)"-"$NF}'; }

awk -F'\t' '!/^#/ && NF>1 {print $2}' skills.manifest | sort -u | while read -r url; do
  dir="$CACHE/$(key_of "$url")"
  if [ -d "$dir/.git" ]; then
    git -C "$dir" fetch -q --depth 1 origin HEAD
    git -C "$dir" reset -q --hard FETCH_HEAD
  else
    git clone -q --depth 1 "$url" "$dir"
  fi
  echo "fetched $(key_of "$url") @ $(git -C "$dir" rev-parse --short HEAD)"
done

awk -F'\t' '!/^#/ && NF>1 {print $1"\t"$2"\t"$3}' skills.manifest | while IFS=$'\t' read -r name url path; do
  key=$(key_of "$url")
  src="$CACHE/$key/$path"
  [ -d "$src" ] || { echo "not found upstream: $url $path" >&2; exit 1; }
  dst=".vendor/$key/$(basename "$path")"
  rm -rf "$dst"; mkdir -p "$dst"
  cp -R "$src/." "$dst/"
done

if git diff --quiet -- .vendor; then
  echo "upstream: no change"
else
  echo "upstream changed:"
  git --no-pager diff --stat -- .vendor
fi

node scripts/build.mjs
