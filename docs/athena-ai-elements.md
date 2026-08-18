# ATHENA + AI Elements

ATHENA's chat surface uses **source-owned components adapted from the official Vercel AI Elements project**.

Current local primitives live under `components/ai-elements/`:

- `Conversation`, `ConversationContent`, `ConversationScrollButton`
- `Message`, `MessageContent`, `MessageResponse`
- `PromptInput`, `PromptInputTextarea`, `PromptInputSubmit` and composition helpers
- `Suggestions`, `Suggestion`

Each local file contains an upstream source reference so future changes can be compared deliberately against the official project.

## Why the source is adapted locally

Fit For Cancer is an existing Vite + React 19 + Tailwind 4 app with:

- its own Gemini transport;
- its own `ChatMessage` contract;
- memory-only ATHENA session ownership;
- first-party Movement/Nutrition recommendation cards;
- existing Markdown rendering;
- established privacy/reset behaviour.

The useful part of AI Elements here is the **composition and interaction model**, not a framework/provider migration.

The local adaptations therefore remove upstream assumptions that Fit For Cancer does not need, including:

- Next.js;
- AI SDK message/transport state;
- alternate-response branches;
- attachments and model selection;
- Streamdown;
- Radix ScrollArea;
- AI-SDK-specific conversation-download typing.

There is no Next.js migration and no AI SDK transport migration in this integration.

## Current interaction behaviour

### Conversation

The conversation surface is an accessible `role="log"` region with live-edge tracking.

- A newly submitted user turn moves the conversation to the live edge.
- If the user remains at the bottom, new ATHENA content follows naturally.
- If the user scrolls back while ATHENA is responding, the app does not forcibly yank them to the newest message.
- `ConversationScrollButton` appears when the user is away from the live edge.

The jump control is deliberately rendered through a portal into the non-scrolling conversation wrapper. This keeps it visually overlaid on the scrollport instead of allowing it to scroll away with a long transcript.

### Messages

ATHENA replies use `Message` / `MessageContent` composition while continuing to render existing Markdown through `MarkdownMessage`.

First-party `AthenaRecommendationCard` components remain attached to the assistant message that produced their structured recommendation refs.

### Prompt input

ATHENA uses the `PromptInput` composition pattern with a multiline textarea.

- `Enter` sends.
- `Shift+Enter` inserts a newline.
- IME composition is respected before Enter is treated as submit.
- voice dictation remains available where browser support exists.
- while ATHENA is responding, the textarea stays enabled and focused so the user can draft the next thought.
- submit and voice controls remain blocked during the active request, and the page-level send handler also rejects concurrent requests.

### Suggestions

The initial Nutrition, Movement and Just a chat actions use the local `Suggestion` primitive rather than bespoke starter buttons.

## State and transport boundaries

The AI Elements layer does **not** own chat state, persistence, model selection or network transport.

Those remain Fit For Cancer responsibilities:

- `useAthenaSession` owns transcript, draft, loading state and stale-request invalidation.
- `services/geminiService.ts` owns the browser request contract.
- `/api/gemini` owns Gemini orchestration and first-party tool execution.
- Movement/Nutrition recommendation refs/cards remain Fit For Cancer data/UI.
- privacy clear/reset and cross-tab invalidation remain app-owned behaviour.

For the complete flow see [ATHENA architecture](athena-architecture.md).

## Updating the local adaptations

Do not blindly replace these files with a newer upstream snapshot.

When reviewing a future AI Elements update:

1. compare the relevant official component source against the local file;
2. identify useful interaction/accessibility improvements;
3. preserve Fit For Cancer's Vite/Gemini/session boundaries;
4. avoid introducing AI SDK, Next.js or new runtime dependencies unless there is a separately approved architectural reason;
5. run the ATHENA UI/session regression suite after any behavioural change.

The local files are intentionally source-owned components, not frozen forks and not unrelated custom widgets.
