# Me-AI-Skills

My agent skills, shared by Claude Code and opencode from one directory.

This is my own way of managing skills. I don't install skill packs directly.
I pull the skills I want into this repo, and I control the parts that decide
how an agent uses them: the name, the description, and whether the agent can
call the skill on its own. Upstream changes come in as a diff that I review
before I accept it, so nothing changes under me without notice.

You are free to fork it or copy any part of it. Expect it to follow my
preferences, not a general standard.

Each top-level directory is one skill and holds a `SKILL.md`. Most are vendored
from upstream repos and rebuilt by `make`, so upstream edits arrive as a
reviewable diff instead of a merge.

```sh
make sync    # pull upstream changes, rebuild, check links
make build   # rebuild from what is already vendored, no network
make open    # rebuild, then open index.html in a browser
make add URL=... PATH_IN_REPO=... [NAME=...]   # vendor a skill from upstream
make new NAME=...                              # scaffold a skill of your own
make remove NAME=...                           # uninstall either kind
```

`index.html` lists every skill, what it does, and whether it runs on its own.
Open it with `make open`.

## Install

Both clients read this repo through a symlink, so an edit here applies to both
at once.

```sh
ln -s "$PWD" ~/.claude/skills
ln -s "$PWD" ~/.config/opencode/skills
```

Move any existing `skills` directory out of the way first.

## How a vendored skill is put together

Three pieces per skill:

- `.vendor/<source>/<name>/` holds upstream untouched. Never edit it. Its git
  diff is the record of what upstream changed.
- `<name>/frontmatter.yml` is yours. Description, triggers, invocation mode.
- `<name>/SKILL.md` is generated from those two, plus any support files copied
  from the vendor tree.

Your frontmatter and upstream's body never overlap, so a sync cannot conflict.
The cost is that everything except `frontmatter.yml` is overwritten on rebuild.

`skills.manifest` is the list, one tab-separated row per skill: local name,
source repo, path inside that repo.

## Adding a skill

```sh
make add URL=https://github.com/mattpocock/skills PATH_IN_REPO=skills/productivity/teach
```

That appends the manifest row, fetches the repo into `.cache/`, copies the
upstream directory into `.vendor/`, seeds `frontmatter.yml` from upstream,
generates `SKILL.md`, checks links, and rebuilds `index.html`.

Then edit `<name>/frontmatter.yml` and run `make build`. Two fields matter:

- `description` decides when the agent reaches for the skill. Name the real
  cases. A vague description means it never fires.
- `disable-model-invocation: true` makes it slash-command only. Delete that
  line to let the agent invoke it on its own.

## Renaming a skill

Pass a `NAME` that differs from the upstream directory:

```sh
make add URL=... PATH_IN_REPO=skills/engineering/code-review NAME=my-code-review
```

Skills call each other by slash-command name, so the build rewrites references
to the old name across every installed skill. `code-review` is renamed this way
because Claude Code already ships a built-in skill under that name.

## Link checking

Every build fails if an installed skill calls a skill you did not install, or
if a relative link does not resolve. Adding half of a set that references the
other half is caught before it reaches an agent.

## Hand-written skills

A skill you wrote yourself has no upstream, so it needs no `frontmatter.yml`
split and no manifest row. Its frontmatter lives inline in `SKILL.md`.

```sh
make new NAME=my-skill
$EDITOR my-skill/SKILL.md
make build
```

`make build` never touches these directories, but it does link-check them, so a
hand-written skill cannot reference a skill you do not have.

Currently hand-written: `scope-ticket`, `commit-push`, `pr-review`.

## Skills you deliberately skip

`skills.ignore` lists skills that upstream refers to but you chose not to
install, one name per line. The link check treats a call to one of them as
intentional rather than dangling.

Only list a skill you are content for an agent to find missing: the mention
stays in the body text, it just stops failing the build.

## Removing a skill

```sh
make remove NAME=grill-with-docs
```

Drops the skill directory, and for a vendored skill its manifest row and its
`.vendor/` copy too. The rebuild that follows fails if a skill you kept still
calls the one you removed; the removal itself has already happened, so either
put it back with `git checkout` or drop the caller as well.

## License and credits

My own work here is under the [MIT License](LICENSE). Vendored skills keep their
upstream licenses:

- [mattpocock/skills](https://github.com/mattpocock/skills), MIT
- [github/gh-stack](https://github.com/github/gh-stack), MIT
- [cursor/plugins](https://github.com/cursor/plugins) (`unslop`)
