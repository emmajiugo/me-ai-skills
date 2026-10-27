---
name: scope-ticket
description: Scope a reported bug, ticket, or issue and determine whether it is real, already fixed, or not reproducible, before writing any fix. Use this whenever the user pastes a ticket, bug report, issue link, QA note, Sentry/Linear/Jira item, or describes something as "broken", "reported", "failing", or asks "is this still an issue?", "can you check this bug?", "did we already fix this?", even if they never say "verify". Also use when a reported problem may span more than one service or repository.
---

# Scope ticket

The job here is diagnosis, not repair. A ticket arrives claiming something is broken; this skill establishes whether that claim holds against the current code, and stops there. Fixes come after, and only when asked.

Most wasted debugging time comes from skipping this step: someone starts patching a bug that was fixed three commits ago, or that never existed as described.

## Workflow

### 1. Scope the report

Restate the ticket in concrete terms before touching code:

- **Observed behavior.** What actually happens, per the report.
- **Expected behavior.** What the reporter thinks should happen.
- **Trigger.** The specific input, route, state, or sequence that causes it.
- **Blast radius.** Which modules, services, or repos are implicated.
- **Missing information.** Version, environment, payload, stack trace, user role.

If the trigger is vague ("checkout sometimes fails"), say so now rather than reproducing the wrong thing. A guess about the trigger is the single most expensive assumption to get wrong.

### 2. Check whether it is already fixed

Before assuming the ticket is open, look for evidence it was closed by someone else:

- Search for the relevant symbols and error strings in the current code
- Check recent commits, branches, and changelog entries touching that path
- Compare the reported version against what is on the working branch

If the code already handles the reported case, that is the verdict. Report it with the commit or code reference that fixes it, then stop.

### 3. Reproduce with a test

Write the smallest failing test that expresses the reported behavior, at the level where the bug actually lives. A unit test for a formatting bug, a feature or HTTP test for a request-lifecycle bug, an integration test for a boundary between components.

Start from the nearest existing test for that code path and add the case there. Create a new test file only when no existing test covers the path.

Interpreting the result:

| Test outcome | Meaning |
|---|---|
| Fails as described | **Reproduced.** The test is now the artifact that proves the bug and will prove the fix. |
| Passes immediately | Either already fixed, or the report is inaccurate/incomplete. Go back to scope before concluding. |
| Can't be written cheaply | Fine. Say why, then verify another way. |

Some bugs resist tests: UI rendering, device-specific behavior, race conditions, third-party sandboxes, production-only data states. Do not contort the codebase to make one testable. Fall back to a manual reproduction or a careful read of the code path, and state plainly that reproduction is by inspection rather than by test. "Not reproducible with a test" is a legitimate finding, not a failed attempt.

### 4. Handle cross-service trails

When the evidence leads to a service that is not in this repository:

1. Check whether that repo is already accessible locally (sibling directory, monorepo package, vendored dependency, configured path).
2. If accessible, continue verification there.
3. If not, **stop and ask the user to paste the path or repo URL.**

Never infer another service's behavior from the calling code alone. A guess about a remote contract looks like a finding and reads like one in the write-up, which is exactly what makes it costly.

## Operating guidelines

- **Prefer semantic code search, but do not depend on it.** When Serena MCP is connected, symbol lookup and reference finding trace a bug through a codebase faster than text grep. When it is not, use grep and targeted file reads and carry on. Never block the verdict on a missing tool.
- **Delegate codebase exploration to a sub-agent** and work from the returned summary rather than reading files inline. Keeps the main thread focused on the verdict instead of filling up with file contents.
- **Prefer simplicity.** The smallest test, the shortest path, the plainest explanation. Resist the urge to map the whole subsystem when three files answer the question.
- **Leave the fix for later.** If the fix is obvious, note it in one line under Next step and let the user decide. When the user asks for the fix, run /implement and build on the reproducing test from step 3, following the same existing-test rule.

## Output

Report back in this shape:

```
## Verdict
<Reproduced | Already fixed | Not reproducible | Blocked, needs access | Not a bug>

## Scope
What was reported, and what it actually touches.

## Evidence
The failing test, the commit that fixed it, or the code path read, with file:line references.

## Next step
One line. What you'd do, or what you need from the user.
```

Be concise and go straight to the point. The verdict is the deliverable,
everything else only supports it.

- Lead with the verdict. No preamble, no warm-up, no restating the ticket back.
- Two sentences per section at most.
- Cite `file:line` instead of pasting code the user can open.
- Cut any sentence that would read the same on a different ticket.
- Stop at Next step. No closing summary, no offer to keep going.
