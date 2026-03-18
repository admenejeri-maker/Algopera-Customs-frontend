---
name: ui-ux-design-guidelines
description: >
  Design system principles, accessibility standards (WCAG), responsive
  patterns, color theory, and component design. Use when creating UI
  components, reviewing designs, or establishing design systems.
---

# UI/UX Design Guidelines

Create accessible, beautiful, and consistent user interfaces following
modern design principles and WCAG standards.

## Use this skill when

- Designing new UI components or pages
- Establishing a design system or tokens
- Reviewing UI for accessibility compliance
- Implementing responsive layouts
- Choosing colors, typography, and spacing

## Do not use this skill when

- Writing backend logic — this is frontend-only
- Building API contracts — use `api-design-principles`
- Setting up frontend framework — use `react-nextjs`

## Instructions

### 1. Design System Tokens

```css
:root {
  /* Colors */
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Borders & Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.15);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.2);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

### 2. Accessibility (WCAG 2.1 AA)

| Requirement | Standard | Check |
|-------------|----------|-------|
| Color contrast | 4.5:1 text, 3:1 large text | Use contrast checker |
| Keyboard nav | All interactive elements focusable | Tab through entire page |
| Screen reader | Semantic HTML + ARIA labels | Test with VoiceOver/NVDA |
| Focus visible | Clear focus indicators | `:focus-visible` styles |
| Alt text | All images have descriptive alt | Audit `<img>` tags |
| Motion | Respect `prefers-reduced-motion` | Media query check |

### 3. Responsive Breakpoints

```css
/* Mobile first */
.container { width: 100%; padding: 1rem; }

@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### 4. Component Design Principles

- **Consistency:** Same action = same appearance everywhere
- **Feedback:** Every interaction has visible response
- **Hierarchy:** Size, color, position indicate importance
- **Proximity:** Related items are grouped together
- **White space:** Generous spacing improves readability

### 5. Color Usage

- Primary: Actions, links, interactive elements
- Success/Warning/Error: Status feedback only
- Neutral: Backgrounds, borders, secondary text
- Never rely on color alone for meaning (add icons/text)

## Workflow Integration

**Invoked by:**
- `/ui-ux-pro-max` — primary UI design workflow
- `/claude-building` — when implementing UI components

**After using this skill:** Route to `/claude-building` for implementation.

**Related skills:** `react-nextjs`, `performance-optimization`
