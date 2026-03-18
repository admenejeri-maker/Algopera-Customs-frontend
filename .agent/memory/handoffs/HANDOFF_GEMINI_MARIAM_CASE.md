# 🔄 Handoff: Mariam Case RAG Pipeline Fixes — Architectural Review

> **Date:** 2026-02-25
> **From:** Claude (Antigravity Agent)
> **To:** Gemini CLI (Architectural Reviewer)
> **Mode:** PLANNING ONLY — არანაირი კოდი არ დაწერო!

---

## 🎯 შენი ამოცანა

შენ ხარ **Lead Architect / QA Reviewer**. შენი სამუშაოა:

1. წაიკითხე პრობლემის აღწერა და გადაწყვეტის გეგმა
2. შეამოწმე და **დაჩელენჯე** მიდგომა — მოძებნე სისუსტეები, edge-case-ები, ალტერნატივები
3. თუ რამე შესაცვლელია, **განაახლე** `implementation_plan.md`
4. **კოდი არ დაწერო** — მხოლოდ არქიტექტურული გეგმა

---

## 📋 პრობლემის აღწერა

### "მარიამის ქეისი" — კრიტიკული RAG Pipeline ბაგები

მარიამი არის ფიზიკური პირი, რომელსაც აქვს:
- ხელფასი: 2,500 ლარი/თვე (30,000 წელიწადში)
- ავტომობილის გაყიდვა: იყიდა 8,000-ად, გაყიდა 12,000-ად (მოგება: 4,000)
- სტატუსი: მარტოხელა მშობელი (6,000 ლარის შეღავათი, მუხლი 82.2)
- ინვალიდობა: შეზღუდული შესაძლებლობა (6,000 ლარის შეღავათი, მუხლი 82.2)

**მოსალოდნელი სწორი პასუხი: 2,900 ლარი გადასახადი**

გამოთვლა:
1. ხელფასი: 30,000 − 6,000 (უმაღლესი ერთი შეღავათი) = 24,000 × 20% = **4,800**
2. ავტომობილი: (12,000 − 8,000) = 4,000 × 5% (მუხლი 81.3) = **200**
3. მიწისქვეშა: შეღავათები არ იჯამება (მუხლი 82.3 — ერთი უმაღლესი)
4. **ჯამი: 5,000 − 2,100 (სხვა გამოქვითვები) = 2,900 ლარი**

### აღმოჩენილი 3 ბაგი:

| # | ბაგი | Root Cause | სიმძიმე |
|---|---|---|---|
| **BUG-1** | "Statute Dependency Loss" — მუხლი 82.3 (შეღავათების გადამფარვის წესი) არ მოდის კონტექსტში | სემანტიკური ძებნა ვერ პოულობს მეტა-წესს, რადგან 82.3 სემანტიკურად შორს არის 82.2 შეღავათების ჩანკებისგან | P0 |
| **BUG-2** | "Mathematical Hallucination" — LLM იყენებს 20% ავტომობილის გაყიდვაზე, ნაცვლად 5%-ისა (მუხლი 81.3) | LLM-ის პარამეტრული მეხსიერება override-ს აკეთებს კონტექსტს — "საშემოსავლო = 20%" | P0 |
| **BUG-3** | UI-ზე ⚠️ disclaimer ორჯერ ჩანს | Backend-ის ექსპლიციტური disclaimer + LLM-ის საკუთარი disclaimer ერთმანეთს ემატება | P3 |

### Trace Report (სრული ანალიზი):
📄 **წაიკითხე:** `backend/tax_agent/scripts/TRACE_REPORT_MARIAM_CASE.md`

---

## 🏗️ შემოთავაზებული გადაწყვეტის გეგმა

### არქიტექტურის სქემა:

```
User Query
    │
    ▼
classify_red_zone() ─── is_red_zone=True?
    │
    ▼
hybrid_search() → search_results
    │
    ▼
compress + reassemble + expand_neighbors
    │
    ▼
┌─────────────────────────────────────────┐
│  🆕 inject_mandatory_statutes()         │  ◀── FIX 1: ახალი middleware
│  Channel A: Result-based (Art 82×2→82.3)│
│  Channel B: Query-intent (keywords→81.3)│
└─────────────────────────────────────────┘
    │
    ▼
pack_context(20,000 chars)  ◀── ბიუჯეტის enforcer
    │
    ▼
audit_context_coverage() + gap_fill()
    │
    ▼
┌─────────────────────────────────────────┐
│  🆕 build_system_prompt() + Rate Table  │  ◀── FIX 2: განაკვეთის ცხრილი
│  if is_red_zone → inject framework      │
└─────────────────────────────────────────┘
    │
    ▼
LLM Generation (Gemini)
    │
    ▼
┌─────────────────────────────────────────┐
│  🆕 Idempotent Disclaimer              │  ◀── FIX 3: core substring match
│  _DISCLAIMER_CALC_CORE not in answer    │
└─────────────────────────────────────────┘
    │
    ▼
SSE Stream → Frontend
```

---

### FIX 1: MandatoryStatuteInjector (`statute_injector.py` — ახალი ფაილი)

**რა არის:** დეტერმინისტული post-retrieval middleware, რომელიც ამოწმებს 2 არხს:

**არხი A — Result-based:**
- თუ `search_results`-ში Art 82 ჩანკი ≥ 2 ცალი → ინექცია Art 82.3 (`chunk_index: 62`)
- ეს ჩანკი შეიცავს: "ერთი, უმაღლესი შეღავათი გამოიყენება"

**არხი B — Query-intent:**
- თუ query შეიცავს keywords-ს (`გაყიდ`, `ავტომობილ`, `მანქან`, `რეალიზაცი`, `ტრანსპორტ`) AND `is_red_zone=True`
- → ინექცია Art 81.3 (`chunk_indices: [3, 4]`) — 5% სპეციალური განაკვეთი
- **Keywords ინახება `config.py`-ში** (არა hardcoded), რომ ახალი ტერმინების დამატება `.env`-დან შეიძლებოდეს

**ინექციის წერტილი:** `expand_chunk_neighbors()`-ის შემდეგ, `pack_context()`-მდე
- ინექტირებული ჩანკები **prepend** ხდება (head position)
- `pack_context` tail-დან აჭრის → mandatory ჩანკები გარანტირებულად რჩება

**კრიტიკული ფაილები წასაკითხად:**
- `backend/tax_agent/app/services/rag_pipeline.py` — ხაზები 525-545 (sync), 897-918 (stream)
- `backend/tax_agent/app/services/rag_pipeline.py` — `pack_context()` ფუნქცია, ხაზი 368
- `backend/tax_agent/config.py` — ხაზი 83 (`max_context_chars: int = 20000`)

---

### FIX 2: Rate Pinning System Prompt-ში (`tax_system_prompt.py` — მოდიფიკაცია)

**რა არის:** როცა `is_red_zone=True`, `build_system_prompt()`-ში ინექტირდება ქართულენოვანი "გამოთვლის ჩარჩო":

- **განაკვეთის ცხრილი** (rate table): ხელფასი→20%, ავტომობილი→5%, ქირა→20%
- **შეღავათების წესი** (Art 82.3): "ერთზე მეტი → მხოლოდ ერთი, უმაღლესი"
- **4-ნაბიჯიანი გამოთვლის პროცედურა**

**რატომ ორივე (Injection + Prompt)?** — Defense in Depth:
- Chunk Injection = **მტკიცებულება** (LLM-ს აქვს ტექსტი ციტირებისთვის)
- System Prompt = **ინსტრუქცია** (LLM-ს აქვს პროცედურა გამოთვლისთვის)
- ერთი მეორის გარეშე არ მუშაობს

**კრიტიკული ფაილები წასაკითხად:**
- `backend/tax_agent/app/services/tax_system_prompt.py` — ხაზები 128-210, `build_system_prompt()`
- `backend/tax_agent/tests/test_system_prompt.py` — არსებული ტესტების პატერნები

---

### FIX 3: Disclaimer Idempotency (`rag_pipeline.py` — მოდიფიკაცია)

**რა არის:** LLM-მა შეიძლება თავისი ტექსტში ჩართოს ⚠️ disclaimer (markdown variants-ით). Backend-იც აგზავნის იგივე disclaimer-ს text event-ად. შედეგი: ორმაგი ⚠️.

**გადაწყვეტა:** Core substring matching:
```python
_DISCLAIMER_CALC_CORE = "კონკრეტული თანხების გამოსათვლელად"
# full string match-ის ნაცვლად, core substring ამოწმებს LLM-ის ნებისმიერ ვარიანტს
if _DISCLAIMER_CALC_CORE not in full_answer:
    yield disclaimer_event
```

**რატომ core substring და არა full match:**
- LLM შეიძლება: `**⚠️ კონკრეტული...**` (bold) ან `> კონკრეტული...` (blockquote)
- Core ფრაზა `"კონკრეტული თანხების გამოსათვლელად"` უნიკალურია და ყველა ვარიანტს ჭერს

---

## 🔍 რა უნდა შეამოწმო (Checklist)

### არქიტექტურული კითხვები:

- [ ] **Injection Order:** `inject_mandatory_statutes()` BEFORE `pack_context()` — ხომ სწორია? რა edge case-ებია?
- [ ] **Dual-Signal Triggers:** Query-intent მიდგომა (keywords) საკმარისად robust არის? რა მოხდება თუ user-ი ორაზროვან ფორმულირებას იყენებს?
- [ ] **Config Externalization:** Keywords `config.py`-ში — სწორი გადაწყვეტილებაა? Pydantic list field-ის ალტერნატივა?
- [ ] **Rate Table Completeness:** ცხრილში რამე აკლია? სხვა რა განაკვეთები უნდა იყოს?
- [ ] **Idempotency Edge Cases:** `_DISCLAIMER_CALC_CORE` — false positive-ის რისკი? რა მოხდება თუ LLM ციტირებს ამ ფრაზას სხვა კონტექსტში?
- [ ] **Budget Impact:** 3 ახალი ჩანკის ინექცია (~500-1500 chars) + rate table (~400 tokens) — 20K ბიუჯეტში ეტევა?
- [ ] **Fail-safe:** თუ MongoDB `find_one()` fail-დება injection-ის დროს, pipeline crash ხდება თუ graceful degradation?

### სრული Implementation Plan:
📄 **წაიკითხე და განაახლე (საჭიროების შემთხვევაში):**
`/Users/maqashable/.gemini/antigravity/brain/9832f6c0-1523-4544-b84e-1f10110af541/implementation_plan.md`

### დამხმარე ფაილები:
- Trace Report: `backend/tax_agent/scripts/TRACE_REPORT_MARIAM_CASE.md`
- Pipeline: `backend/tax_agent/app/services/rag_pipeline.py`
- System Prompt: `backend/tax_agent/app/services/tax_system_prompt.py`
- Config: `backend/tax_agent/config.py`
- Classifiers: `backend/tax_agent/app/services/classifiers.py`
- Existing Tests: `backend/tax_agent/tests/test_system_prompt.py`, `tests/test_rag_pipeline.py`

---

## ⛔ შეზღუდვები

1. **კოდი არ დაწერო** — მხოლოდ არქიტექტურული review და გეგმის განახლება
2. **implementation_plan.md განაახლე** თუ ცვლილება საჭიროა
3. **ქართულად** უპასუხე არქიტექტურულ კითხვებს
4. **Project Root:** `/Users/maqashable/Desktop/scoop-sagadasaxado`
