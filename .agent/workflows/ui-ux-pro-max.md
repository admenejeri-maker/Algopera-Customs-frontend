---
workflow: ui-ux-pro-max
version: 3.0
model_preference: claude-opus-4-5
description: Cognitive design intelligence with accessibility and visual generation

# THINKING CONFIG: Maximum reasoning budget for design
thinking_config:
  claude-opus-4-5:
    budget_tokens: 64000
    use_for: "Deep UX analysis, cognitive simulation, accessibility design"
  default:
    budget_tokens: 32000

# Smart Execution Strategy
mcp_strategy:
  phase_1_cognitive_simulation:
    tool: sequential-thinking
    prompt: |
      Simulate user cognition:

      1. Dopamine check: Does this interaction create satisfaction?
      2. Cognitive load: Following Hick's Law? (fewer choices = faster decision)
      3. Flow state: Any friction points that stop user momentum?
      4. Accessibility: Can everyone use this? (vision, motor, cognitive)

    auto_execute: true

  phase_2_accessibility_check:
    tools:
      wcag_verification:
        tool: context7
        query: "WCAG 2.1 AA standards for {component}"

      a11y_checklist:
        - Color contrast ≥ 4.5:1
        - Touch targets ≥ 44x44px
        - Keyboard navigation support
        - Screen reader compatibility

    auto_execute: true

  phase_3_dark_pattern_detection:
    tool: sequential-thinking
    prompt: |
      Ethics check:
      - Hidden costs?
      - Confirmshaming? (shaming users for declining)
      - Forced continuity? (hard to cancel)
      - Disguised ads?

      Flag any dark patterns found.

    auto_execute: true

  phase_4_visual_generation:
    tool: stitch
    when: "prototyping or redesign needed"
    purpose: "Generate visual component prototype"
    auto_execute: false  # UI generation needs approval

# Execution Mode
turbo: true  # Cognitive analysis is safe
requires_approval:
  - stitch_ui_generation  # Visual generation needs approval
  - code_changes

# Design Standards
standards:
  scoop_specific:
    brand_colors: ["Deep Orange", "Black", "White"]
    typography: "Inter (primary), system fonts (fallback)"
    language: "Georgian (ქართული) primary, English secondary"
    max_width: "1184px (chat container)"

  accessibility:
    wcag_level: "AA"
    contrast_ratio_min: 4.5
    touch_target_min: "44x44px"
    focus_indicators: "visible"

  cognitive:
    max_choices_per_screen: 7  # Miller's Law
    loading_feedback: "< 1s response time"
    error_recovery: "clear, actionable messages"
---

# 🎨 UI/UX Pro Max - Cognitive Design (v3.0)

## Overview

**UI/UX Pro Max** ensures designs are beautiful, accessible, and ethical.

**Process:** Cognitive Simulation → Accessibility → Ethics → Visual Generation

---

## 🧠 Phase 1: Cognitive Simulation

**Use `sequential-thinking` to simulate user psychology:**

- **Dopamine:** Does clicking this feel good?
- **Cognitive Load:** Too many choices? (Hick's Law)
- **Flow:** Any friction that breaks momentum?
- **Emotion:** What does user feel? (joy, frustration, confidence)

---

## ♿ Phase 2: Accessibility Check

**WCAG 2.1 AA Requirements:**

- [ ] Color contrast ≥ 4.5:1
- [ ] Touch targets ≥ 44x44px
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible

**Use `context7` to verify standards**

---

## 🚫 Phase 3: Dark Pattern Detection

**Ethics check:**

- ❌ Hidden costs
- ❌ Confirmshaming
- ❌ Forced continuity
- ❌ Disguised ads

**If found → Flag and redesign**

---

## 🎨 Phase 4: Visual Generation (Stitch)

**Use `stitch` for rapid prototyping:**

- Generate component mockup
- Iterate based on feedback
- Export to code

---

## 🔍 Phase 5: Live Browser Audit

**Use `chrome-devtools` MCP + `browser_subagent` for real-device validation.**

1. **Visual Regression:** Navigate to the page, take screenshot, compare against design mockup
2. **Accessibility Audit:** Run Lighthouse accessibility check via DevTools
3. **Responsive Check:** Resize viewport to mobile (375px), tablet (768px), desktop (1440px) — screenshot each
4. **Performance:** Capture Core Web Vitals (LCP, FID, CLS) via DevTools Performance panel
5. **Console Check:** Verify zero JS errors/warnings on the page

> **Tools:** `browser_subagent` + `chrome-devtools` MCP
> **Auto-Execute:** ❌ No (browser interaction needs approval)

---

## 🇬🇪 Scoop-Specific Guidelines

- **Colors:** Deep Orange, Black, White
- **Font:** Inter
- **Language:** ქართული (primary)
- **Max width:** 1184px

---

**ბოლო სიტყვა:** Design is empathy made visible!
