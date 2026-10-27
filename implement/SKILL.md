---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
metadata:
  source: https://github.com/mattpocock/skills/blob/main/skills/engineering/implement/SKILL.md
  upstream-path: skills/engineering/implement
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.

Before you start, check the current branch. If it is `main` or was made for different work, create a new branch in a new git worktree for this work. Name it after the Linear ticket ID plus 2–4 kebab-case words, like `PAY-123-fix-login-timeout`. If there is no ticket ID, ask me for one. If you can't tell whether the branch fits, ask me before creating one.

Before writing a test, look for an existing related test and extend it. Create a new test only when no existing test covers the behaviour.

When the work touches `*.go` files, load /go-dev first. When it touches `*.java` files, load /java-dev first.
