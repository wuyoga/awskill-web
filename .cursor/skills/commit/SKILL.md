---
name: commit
description: Writes awskill-web git commits in this repository's conventional style. Use when the user asks to commit, 提交, create a git commit, or write a commit message.
---

# Commit

Follow this repo's history from `feat: add Next.js app with /zh|/en routes and static catalog` onward. Older messages have no type prefix; do not copy that shape.

Commit only when the user asks. Do not push unless they ask. Do not update git config.

## Message

```
type: imperative summary

Why this change, in one or two present-tense sentences.
```

- Types already in history: `feat`, `fix`, `chore`, `docs`. Do not invent `refactor`, `test`, or a scope.
- Subject is English, lowercase type, no trailing period.
- `feat` is a user-facing capability. `fix` is a broken command or bug. `chore` is tooling or scaffolding. `docs` is docs and agent rules only.
- Body says why. Skip the body when the subject already carries the reason.
- Stage only files that belong to this change. Leave unrelated edits unstaged, including a one-line copy tweak sitting next to a code change.
- Include `doc/进度记录.md` when this work unit added an entry.

Chinese subject only when the user asks for 中文主题. Keep the same body job (why). Example of that override: `把采集目录留在服务端，页面只拿当前这一截`.

## Attribution

Do not add `Co-authored-by: Cursor <cursoragent@cursor.com>` or `Made-with: Cursor`. Do not pass `--trailer` for those lines.

Before committing, copy `.githooks/commit-msg` onto `.git/hooks/commit-msg` when they differ. Do not set `core.hooksPath`.

## Examples

```
feat: move interface copy onto next-intl

Load zh and en from i18n/messages on one route tree, keep compare share links aligned with the current selection, and use English catalog copy for en detail metadata.
```

```
fix: allow sharp builds so pnpm dev can start

pnpm 11 rejected install when allowBuilds.sharp was a placeholder string instead of true.
```

```
chore: allow pnpm dependency build scripts

pnpm 11 skips install scripts unless allowBuilds lists real booleans, which was blocking next dev.
```

```
docs: sync Next migration and locale URL policy

Update agent rules, product docs, progress log, and design notes for the App Router path and frozen /zh|/en URLs.
```

## Steps

1. In parallel: `git status`, `git diff` (staged and unstaged), `git log -15 --format="%s%n%b%n----"`.
2. Draft the message from the staged diff and the style above.
3. On PowerShell, write the message to a temp file and run `git commit -F` that file. A bash heredoc is rewritten before it reaches git.
4. Afterward run `git status` and `git log -1`. The new message must not contain a Cursor trailer.
