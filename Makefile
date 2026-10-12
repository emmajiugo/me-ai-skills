.PHONY: sync build open add new remove check deck

sync:   ## pull upstream changes, rebuild everything
	@scripts/sync.sh

build:  ## rebuild SKILL.md files and index.html from what is already vendored
	@node scripts/build.mjs

open: build  ## rebuild, then open the skill list in a browser
	@open index.html

add:    ## vendor a skill from upstream: make add URL=... PATH_IN_REPO=... [NAME=...]
	@scripts/add-skill.sh "$(URL)" "$(PATH_IN_REPO)" "$(NAME)"

new:    ## scaffold a hand-written skill with no upstream: make new NAME=...
	@scripts/new-skill.sh "$(NAME)"

remove: ## uninstall a skill, vendored or hand-written: make remove NAME=...
	@scripts/remove-skill.sh "$(NAME)"

check: build  ## alias for build; fails if any skill links to a missing skill

deck:   ## regenerate docs/me-ai-skills.pptx from scripts/build-deck.py
	@test -d .cache/venv || python3 -m venv .cache/venv
	@.cache/venv/bin/pip install -q --disable-pip-version-check python-pptx
	@.cache/venv/bin/python scripts/build-deck.py
