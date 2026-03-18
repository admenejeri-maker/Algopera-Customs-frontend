# Scoop Tax Agent — Frontend Architecture

## Overview

A conversational AI interface for the Georgian Tax AI Agent, built on **Next.js 16** + **React 19** + **Zustand** + **Tailwind CSS 4**. Features real-time SSE streaming with automatic reconnection, session persistence, citation panels, and a responsive design optimized for Georgian-language tax queries.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1 |
| UI Library | React | 19.2 |
| State Management | Zustand (with devtools + persist middleware) | 5.0 |
| Styling | Tailwind CSS | 4.x |
| Markdown | react-markdown | 10.1 |
| Icons | lucide-react | 0.562 |
| Testing | Vitest + Testing Library + Playwright (E2E) | — |
| Bundling | Turbopack (dev) / Webpack (prod) | — |

## Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (metadata, fonts)
│   │   ├── page.tsx                  # Home page (renders Chat)
│   │   ├── globals.css               # Global styles + design tokens
│   │   ├── error.tsx                 # Error boundary
│   │   ├── global-error.tsx          # Root error boundary
│   │   └── not-found.tsx             # 404 page
│   ├── components/
│   │   ├── Chat.tsx                  # Main chat orchestrator (~820 lines)
│   │   ├── chat-response.tsx         # Streaming response renderer
│   │   ├── ChatMessage.tsx           # Individual message bubble
│   │   ├── CitationPanel.tsx         # Source text sidebar panel
│   │   ├── CitationPanel.css         # Citation panel styles
│   │   ├── sidebar.tsx               # Session sidebar (history list)
│   │   ├── SettingsModal.tsx         # User settings dialog
│   │   ├── DeleteDataModal.tsx       # Data deletion confirmation
│   │   ├── TypingIndicator.tsx       # Animated typing dots
│   │   ├── ConsentBanner.tsx         # History consent prompt
│   │   ├── ErrorBoundary.tsx         # Component-level error boundary
│   │   └── SourceChip.tsx            # Citation chip component
│   ├── hooks/
│   │   ├── index.ts                  # Barrel export
│   │   ├── useSSEStream.ts           # SSE streaming hook (core)
│   │   ├── useChatSession.ts         # Chat session lifecycle
│   │   └── useFeatureFlags.ts        # Feature flag management
│   ├── stores/
│   │   ├── useSessionStore.ts        # Session state (Zustand + persist)
│   │   ├── useUIStore.ts             # UI state (sidebar, modals)
│   │   └── useCitationStore.ts       # Citation panel state
│   ├── lib/
│   │   ├── apiClient.ts              # Fetch wrapper + API key enrollment
│   │   ├── messageParser.ts          # Message format parsing
│   │   └── utils.ts                  # Shared utilities
│   └── types/
│       ├── api.ts                    # TypeScript types (Message, Conversation, SourceDetail)
│       └── index.ts                  # Barrel export
├── public/                           # Static assets
├── tests/                            # Vitest unit tests
├── e2e/                              # Playwright E2E tests
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

## Component Architecture

```
layout.tsx
  └── page.tsx
        └── Chat (main orchestrator)
              ├── Sidebar (dynamic import, SSR: false)
              │     └── Session list + New Chat button
              ├── ConsentBanner
              ├── WelcomeSection (centered, shown when no messages)
              │     └── QuickActionPills
              ├── ChatHistory (scrollable message list)
              │     ├── MessageBubble (user messages)
              │     └── ChatResponse (dynamic import)
              │           ├── Markdown renderer (react-markdown)
              │           ├── SourceChip[] (citation markers)
              │           ├── TypingIndicator
              │           └── Quick reply buttons
              ├── CitationPanel (slide-out sidebar)
              │     └── Source text + metadata display
              ├── Input area (textarea + submit)
              ├── SettingsModal
              └── DeleteDataModal
```

## State Management

### Zustand Stores

Three domain-separated stores, each with Zustand `create()`:

#### `useSessionStore` (persisted to localStorage)
| State | Type | Purpose |
|-------|------|---------|
| `conversations` | `Conversation[]` | All chat sessions |
| `activeId` | `string \| null` | Currently selected session |
| `userId` | `string` | Auto-generated user identifier |
| `consent` | `string \| null` | History storage consent |
| `isSessionReady` | `boolean` | Gate for async session init |
| `sessionsLoaded` | `boolean` | Sessions fetched from backend |
| `isLoadingHistory` | `boolean` | History fetch in progress |

**Key actions:** `createConversation()`, `loadSessions()`, `loadSessionHistory()`, `handleDeleteData()`, `initializeSession()`, `updateMessage()` (granular SSE updates)

#### `useUIStore`
| State | Type | Purpose |
|-------|------|---------|
| `isSidebarOpen` | `boolean` | Sidebar visibility |
| `isSettingsOpen` | `boolean` | Settings modal state |
| `isDeleteModalOpen` | `boolean` | Delete confirmation state |

#### `useCitationStore`
| State | Type | Purpose |
|-------|------|---------|
| `selectedSource` | `SourceDetail \| null` | Active citation source |
| `isPanelOpen` | `boolean` | Citation panel visibility |

## SSE Streaming Architecture

### `useSSEStream` Hook

Core streaming hook with:
- **SSE parsing** — Handles `event:` headers and `data.type` fallback
- **Event dispatch** — Routes parsed events to typed handler callbacks
- **Reconnection** — Automatic retry with exponential backoff (3 attempts, 1s base, 2x multiplier)
- **Abort management** — Clean cancellation via `AbortController`
- **Error classification** — Distinguishes retryable (502/503/504) from non-retryable (4xx, AbortError) errors

### SSE Event Flow

```
Backend SSE Stream
    │
    ▼
useSSEStream.startStream()
    │
    ├── event: text      → onText(content)      → append to message
    ├── event: sources   → onSources(sources[])  → render citation chips
    ├── event: thinking  → onThinking(content)   → show reasoning
    ├── event: tip       → onTip(tipText)        → display tip box
    ├── event: products  → onProducts(content)   → render product cards
    ├── event: quick_replies → onQuickReplies()  → show reply buttons
    ├── event: truncation_warning → onTruncationWarning()
    ├── event: done      → onDone(sessionId)     → finalize message
    └── event: error     → onError(message)      → show error state
```

### Data Flow

```
User Input
    │
    ▼
Chat.handleSubmit()
    │ Creates user Message, appends to conversation
    │ Calls startStream() with SSE handlers
    ▼
apiFetch("POST /api/v1/chat", {message, session_id, user_id})
    │ Adds X-API-Key header
    │ Returns ReadableStream
    ▼
useSSEStream parses chunks → dispatches to handlers
    │
    ▼
handlers update Zustand store (useSessionStore.updateMessage)
    │
    ▼
React re-renders: ChatResponse shows streaming text
    │
    ▼
onDone: finalize message, scroll to bottom
```

## API Client

`apiClient.ts` wraps `fetch()` with:
- **Auto API key enrollment** — On first visit, calls `POST /auth/enroll` and stores key in localStorage
- **Header injection** — Adds `X-API-Key` and `X-User-Id` to every request
- **Error handling** — Throws on non-OK responses with status details

Backend URL: `NEXT_PUBLIC_BACKEND_URL` env var (default: `http://localhost:8080`)

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Dynamic imports for Sidebar, ChatResponse | Reduce initial bundle; SSR disabled for client-only components |
| Zustand over Redux | Lighter footprint, simpler API for 3 small stores |
| SSE over WebSocket | Unidirectional streaming sufficient; simpler infrastructure |
| localStorage persistence | Offline session continuity; no server dependency for UI state |
| `react-markdown` for rendering | Safe HTML rendering of LLM output with plugin support |
| Exponential backoff reconnection | Handles transient network failures gracefully |

## Deployment

- **Platform:** Vercel (Next.js native) or Cloud Run
- **Build:** `next build` (Webpack production)
- **Dev:** `next dev --turbopack` for fast HMR
- **Environment Variables:**
  - `NEXT_PUBLIC_BACKEND_URL` — Backend API endpoint
