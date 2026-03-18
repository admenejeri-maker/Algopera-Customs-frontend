---
workflow: deep-research
version: 3.0
model_preference: gemini-3.0-pro
description: Technical investigation using official docs and repository analysis

# THINKING CONFIG: Maximum reasoning budget for Gemini 3.0 Pro
thinking_config:
  gemini-3.0-pro:
    budget_tokens: 128000
    use_for: "Deep research with maximum reasoning - documentation, GitHub, web search"
  default:
    budget_tokens: 32000

# Smart Execution Strategy
mcp_strategy:
  phase_1_planning:
    tool: sequential-thinking
    prompt: |
      Analyze the user query and determine:
      1. What type of information is needed?
         - Implementation guide → context7 (documentation)
         - Known issue/bug → github (issues search)
         - Security concern → semgrep + context7
      2. What's the optimal tool sequence?
      3. Do I need clarification from the user?
    auto_execute: true

  phase_2_research:
    primary_tool: context7
    primary_action: |
      1. Resolve library from query
      2. Search official documentation
      3. Read relevant sections
    fallback_tool: github
    fallback_condition: "context7 returns no results OR mentions version conflict"
    auto_execute: true

  phase_3_validation:
    tool: github
    action: search_issues
    condition: "context7 found experimental feature OR deprecation warning"
    params:
      filter: "comments>5, maintainer_responses"
    auto_execute: true

  phase_3b_codebase_analysis:
    tool: claude-code
    actions:
      - Glob: "Find relevant files by pattern"
      - Grep: "Search content within files"
      - Read: "Read file contents for analysis"
    condition: "Need to understand existing codebase implementation"
    auto_execute: true

  phase_4_synthesis:
    format: structured_report
    required_sections: [key_insight, evidence, recommendation]

# Caching Configuration
cache_hints:
  context7_docs:
    ttl: 900  # 15 minutes
    scope: session
  github_issues:
    ttl: 300  # 5 minutes
    scope: session

# Auto-Routing Patterns
triggers:
  - patterns: ["how does", "how to", "what is", "explain", "როგორ", "რა არის"]
    primary_route: context7
    secondary_route: github

  - patterns: ["known issue", "is this a bug", "error", "ბაგი", "შეცდომა"]
    primary_route: sequential-thinking
    secondary_route: github
    tertiary_route: context7

  - patterns: ["is this safe", "security", "vulnerable", "უსაფრთხო"]
    primary_route: sequential-thinking
    secondary_route: semgrep
    tertiary_route: context7

  - patterns: ["find in code", "where is", "სად არის", "implementation", "იმპლემენტაცია"]
    primary_route: claude-code
    secondary_route: context7

  - patterns: ["why", "rationale", "reason", "რატომ"]
    primary_route: sequential-thinking
    secondary_route: context7

  # Tax Agent domain triggers
  - patterns: ["matsne", "rs.ge", "საგადასახადო", "tax code", "მუხლი", "კარი", "თავი"]
    primary_route: tavily  # live legal source — Matsne content changes
    secondary_route: claude-code  # check local scraper implementation

  - patterns: ["atlas", "mongodb", "vector search", "tax_articles", "embedding", "rag"]
    primary_route: claude-code  # local codebase first
    secondary_route: context7   # MongoDB official docs
    tertiary_route: github      # Atlas known issues

  - patterns: ["cloud run", "deploy", "dockerfile", "gcloud", "europe-west1"]
    primary_route: tavily       # GCP docs are frequently updated
    secondary_route: context7

# Execution Mode
turbo: true  # Auto-execute read-only operations
requires_approval:
  - semgrep_scan  # Security scans need user consent

# Quality Gates
validation:
  min_sources: 1  # At least one authoritative source
  prefer_official: true  # Official docs > community blogs
  cite_sources: true  # Always include links

skills_integration:
  conditional:
    - skill: get-api-docs
      when: "Researching API usage, SDK syntax, or library integration"
    - skill: georgian-tax-domain
      when: "Query involves Georgian tax law, Matsne, or RS.ge"
    - skill: rag-pipeline-debug
      when: "Researching a RAG performance issue"
    - skill: scraping-resilience
      when: "Researching Matsne scraping failures"
    - skill: api-design-principles
      when: "Researching REST/GraphQL API patterns"
    - skill: api-security-best-practices
      when: "Researching security vulnerabilities"
---

# 🔬 Deep Research - Knowledge Engine (v3.0)

## Overview

This workflow is your **"Technical Investigator"**. Since we work in specialized environments, our **Source of Truth** is:
1. **Official documentation** (via context7)
2. **Real code and issues** (via github)
3. **Static analysis** (via semgrep)

> **Core Principle:** Hypothesis → Docs/Repo Verification → Static Analysis → Synthesis

---

## 🧠 Phase 1: Cognitive Strategy (Sequential Thinking)

**ALWAYS START HERE - Think Before You Tool!**

Use `sequential-thinking` to plan your research approach:

```thinking-prompt
User Query: "{query}"

Step 1: Classify the question type
- "How to do X?" → Need implementation guide (context7)
- "Why is X broken?" → Need issue tracking (github)
- "Is X safe?" → Need security analysis (semgrep + context7)

Step 2: Identify the knowledge gap
- What exactly don't we know?
- What would a complete answer look like?
- What evidence would be authoritative?

Step 3: Select research path
- Primary tool: {context7 | github | semgrep}
- Secondary tool: {fallback option}
- Expected iterations: {1-3}

Step 4: Formulate precise queries
- For context7: Specific library + precise question
- For github: Repo + error pattern or feature name
- For semgrep: Code pattern or vulnerability type
```

**Tool:** `sequential-thinking`
**Auto-Execute:** ✅ Yes (planning is always safe)
**Output:** Research strategy with tool sequence

---

## 🔍 Phase 2: Targeted Investigation

### 🔎 Path A: AI-Optimized Web Search (Tavily) [PRIORITY]

**When to use:**
- Need **current/real-time** information (latest, recent, now)
- Fact-checking documentation claims
- Finding **pricing**, **release notes**, **announcements**
- Competitive intelligence or market research
- News about libraries, frameworks, or security vulnerabilities

**Execution Flow:**

```yaml
Step 1: Tavily Search
  tool: tavily_search
  input:
    query: {refined query from sequential-thinking}
    search_depth: "advanced"  # deep search for better results
    include_domains: ["docs.", "github.com", "dev.to", "medium.com"]
    exclude_domains: ["pinterest.com", "facebook.com"]
  output: search_results with extracted content

Step 2: Validate with Context7 (if needed)
  condition: "Tavily found info but need official docs confirmation"
  tool: context7
  action: cross-reference findings
```

**Auto-Execute:** ✅ Yes (read-only)
**Cache:** 10 minutes
**Cost:** ~$0.01/query (budget-efficient)
**Fallback:** If Tavily returns low relevance → proceed to Path B (Documentation)

**Example:**
```
User: "What's the latest pricing for Vercel Pro?"

→ tavily_search(
    query="Vercel Pro pricing 2026",
    search_depth="advanced"
  )

Result: Current pricing from vercel.com + recent blog posts about changes
```

---

### 📚 Path B: Documentation Research (Context7)

**When to use:**
- User asks "how to", "what is", "explain"
- Need syntax, API reference, or best practices
- Learning a new library or framework

**Execution Flow:**

```yaml
Step 1: Resolve library
  tool: context7_resolve
  input:
    library_name: {auto-detect from query}
    query: {refined query from sequential-thinking}
  output: library_id (e.g., "/vercel/next.js")

Step 2: Search documentation
  tool: context7_query
  input:
    library_id: {from step 1}
    query: {specific technical question}
  output: relevant_doc_ids

Step 3: Read documentation
  tool: context7_read
  input:
    library_id: {from step 1}
    doc_ids: {from step 2}
  output: documentation_content
```

**Auto-Execute:** ✅ Yes (read-only operation)
**Cache:** 15 minutes
**Fallback:** If no results → proceed to Path B (GitHub)

**Example:**
```
User: "How does Next.js 15 caching work with app router?"

→ context7_resolve("nextjs", "caching strategy app router")
→ context7_query("/vercel/next.js", "app router caching mechanisms")
→ context7_read(library_id, [doc_ids])

Result: Official documentation on fetch caching, revalidation, etc.
```

---

### 🐙 Path C: Repository Mining (GitHub)

**When to use:**
- Context7 shows version conflicts or deprecation
- User reports an error that sounds like a known issue
- Need to validate if a feature is stable or experimental

**Execution Flow:**

```yaml
Step 1: Identify repository
  source: infer from library name
  examples:
    "Next.js" → "vercel/next.js"
    "FastAPI" → "fastapi/fastapi"
    "React" → "facebook/react"

Step 2: Search issues
  tool: github_search_issues
  input:
    repo: {from step 1}
    query: {specific error message or feature name}
    filters:
      - state: all  # Include closed issues (might be fixed)
      - min_comments: 5  # Active discussions
  output: relevant_issues

Step 3: Analyze issue patterns
  look_for:
    - Maintainer responses (authoritative)
    - "Fixed in version X" comments
    - Workarounds from community
```

**Auto-Execute:** ✅ Yes (read-only)
**Cache:** 5 minutes
**Validation:** Prioritize maintainer comments

**Example:**
```
User: "use cache hook not working in client components"

→ github_search_issues(
    repo="vercel/next.js",
    query="use cache client component",
    state="all"
  )

Result: Issue #54321 - "use cache only works in Server Components (by design)"
```

---

### 🛡️ Path C: Security Analysis (Semgrep)

**When to use:**
- User asks "is this safe?"
- Before committing code changes
- Reviewing third-party code or dependencies

**Execution Flow:**

```yaml
Step 1: Request user approval
  reason: "Security scans require explicit permission"
  prompt: "Run semgrep scan on {file/directory}?"

Step 2: Run scan (if approved)
  tool: semgrep_scan
  input:
    path: {file or directory}
    rules: ["security", "owasp-top-10"]
  output: findings

Step 3: Analyze results
  categorize:
    - Critical: SQL injection, XSS, hardcoded secrets
    - Medium: Insecure defaults, missing validation
    - Low: Code style, best practices
```

**Auto-Execute:** ❌ No (requires approval)
**Cache:** None (always fresh scan)
**Output:** Prioritized findings with remediation

**Example:**
```
User: "Is this MongoDB query safe?"

→ Request approval for semgrep scan
→ semgrep_scan(code_snippet, rules=["nosql-injection"])

Result: "⚠️ Found potential NoSQL injection - user input not sanitized"
```

---

### 🔍 Path D: Codebase Analysis (Claude-Code)

**When to use:**
- User asks "where is X implemented?"
- Need to understand existing code patterns
- Searching for specific functions, classes, or patterns
- Analyzing local project structure

**Execution Flow:**

```yaml
Step 1: Find relevant files
  tool: claude-code Glob
  input:
    pattern: "**/*.py" or "**/*.ts" or specific pattern
    path: /project/directory
  output: matching_files

Step 2: Search within files
  tool: claude-code Grep
  input:
    pattern: "function_name" or "class Definition"
    path: /project/directory
  output: matching_lines

Step 3: Read and analyze
  tool: claude-code Read
  input:
    file_path: /path/to/specific/file.py
  output: file_contents
```

**Auto-Execute:** ✅ Yes (read-only)
**Cache:** None (always fresh file state)
**When to use with other paths:** Combine with context7 to compare local implementation vs official docs

**Example:**
```
User: "როგორ არის იმპლემენტირებული search_products?"

→ claude-code Glob("**/user_tools.py")
→ claude-code Read("/backend/app/tools/user_tools.py")

Result: "search_products is implemented at line 293 with MongoDB text search..."
```

---

## ⚖️ Phase 3: Dialectical Triangulation

**Synthesize findings from multiple sources:**

```yaml
Thesis (Documentation - context7):
  "Official docs say feature X works like this..."

Antithesis (Reality - github):
  "But GitHub issue #123 shows it fails in scenario Y..."

Synthesis (Your recommendation):
  "Feature X works as documented, BUT only under conditions A, B, C.
   For your use case, here's the recommended approach..."
```

**Critical thinking framework:**

1. **Check version alignment**
   - Docs version: {e.g., v15.0}
   - User's version: {check package.json if available}
   - Issue mentions: {e.g., "fixed in v15.0.2"}

2. **Assess stability**
   - Docs label: {stable | experimental | deprecated}
   - Issue count: {many active issues = unstable}
   - Maintainer stance: {officially supported?}

3. **Evaluate applicability**
   - User's context: {framework version, environment}
   - Docs assumptions: {what context docs assume}
   - Gap analysis: {what's different?}

---

## 📝 Phase 4: Structured Output

**Always provide findings in this format:**

```markdown
## 🎯 Key Insight

{One-sentence answer to the user's question}

---

## 📊 Evidence

### 1. Official Documentation (context7)
- **Source:** [{Library Name} - {Doc Title}]({link if available})
- **Finding:** {What the docs say}
- **Version:** {Which version this applies to}
- **Status:** {Stable | Experimental | Deprecated}

### 2. Community Validation (github)
- **Issue:** [#{issue_number}: {title}]({link})
- **Status:** {Open | Closed | Fixed in vX.Y.Z}
- **Key Insight:** {What the community found}
- **Maintainer Response:** {If available}

### 3. Security Analysis (semgrep)
- **Findings:** {Critical | Medium | Low} issues found
- **Details:** {Specific vulnerabilities}
- **Status:** {Safe | Needs fixes}

---

## 💡 Recommendation

Based on the evidence above:

1. **Immediate Action:** {What to do right now}
2. **Best Practice:** {How to do it correctly}
3. **Caveats:** {What to watch out for}
4. **Alternative:** {If recommended approach doesn't fit}

---

## 📚 Additional Resources
- [Link 1]: {Why this is useful}
- [Link 2]: {Context}
```

---

## 🚨 Guardrails & Safety Rules

### No Hallucination Zone

- ❌ **If context7 AND github both return nothing** → Do NOT invent an answer
- ✅ **Instead say:** "No information found in official sources. Would you like me to:
  1. Try alternative search terms?
  2. Check related libraries?
  3. Recommend asking in community forums?"

### Repository Boundary

- 🎯 **Always specify repo** → Don't search all of GitHub
- ✅ **Good:** `repo:vercel/next.js query:"app router"`
- ❌ **Bad:** `query:"app router"` (too broad)

### Tool Priority

```
1st: sequential-thinking (plan the approach)
2nd: tavily (real-time web search - NEW!)
3rd: chub (curated API docs — Gemini, MongoDB, Firebase)
4th: context7 (official documentation)
5th: github (community issues & reality)
6th: claude-code (codebase analysis - Glob, Grep, Read)
7th: semgrep (security validation - with approval)
```

**Decision Matrix:**
| Need | Primary Tool | Fallback |
|------|--------------|----------|
| Current/latest info | tavily | context7 |
| API SDK syntax | chub | context7 |
| Official API docs | context7 | tavily |
| Known bugs/issues | github | tavily |
| Security check | semgrep | context7 |
| Local code | claude-code | - |
| Deep site crawl | tavily_crawl | tavily_search |
| Extract from URL | tavily_extract | tavily_search |

### Cache Awareness

- 📦 **context7 results cached 15min** → Fast follow-up questions
- 📦 **github results cached 5min** → Recent issue status
- ⚠️ **If user says "check latest"** → Invalidate cache (run fresh query)

### Version Sensitivity

- 🚨 **Always check version compatibility**
- If docs are v15 but user has v14 → Flag this explicitly
- Recommend upgrade path if needed

---

## 🎯 Success Criteria

A successful deep-research session:

1. ✅ Started with `sequential-thinking` (planned approach)
2. ✅ Used at least one authoritative source (context7 or github)
3. ✅ Provided evidence-based answer (not speculation)
4. ✅ Cited sources with links (when available)
5. ✅ Flagged any version conflicts or experimental features
6. ✅ Gave actionable recommendations

---

## 🔗 Integration with Other Workflows

**Route to other workflows when:**

- 📋 **→ /opus-planning**: If research reveals complex architecture needed
- 🔨 **→ /claude-building**: If user wants to implement the researched solution
- 🐛 **→ /debug**: If research shows known bug that affects user's code
- 🛡️ **→ /test-sprite**: If security scan reveals issues needing fixes
- 🎨 **→ /ui-ux-pro-max**: If research is about UI libraries or design patterns

---

## 📊 Example End-to-End Flow

```
User: "როგორ გავაკეთო file upload FastAPI-ში?"

┌─────────────────────────────────────┐
│ Phase 1: Sequential Thinking        │
├─────────────────────────────────────┤
│ ✓ Question type: Implementation     │
│ ✓ Need: Code example + best practice│
│ ✓ Primary tool: context7 (FastAPI)  │
│ ✓ Secondary: github (if needed)     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Phase 2: Context7 Research          │
├─────────────────────────────────────┤
│ → context7_resolve("fastapi")       │
│ → Result: /fastapi/fastapi          │
│ → context7_query("file upload")     │
│ → Found: UploadFile, File tutorial  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Phase 3: Validation (GitHub)        │
├─────────────────────────────────────┤
│ → Check: Any known issues?          │
│ → github_search_issues(             │
│     repo="fastapi/fastapi",         │
│     query="file upload size limit"  │
│   )                                 │
│ → Found: Issue about memory usage   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Phase 4: Synthesis                  │
├─────────────────────────────────────┤
│ Key Insight:                        │
│ "Use UploadFile with streaming"     │
│                                     │
│ Evidence:                           │
│ - Docs: Full example                │
│ - Issues: Memory concern for >100MB │
│                                     │
│ Recommendation:                     │
│ "Use UploadFile with chunk reading  │
│  for files >10MB"                   │
└─────────────────────────────────────┘
```

---

**ბოლო სიტყვა:** Deep Research არის ხარისხიანი, ზუსტი და სწრაფი პასუხების საფუძველი. არ იჩქარო - დაფიქრდი, მოძებნე, დაადასტურე, გააანალიზე!
