# Agents & team workflow

This file is the repo-root **`AGENTS.md`** used by **Cursor**, **Kiro**, and **Windsurf** (and humans). It follows the portable [agents.md](https://agents.md) idea: one markdown document at the project root so assistants and teammates share the same rules.

| Tool      | How this file is used |
|-----------|------------------------|
| **Cursor** | Rule in `.cursor/rules/` points here; you can also attach `@AGENTS.md` in chat. |
| **Kiro**   | Workspace root `AGENTS.md` is picked up automatically (see [Kiro steering](https://kiro.dev/docs/steering/)). |
| **Windsurf** | Cascade discovers `AGENTS.md` at the repo root (see [Windsurf AGENTS.md](https://docs.codeium.com/windsurf/cascade/agents-md)). `.windsurfrules` in this repo nudges Cascade to follow this doc. |

**Audience:** everyone on the team plus AI assistants. **Stack:** **GitHub Issues** for coordination, **GitHub CLI (`gh`)** for commands, **this repo** for code.

---

## Why this pattern

- **One place for "what's next"** — Issues live next to the code on GitHub.
- **No duplicate work** — Use assignees; ideally one owner per item in progress unless pairing.
- **Traceable delivery** — Pull requests can **close** issues automatically (see below).

---

## 1. Install GitHub CLI

**macOS (Homebrew):**

```bash
brew install gh
```

Confirm:

```bash
gh --version
```

Other platforms: [Installing gh](https://github.com/cli/cli#installation).

---

## 2. Log in to GitHub (once per machine)

```bash
gh auth login
```

Choose **GitHub.com**, **HTTPS**, then complete browser or token sign-in.

Check:

```bash
gh auth status
```

---

## 3. Use Issues for coordination

### List and read issues

From the repo (or pass `--repo reeinvent/SheepAi` from anywhere):

```bash
cd /path/to/SheepAi
gh issue list
gh issue view <number>
```

Example:

```bash
gh issue view 1
```

### Create an issue

**From the terminal:**

```bash
gh issue create --title "Short title" --body "What to do, acceptance criteria, links."
```

**From the browser:** GitHub → **Issues** → **New issue**.

Good habits:

- **Title:** action-oriented ("Add API health check", not "Misc").
- **Body:** what "done" means, constraints, links to designs or tickets elsewhere if needed.
- **Assignee:** who owns it while it's in progress (avoid two people on the same task without pairing).

---

## 4. Implement work (human or pair)

1. **Pick an issue** — Prefer something assigned to you or agreed in chat.
2. **Branch from the integration branch** — Use `develop` for day-to-day work if it exists, otherwise `main`.
3. **Implement** — Keep changes scoped to the issue; commit in logical chunks.
4. **Open a pull request** into `develop` (or `main` if that is the team rule for the hackathon).

Link the PR to the issue so GitHub closes it when the PR merges:

```text
Closes #<issue-number>
```

or

```text
Fixes #<issue-number>
```

Put that in the **PR description** (first comment is enough). Example: `Closes #1`.

5. **Review, merge, delete branch** as usual.

---

## 5. Working with an AI assistant (Cursor, Kiro, Windsurf)

So the assistant has the same context as you:

1. **Say the repo and issue** — e.g. "Implement `reeinvent/SheepAi#3`" or "issue 3 in this repo".
2. **Or paste** `gh issue view 3` output (title + body) if the environment cannot reach GitHub.
3. After **you** are logged in with `gh`, the assistant can run `gh issue view` in the project when you ask it to load an issue.

The assistant implements code **in this repo**; Issues stay the **coordination** layer on GitHub.

---

## Quick reference

| Goal             | Command / action                                    |
|------------------|-----------------------------------------------------|
| See open issues  | `gh issue list`                                     |
| Read one issue   | `gh issue view <n>`                                 |
| Create issue     | `gh issue create` or GitHub web UI                  |
| Link PR to issue | Put `Closes #<n>` or `Fixes #<n>` in PR description |

Questions or improvements: open a GitHub issue or propose a PR.
