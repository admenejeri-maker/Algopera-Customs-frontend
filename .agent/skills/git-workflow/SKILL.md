---
name: git-workflow
description: >
  Git best practices including commit conventions, branching strategies,
  merge conflict resolution, PR workflows, and release management.
  Use when committing, branching, resolving conflicts, or designing
  Git workflows for teams.
---

# Git Workflow

Best practices for Git version control: commit conventions, branching
strategies, conflict resolution, and collaborative workflows.

## Use this skill when

- Writing commit messages
- Choosing a branching strategy
- Resolving merge conflicts
- Setting up PR/MR workflows
- Designing release/deployment Git flows
- Cherry-picking, rebasing, or squashing

## Do not use this skill when

- Setting up CI/CD pipelines — use `ci-cd-pipelines`
- Reviewing code in PRs — use `code-review`
- Managing deployment — use `deployment-strategies`

## Instructions

### 1. Commit Conventions (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change (no feature/fix) |
| `docs` | Documentation only |
| `test` | Adding/fixing tests |
| `chore` | Build, deps, config |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |

**Examples:**
```
feat(auth): add OAuth2 login with Google
fix(api): handle null response from payment gateway
refactor(db): extract query builder into separate module
docs(readme): add deployment instructions
test(tax): add parametrized tests for VAT calculation
```

### 2. Branching Strategies

**Trunk-Based (Recommended for small teams):**
```
main ─────●────●────●────●──→
           \  /      \  /
            feat-1    fix-2
```
- Short-lived feature branches (1-3 days max)
- Merge to main frequently
- Feature flags for incomplete work

**GitFlow (For release-based projects):**
```
main     ─────────●───────────●──→
                 / \         / \
release    ────●───●────    ●───●
              /       \    /
develop  ──●────●──────●──●──→
            \  /    \  /
             feat    fix
```

### 3. Merge Conflict Resolution

```bash
# Step 1: Update your branch
git fetch origin
git rebase origin/main  # or merge

# Step 2: Identify conflicts
git status  # shows conflicting files

# Step 3: Resolve each file
# Look for conflict markers:
<<<<<<< HEAD
  your changes
=======
  their changes
>>>>>>> main

# Step 4: Choose resolution
# Keep yours / keep theirs / combine both

# Step 5: Continue
git add <resolved-files>
git rebase --continue  # or commit if merging
```

### 4. Safe Git Operations

| Operation | Safe Command | Dangerous Alternative |
|-----------|-------------|----------------------|
| Undo last commit (keep changes) | `git reset --soft HEAD~1` | `git reset --hard HEAD~1` |
| Undo staged files | `git restore --staged <file>` | `git checkout -- <file>` |
| View changes before commit | `git diff --staged` | Committing blindly |
| Update branch | `git pull --rebase` | `git pull` (creates merge commits) |
| Clean untracked files | `git clean -n` (dry run first) | `git clean -f` |

### 5. PR Best Practices

- Keep PRs small (<400 lines of meaningful changes)
- One concern per PR (don't mix features + refactoring)
- Write descriptive PR title and body
- Link to issue/ticket
- Request specific reviewers
- Respond to feedback promptly

## Anti-Patterns

- ❌ `git add .` without checking `git status` first
- ❌ Force pushing to shared branches
- ❌ Vague commits: "fix stuff", "wip", "updates"
- ❌ Long-lived feature branches (> 1 week)
- ❌ Committing secrets, `.env`, or large binaries

## Workflow Integration

**Invoked by:**
- `/claude-building` — when committing or managing branches
- `/ops-check` — when reviewing Git hygiene

**After using this skill:** Proceed with `verification-before-completion` before pushing.

**Related skills:** `code-review`, `ci-cd-pipelines`
