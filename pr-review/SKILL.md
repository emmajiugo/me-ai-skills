---
name: pr-review
description: Review a PR and post the findings as inline, line-anchored comments.
disable-model-invocation: true
---
# pr review

## Steps

- Resolve the PR: `gh pr view --json number,url,headRefName,baseRefName,title,body`.
- Read the title and description first. Review against what the author set out to do.
- Load the language skill if it is available: `/go-dev` for a Go project, `/java-dev` for a Java project. Apply its review guidance to the findings.
- Get findings: invoke `/code-review` \[xhigh\] if none are in hand yet.
- Verify every finding's line: `sed -n '<n>p' <file>`. A wrong anchor gets the comment rejected.
- List commentable ranges: `gh pr diff <n> | awk '/^diff --git/{f=$4} /^@@/{split($3,a,","); s=substr(a[1],2); n=(a[2]==""?1:a[2]); print f" "s"-"(s+n-1)}'`. An anchor outside a hunk is rejected.
- Drop any finding the code already answers in a nearby comment.
- One comment per finding. First line: `<emoji> **<Severity>** \`<path>:<line>\``, then a blank line, then the claim in one or two sentences. No preamble, no restating the diff.
- Severity is 🔴 **Critical**, 🟠 **High**, 🟡 **Medium** or 🔵 **Low**. Use 🔵 **Low · Perf** for non-correctness findings.
- Use the full repo-relative path. For a multi-line anchor, write `<path>:<start>-<end>`.
- Add a ````suggestion` block when the fix is a concrete line edit. Reproduce the anchored lines exactly, indentation included.
- Fold related fixes into one suggestion. Overlapping suggestions conflict on apply.
- Duplicate files such as per-env manifests: comment on one, name the others in that comment.
- Run `/unslop` on every comment body. Short sentences, plain words, no em dashes. Leave the severity header line as is.
- Show the user all findings in the terminal first: severity, `path:line`, claim, suggestion.
- Ask the user to approve, drop findings, or add their own comments. Wait for the answer.
- Apply their edits, then post. Nothing goes to the PR before approval.
- Post inline comments only. No review body.
- Before posting a comment, check whether another reviewer has already raised the same point. If so, don’t post yours. Only reply to their comment if you have something meaningful to add.
- Post with `gh api repos/<owner>/<repo>/pulls/<n>/reviews --method POST --input payload.json`.
- `event` is `COMMENT`. Never `REQUEST_CHANGES` unless asked.
- Revise a comment with `gh api repos/<owner>/<repo>/pulls/comments/<id> --method PATCH`. Never delete and repost.

## Payload

```json
{
  "event": "COMMENT",
  "comments": [
    {"path": "f", "start_line": 10, "line": 14, "start_side": "RIGHT", "side": "RIGHT", "body": "..."},
    {"path": "f", "line": 22, "side": "RIGHT", "body": "..."}
  ]
}
```

Build it with a script, not a shell heredoc. Comment bodies contain quotes, backticks and `$`.