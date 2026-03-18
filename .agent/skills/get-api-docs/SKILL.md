---
name: get-api-docs
description: >
  Use this skill when you need documentation for a third-party library, SDK, or API
  before writing code that uses it — for example, "use the Gemini API", "call the
  MongoDB Atlas API", "use the Firebase SDK", or any time the user asks
  you to write code against an external service and you need current API reference.
  Fetch the docs with chub before answering, rather than relying on training knowledge.
---

# Get API Docs via chub

When you need documentation for a library or API, fetch it with the `chub` CLI
rather than guessing from training data. This gives you the current, correct API.

## Scoop-Relevant Docs Available

| ID | Language | Use For |
|----|----------|---------|
| `gemini/genai` | py, js | LLM calls, streaming, embeddings, safety settings |
| `mongodb/atlas` | js | Atlas aggregation, vector search, indexes |
| `firebase/auth` | js | Authentication flows |
| `anthropic/claude-api` | py, js | Alternative LLM integration |
| `openai/chat` | py, js | Alternative LLM integration |
| `aws/s3` | py, js | Cloud storage |

## Step 1 — Find the right doc ID

```bash
chub search "<library name>"
```

Pick the best-matching `id` from the results. If nothing matches, try a broader term.

## Step 2 — Fetch the docs

```bash
chub get <id> --lang py    # or --lang js
```

Omit `--lang` if the doc has only one language variant.

## Step 3 — Use the docs

Read the fetched content and use it to write accurate code or answer the question.
Do not rely on memorized API shapes — use what the docs say.

## Step 4 — Annotate what you learned

After completing the task, if you discovered something not in the doc — a gotcha,
workaround, version quirk, or project-specific detail — save it:

```bash
chub annotate <id> "Webhook verification requires raw body — do not parse before verifying"
```

Annotations are local, persist across sessions, and appear automatically on future
`chub get` calls. Keep notes concise and actionable.

## Step 5 — Give feedback

Rate the doc so authors can improve it. Ask the user before sending.

```bash
chub feedback <id> up                        # doc worked well
chub feedback <id> down --label outdated     # doc needs updating
```

## Quick reference

| Goal | Command |
|------|---------|
| List everything | `chub search` |
| Find a doc | `chub search "stripe"` |
| Fetch Python docs | `chub get gemini/genai --lang py` |
| Fetch JS docs | `chub get mongodb/atlas --lang js` |
| Save a note | `chub annotate gemini/genai "use generate_content for streaming"` |
| Rate a doc | `chub feedback gemini/genai up` |
