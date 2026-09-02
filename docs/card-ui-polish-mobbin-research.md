# Movement + Nutrition Card UI Research and Polish Scope

_Last researched and scoped: 2 September 2026_

## Purpose

This document captures the design research, product reasoning and implementation scope for the next Movement, Nutrition and ATHENA recommendation-card polish pass.

It exists to prevent the work from being reduced to vague "make the cards nicer" instructions or reinterpreted later as a broad redesign.

The intended outcome is a calmer, more intentional recommendation experience that:

- reduces cognitive load;
- improves visual hierarchy;
- preserves safety information;
- keeps Nutrition comparatively lightweight;
- simplifies the denser Movement cards;
- makes ATHENA recommendation cards feel connected to the source libraries;
- introduces restrained, purposeful animation and micro-interactions;
- respects reduced-motion accessibility;
- does not change recommendation logic, canonical content ownership or fatigue-zone behaviour.

This is a UI and interaction polish pass, not a product rearchitecture.

---

## Design direction in one line

**Oura restraint + Future Pro action hierarchy + Crouton recipe presentation + ATHENA's conversational voice.**

That synthesis is the strongest summary of the research.

The goal is not to copy any one product. The useful patterns are the hierarchy, restraint and interaction principles behind them.

---

# 1. Mobbin research

## Research objective

The Mobbin research was deliberately targeted at:

- nutrition and recipe cards;
- movement and exercise recommendation cards;
- health and wellness recommendation surfaces;
- recipe detail presentation;
- small sets of personalised recommendations;
- strong mobile hierarchy;
- low-noise metadata;
- obvious next actions;
- patterns that could improve Fit For Cancer without making it look like a calorie tracker, gym app or generic dashboard.

The useful references came primarily from mobile interfaces. A broader web search returned mostly generic productivity/dashboard references and did not materially improve the direction, so those generic web results should **not** be treated as design references for this work.

---

## Primary reference: Oura

Relevant Mobbin screen:

- [Oura personalised recommendation example](https://mobbin.com/screens/f528871c-4be6-4bcf-ae97-c06f921449b1)

### What is useful

Oura is the strongest reference for **restraint**.

Useful patterns:

- the recommendation itself is visually dominant;
- supporting explanation is quieter;
- there is very little competing metadata;
- the interface avoids turning every piece of information into a badge or chip;
- hierarchy is created mainly through spacing, typography and grouping rather than decorative containers;
- the recommendation feels calm and guided rather than gamified.

### What not to copy

Do not import:

- score obsession;
- readiness/performance framing;
- data-dashboard density;
- health metrics as the primary emotional centre of the card.

For Fit For Cancer, Oura is a hierarchy reference, not a product-model reference.

---

## Primary reference: Future Pro

Relevant Mobbin screens:

- [Future Pro recommendation hierarchy](https://mobbin.com/screens/ff1834cf-3a2a-449d-8218-2c60c68f489b)
- [Future Pro exercise example](https://mobbin.com/screens/186461a8-d5e5-44f1-b990-5414b3886019)

### What is useful

Future Pro is the strongest reference for **Movement-card hierarchy and next action**.

Useful patterns:

- the movement/workout name is unmistakably the hero;
- supporting details sit beneath it instead of competing with it;
- duration and effort-related metadata are easy to scan;
- the next action is obvious;
- card structure supports quick understanding before deeper detail;
- the interface feels guided rather than like a raw library record.

### What not to copy

Do not import:

- gym-program aesthetics;
- performance language;
- achievement framing;
- training intensity as an aspirational target.

Fit For Cancer Movement recommendations should borrow Future Pro's hierarchy while remaining supportive, scalable and explicitly non-prescriptive.

---

## Primary reference: Noom

Relevant Mobbin screens:

- [Noom personalised recommendation example](https://mobbin.com/screens/64933ee6-b213-4f00-82d2-ff8ba34c7f9b)
- [Noom movement example](https://mobbin.com/screens/2d874e17-f4c9-4fd9-82a3-1eaba50dfe50)
- [Noom nutrition example](https://mobbin.com/screens/52fe527b-8359-4bc7-bec0-def70d9f5531)
- [Noom recipe/detail example](https://mobbin.com/screens/2fbd2af1-a7c7-4ce2-825f-2f2666481376)

### What is useful

Noom is useful for the way recommendations can feel like **coaching rather than database results**.

Useful patterns:

- concise explanatory context;
- progressive disclosure;
- clear separation between the recommendation and deeper detail;
- recommendations feel chosen for a person rather than merely retrieved from a catalogue;
- supporting copy is readable without overwhelming the primary action.

### What not to copy

Do not import:

- behavioural-program baggage;
- gamification;
- weight-loss framing;
- unnecessary progress mechanics.

ATHENA already provides the conversational coaching layer. The cards should support that, not attempt to reproduce it.

---

## Primary reference: MacroFactor

Relevant Mobbin screens:

- [MacroFactor recommendation example](https://mobbin.com/screens/bd079a0d-9ba0-4672-882d-b0a2ce05b9cd)
- [MacroFactor nutrition example](https://mobbin.com/screens/9eee1cbc-b672-4363-90eb-1f9c8316cc6a)
- [MacroFactor recipe/detail example](https://mobbin.com/screens/7774ef8b-ee7f-4ff5-b120-8655fe04a862)

### What is useful

MacroFactor is useful mainly for **typographic discipline and metadata placement**.

Useful patterns:

- metadata has a clear visual rank;
- labels are compact;
- the title remains stronger than the supporting facts;
- spacing helps separate information without excessive boxes.

### What not to copy

Do not import:

- calorie/macro density;
- nutrition quantification as the dominant interface;
- performance or tracking behaviour that makes eating feel clinical.

Fit For Cancer Nutrition should remain treatment-day focused and low effort.

---

## Primary reference: Crouton

Relevant Mobbin screen:

- [Crouton recipe presentation](https://mobbin.com/screens/57fada57-d4f0-4519-a6ba-b7aaedb514f3)

### What is useful

Crouton is the strongest reference for **recipe information order**.

Useful sequence:

1. strong food image;
2. recipe name;
3. a small amount of useful metadata;
4. clear path to the recipe itself;
5. deeper content disclosed after the user chooses to open it.

This maps well to the current Fit For Cancer Nutrition architecture because the recipe card already opens into a dedicated modal.

### What not to copy

Do not turn the card itself into a miniature full recipe page.

The card should remain a decision surface, not a complete recipe surface.

---

## Other useful references

The search also surfaced examples from:

- Garmin Connect;
- Strava;
- pushr;
- Life Reset;
- Mindvalley;
- Wabi;
- Instacart.

These were useful mainly as secondary confirmation that strong card systems generally reduce the number of equally weighted UI elements and make the primary action easier to identify.

They are not intended as primary visual references for this PR.

---

# 2. Mobbin-derived design principles

The implementation should preserve these principles explicitly.

## One dominant piece of information per card

The recommendation title should win visually.

The user should not need to visually negotiate several equally strong badges, panels and headings before understanding what is being recommended.

---

## Metadata should support, not compete

Duration, category, energy zone, preparation time and benefit information are useful.

They should not all become:

- pills;
- chips;
- coloured boxes;
- icons with equal emphasis;
- nested mini-cards.

Use typography, spacing and grouping before adding another visual container.

---

## Progressive disclosure over information density

Show enough information to decide whether the recommendation is worth opening.

Deeper information belongs in:

- the Movement library item;
- the Nutrition recipe modal;
- the destination page;
- expandable or secondary detail where appropriate.

The first card view does not need to expose everything the canonical record contains.

---

## One obvious next action

Each card should have one clear action.

Examples:

- **View Recipe**
- **Open in Nutrition**
- **Open in Movement**

Avoid multiple competing CTAs.

Source/citation access should remain available but visually secondary.

---

## Movement should feel guided, not performance-oriented

Movement can borrow strong hierarchy from fitness products without importing fitness-culture assumptions.

It must remain appropriate for someone who may be:

- fatigued;
- cognitively overloaded;
- in treatment;
- browsing rather than committing;
- scaling activity down;
- choosing rest.

The card must not imply that a higher-energy option is an achievement target.

---

## Nutrition should remain lighter than Movement

This is an important product decision.

The current Nutrition cards already have fewer pills/chips and substantially less structural clutter than Movement.

That is a strength.

Do **not** force visual symmetry by adding more labels, badges or panels to Nutrition.

Movement and Nutrition should feel like siblings, not twins.

---

## Cards should feel like recommendations, not dashboards

Avoid visually splitting one recommendation into multiple colourful sub-cards.

A card should read as one coherent recommendation with supporting information.

This is especially important for Movement, where the current Mind & Mood, Body & Strength and safety blocks make the card feel more like a dashboard.

---

## Motion should reinforce interaction and navigation

Animation should answer questions such as:

- Did this card respond to my hover/tap?
- Did this modal open?
- Did ATHENA take me to the right item?
- Did this state change?

Animation should not exist simply to make the interface look lively.

---

# 3. Current Fit For Cancer card state

## NutritionCard

Current strengths:

- strong food photography;
- relatively low chip count;
- only category and fatigue-zone pills;
- clear prep/cook metadata;
- clear recipe title;
- "Why it may help" content;
- key ingredient preview;
- obvious **View Recipe** CTA;
- dedicated recipe modal for deeper detail;
- existing focus management and keyboard handling;
- analytics already tied to recipe opening.

Current issues are primarily polish issues rather than structural issues.

The Nutrition card should therefore receive a **refinement**, not a redesign.

---

## MovementCard

Current structure includes:

- zone badge on the image;
- zone emoji repeated in the title;
- title;
- source/citation;
- duration;
- benefit;
- description;
- separate Mind & Mood coloured panel;
- separate Body & Strength coloured panel;
- separate safety panel;
- citation content within safety.

This produces too many competing visual layers.

The Movement card is the main target for simplification.

---

## AthenaRecommendationCard

Current structure is already relatively strong:

- compact thumbnail;
- small domain eyebrow;
- title;
- concise metadata;
- safety note;
- full-width CTA;
- exact deep link to the canonical destination item.

The goal here is polish and visual alignment, not a rewrite.

ATHENA recommendation cards should remain condensed views of canonical Fit For Cancer data.

---

# 4. Proposed card anatomy

## Movement library card

Target hierarchy:

**Energy context / zone**

# Movement title

**Duration · primary benefit**

Short movement description.

### Why it may help

- Mind & mood
- Body & strength

### Things to watch

Safety guidance.

Source/citation remains available but secondary.

### Important implementation notes

- remove the duplicated zone emoji from the title;
- retain one zone indicator only;
- reduce oversized nested coloured panels;
- combine the two benefit areas into a quieter informational section;
- preserve all canonical benefit and safety content;
- keep safety visible rather than hiding it behind an interaction;
- reduce the visual dominance of citations;
- use spacing and typography to create hierarchy.

---

## Nutrition library card

Target hierarchy:

**Category / energy context**

# Recipe title

**Prep · cook**

### Why it may help

Concise benefit copy.

### Key ingredients

Short preview.

**View Recipe**

### Important implementation notes

- retain the current low chip count;
- do not add additional metadata pills;
- strengthen title priority slightly;
- tighten vertical spacing;
- retain food imagery as an important part of the card;
- retain the recipe modal as the full-detail surface;
- preserve safety/citation behaviour;
- preserve analytics semantics.

---

## ATHENA Movement recommendation card

Target hierarchy:

**Movement**

# Movement title

**Duration · primary benefit**

Safety note.

**Open in Movement →**

The recommendation should feel related to the Movement library card, but remain much more compact.

---

## ATHENA Nutrition recommendation card

Target hierarchy:

**Nutrition**

# Recipe title

**Prep time · category**

Safety note only where relevant.

**Open in Nutrition →**

Again, this should be a condensed canonical card, not a miniature recipe page.

---

# 5. Why ATHENA should not add another "why this" field inside the card

ATHENA's conversational message already provides the personalised context around a recommendation.

The application then renders the canonical Movement/Nutrition recommendation.

Do not add a new AI-generated personalised explanation field inside the canonical recommendation card.

The architectural boundary remains:

```text
User request
  ↓
Gemini interprets intent and converses
  ↓
Fit For Cancer executes deterministic recommendation logic
  ↓
Fit For Cancer renders canonical recommendation data
```

Gemini must not own:

- canonical card content;
- fatigue-zone mapping;
- safety metadata;
- canonical IDs;
- recommendation selection;
- new presentation fields inserted into the cards.

---

# 6. Motion and micro-interaction specification

## General principle

The current interface contains motion that is more energetic than necessary for this product.

Examples include:

- card lift of roughly 5px;
- recipe image scale of roughly 5%;
- button hover scale to 1.05;
- button tap scale to 0.95;
- 500ms transitions;
- modal scale from 0.9 with 20px vertical movement;
- continuous pulse indicators.

The new motion system should be quieter.

---

## Card hover

Desktop/pointer devices only.

Target behaviour:

- card rise: approximately **2px**;
- subtle shadow increase;
- no dramatic floating;
- roughly **160–220ms** response;
- motion should return naturally when pointer leaves.

Touch interfaces should not depend on hover behaviour.

---

## Image hover

For cards with imagery:

- maximum scale roughly **1–2%**;
- no large zoom;
- image should feel responsive but stable.

Nutrition imagery can keep a small visual response because the photograph is part of the recipe decision surface.

---

## CTA hover and tap

Prefer micro-interactions on the action affordance rather than scaling the entire interface element aggressively.

Target behaviour:

- subtle background/contrast transition;
- arrow or action icon can translate approximately **2px**;
- press/tap scale around **0.98** where scale is useful;
- avoid hover scale to **1.05**;
- avoid tap compression to **0.95**.

The action should feel responsive, not springy.

---

## Timing

General target:

- **160–220ms** for hover/press/state transitions;
- ease-out for entrances;
- standard easing for hover/state changes;
- avoid slow 500ms hover transitions.

Longer timing is acceptable only where the transition represents a larger navigation/state change.

---

# 7. Recipe modal motion

The existing Nutrition modal architecture should remain.

Preserve:

- `role="dialog"`;
- `aria-modal`;
- focus transfer into the modal;
- Escape-to-close;
- focus trapping;
- focus return to the trigger;
- body scroll lock;
- backdrop click close;
- existing recipe content and safety detail.

The animation should become quieter.

## Current behaviour

Approximately:

- opacity fade;
- scale from 0.9;
- vertical movement of 20px.

## Target behaviour

Approximately:

- opacity fade;
- scale from about 0.98;
- vertical movement of about 6–8px;
- mirrored exit;
- short, restrained transition.

The modal should feel like it appears in place, not like it launches toward the user.

---

# 8. ATHENA → library handoff

The exact-item handoff already exists and must remain.

Current behaviour:

1. ATHENA recommendation CTA navigates to the correct route with `?athena=<id>`;
2. the target is temporarily kept visible even if an older filter would hide it;
3. the destination item receives focus;
4. the page smooth-scrolls the target into view;
5. the target receives a static accent ring;
6. normal filtering resumes after the user changes search/filter state.

This behaviour is important and already regression-tested.

## Polish goal

Add a brief, purposeful arrival treatment:

1. destination opens;
2. correct item comes into view;
3. target gets a short visual emphasis;
4. emphasis settles into the existing accessible focus/accent state.

The arrival treatment should be subtle.

Possible implementation:

- brief border/background emphasis;
- approximately 500–700ms total;
- no bouncing;
- no flashing;
- no repeated pulse.

The user should simply feel that the interface has clearly landed on the item ATHENA meant.

---

# 9. Reduced motion

Reduced-motion support is part of this PR, not deferred work.

Respect `prefers-reduced-motion: reduce`.

## When reduced motion is enabled

- disable card translation/lift;
- disable image zoom;
- disable scale/slide modal transforms;
- use simple fade or immediate state changes where appropriate;
- replace smooth target scrolling with immediate/auto scrolling;
- remove unnecessary continuous pulse effects;
- do not animate the ATHENA arrival highlight in a way that creates movement;
- preserve all focus and state cues through static styling.

## Existing continuous pulse to review

The Nutrition page currently uses a pulsing dot for:

> Dynamic Mode Active: Following your ... Zone

This should become static in reduced-motion mode.

If the pulse provides little value in normal mode, removing the continuous animation entirely is acceptable.

---

# 10. Scope by component

## `components/MovementCard.tsx`

Main redesign target.

Expected work:

- simplify information hierarchy;
- remove duplicate zone emoji;
- keep one energy/zone marker;
- reduce nested coloured panels;
- consolidate benefit presentation;
- preserve safety note;
- preserve citation/source;
- reduce hover movement;
- update pointer micro-interactions;
- support reduced motion.

---

## `components/NutritionCard.tsx`

Refinement only.

Expected work:

- retain the current small number of pills;
- tighten spacing;
- strengthen title hierarchy;
- keep image-first recipe feel;
- preserve prep/cook metadata;
- preserve "Why it may help";
- preserve ingredient preview;
- preserve recipe analytics;
- preserve modal behaviour;
- soften card/image/button motion;
- soften modal animation;
- support reduced motion.

---

## `components/AthenaRecommendationCard.tsx`

Polish and alignment.

Expected work:

- improve title/metadata hierarchy;
- keep thumbnails;
- keep compact format;
- avoid adding chips;
- preserve canonical safety information;
- preserve exact-item navigation;
- make CTA treatment feel aligned with the source cards;
- consider a subtle arrow/icon interaction rather than scaling the whole action;
- support reduced motion.

---

## `components/ExercisePage.tsx`

Supporting work only.

Expected work:

- preserve exact-item deep-link behaviour;
- preserve stale-filter override;
- preserve focus behaviour;
- update scroll behaviour for reduced-motion users;
- implement or support brief target-arrival styling;
- avoid broad Movement-page redesign.

---

## `components/NutritionPage.tsx`

Supporting work only.

Expected work:

- preserve exact-item deep-link behaviour;
- preserve stale-filter override;
- preserve focus behaviour;
- update scroll behaviour for reduced-motion users;
- implement or support brief target-arrival styling;
- review Dynamic Mode pulse behaviour;
- avoid broad Nutrition-page redesign.

---

## `components/AthenaChatPage.tsx`

Only touch if needed for recommendation-card entrance/interaction consistency.

Possible work:

- restrained recommendation-card entrance after a streamed ATHENA response completes;
- ensure motion does not interfere with conversation live-edge behaviour;
- support reduced motion.

Do not change:

- streaming;
- orchestration;
- session state;
- AI Elements architecture;
- recommendation tool behaviour.

---

## `index.css`

Likely supporting work:

- reduced-motion CSS;
- shared low-level transition treatment if genuinely useful;
- target-arrival animation/static state if appropriate.

Do not create an elaborate animation framework.

---

# 11. Explicit non-goals

This PR must **not**:

- redesign the whole Movement page;
- redesign the whole Nutrition page;
- redesign ATHENA chat;
- change Movement recommendation logic;
- change Nutrition recommendation logic;
- change fatigue-zone mapping;
- change current energy/fatigue semantics;
- change catalogue ordering;
- rewrite canonical movement or recipe content;
- add new medical claims;
- add new AI-generated recommendation fields;
- let Gemini control card presentation data;
- create a new combined Movement/Nutrition recommendation engine;
- create a generic mega-component for every card in the app;
- add new filters;
- add more nutrition chips/pills;
- add gamification;
- add performance scoring;
- add new runtime dependencies;
- change analytics meaning;
- overhaul the global colour system.

The work should remain a contained UI-polish PR.

---

# 12. Product constraints to preserve

## Safety

Movement safety information remains visible.

Do not hide important safety content behind hover, tooltip or an interaction that a fatigued user may never discover.

Nutrition safety notes remain available in the existing relevant surfaces.

---

## Canonical ownership

Recommendation selection and card data remain Fit For Cancer owned.

ATHENA may explain a recommendation conversationally, but the rendered recommendation itself continues to resolve from canonical app data.

---

## Mobile

The card hierarchy must work at narrow mobile widths.

Avoid:

- horizontal overflow;
- tiny interactive targets;
- excessive wrapping badges;
- metadata layouts that only make sense on desktop.

The existing 44px minimum interactive target convention should be preserved.

---

## Accessibility

Preserve or improve:

- keyboard navigation;
- visible focus;
- modal focus trapping;
- Escape handling;
- focus return;
- exact-target focus after ATHENA handoff;
- semantic article/button/dialog structure;
- reduced-motion preference.

Animation must never be the only indication of state.

---

# 13. Tests and regression coverage

Existing recommendation tests already protect:

- canonical Movement metadata;
- canonical Nutrition metadata;
- exact-item navigation;
- stale/unknown recommendation refs rendering nothing;
- linked Movement targets overriding an older filter;
- linked Nutrition targets overriding older filters/search;
- target focus;
- restoration of normal filtering after user interaction.

These behaviours must continue to pass.

## Additional coverage to add where practical

- reduced-motion target scrolling uses non-smooth behaviour;
- recommendation CTA still resolves to the exact canonical item after visual changes;
- Movement safety content remains present;
- Nutrition modal retains keyboard/focus behaviour after animation changes;
- reduced-motion styling does not remove essential state indicators;
- card simplification does not remove canonical metadata required by existing tests.

Visual polish does not justify weakening regression coverage.

---

# 14. Suggested implementation order

Implement inside one PR in this order:

1. **Movement card**
2. **Nutrition card**
3. **ATHENA recommendation card**
4. **shared motion/micro-interaction adjustments**
5. **ATHENA → destination arrival treatment**
6. **reduced-motion handling**
7. **tests**
8. **mobile/accessibility review**

This order creates a useful checkpoint after the largest visual change before smaller surfaces are touched.

---

# 15. Acceptance criteria

The PR is complete when all of the following are true.

## Movement

- the card is visibly simpler;
- the title is the dominant content;
- the zone indicator is not duplicated;
- benefit information is easier to scan;
- nested mini-card clutter is reduced;
- safety remains easy to find and visible;
- citation/source remains available but secondary.

## Nutrition

- the card remains lighter than Movement;
- no new pill/chip clutter has been introduced;
- the title and recipe decision information are easier to scan;
- recipe photography remains prominent;
- the current modal/detail workflow still works;
- analytics behaviour is unchanged.

## ATHENA recommendation cards

- visually relate to the source-library cards;
- remain compact;
- do not add AI-generated canonical content;
- preserve exact-item deep links;
- have one clear next action.

## Motion

- hover/tap interactions feel deliberate rather than flashy;
- large 5px/5% movements are reduced;
- buttons no longer dramatically expand/compress;
- modal motion is quieter;
- target arrival is clear without bouncing/flashing;
- continuous motion is minimised.

## Reduced motion

- unnecessary transforms are removed;
- smooth target scrolling is avoided;
- modal scale/slide is removed;
- continuous pulse is removed or suppressed;
- static focus/state cues remain clear.

## Regression

- existing recommendation-card tests pass;
- deep links still target exact items;
- stale refs still render nothing;
- stale filter override still works;
- focus behaviour is preserved;
- mobile layouts remain within the viewport;
- no new dependencies are added.

---

# 16. Final implementation guardrail

When there is uncertainty during implementation, prefer:

**less UI, fewer competing elements, clearer hierarchy and preserved safety.**

Do not solve ambiguity by adding another pill, coloured panel, icon or explanatory block.

The research consistently points toward restraint.
