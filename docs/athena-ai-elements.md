# ATHENA + AI Elements

ATHENA's chat surface uses source-owned components adapted from the official Vercel AI Elements project:

- `Conversation`, `ConversationContent`, `ConversationScrollButton`
- `Message`, `MessageContent`, `MessageResponse`
- `PromptInput`, `PromptInputTextarea`, `PromptInputSubmit` and related composition helpers
- `Suggestions`, `Suggestion`

The upstream component source is intentionally adapted rather than installed as a framework/runtime dependency. Fit for Cancer is an existing Vite + React 19 + Tailwind 4 application with a Gemini transport and its own in-memory session/privacy model. The adaptations remove assumptions that are not part of this app, including Next.js, AI SDK message types, alternate-response branches, attachments/model selection, Streamdown and Radix ScrollArea.

The goal is to follow the official AI Elements composition and interaction model while preserving Fit for Cancer's existing architecture:

- Gemini remains the chat transport.
- `ChatMessage` remains the conversation state contract.
- ATHENA session state remains memory-only and persists across route navigation as before.
- privacy clear/reset behaviour remains unchanged.
- Movement/Nutrition recommendation refs and cards remain owned by Fit for Cancer.
- the existing `MarkdownMessage` renderer remains in use.
- no Next.js or AI SDK migration is introduced by this change.

Each adapted component includes an upstream source reference in its file header so future updates can be compared against the official project deliberately rather than treating the local copies as unrelated custom widgets.
