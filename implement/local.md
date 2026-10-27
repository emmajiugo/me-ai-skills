Before you start, check the current branch. If it is `main` or was made for different work, create a new branch in a new git worktree for this work. Name it after the Linear ticket ID plus 2–4 kebab-case words, like `PAY-123-fix-login-timeout`. If there is no ticket ID, ask me for one. If you can't tell whether the branch fits, ask me before creating one.

Before writing a test, look for an existing related test and extend it. Create a new test only when no existing test covers the behaviour.

When the work touches `*.go` files, load /go-dev first. When it touches `*.java` files, load /java-dev first.
