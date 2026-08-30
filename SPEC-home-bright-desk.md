# Spec: Home — Bright Desk

## Objective

Rebuild the ResolveMEI Home as a tidy, sunlit business desk: calm at a glance, precise on inspection, tactile to organize, and human in language. A small-business owner must read cash, DAS obligations, accrued revenue, and issued invoices, then act, without decoding accounting UI.

This direction exists because the previous three-variant prototype (Living Stack / Orbit Ledger / Calm Timeline) was rejected as a generic "dark mode + mint AI dashboard" — and that exact palette turned out to also be what production `HomeMockupScreen.tsx` and the in-flight "Direção B" screens (Welcome, SignIn, SignUp, Onboarding, Clientes, Serviços) already use. This prototype deliberately does not follow that palette. It stays scoped to Home only; reconciling the rest of the app is a separate, later decision.

## Experience direction: Bright Desk

**Thesis:** the business owner's Home is a tidy, sunlit desk, not a trading-floor dashboard. Light-first, precise like Mercury/Arc/Linear Mobile (hairline borders, tight radius scale, restrained shadows, tabular numerals), tactile like Family (elastic Dynamic Sheets, spring-driven drag, favoriting with real physical feedback), legible like Square (real financial hierarchy, charts that answer a specific question instead of decorating the screen).

**Grounding rule:** no new competing palette. Every color, type size, radius, and spacing value comes from the app's real, existing design system (`src/theme/*`) via `useTheme()` — the same system `Input.tsx`, `Button.tsx`, and `Card.tsx` already use. Dark mode is fully supported through the same tokens (`darkColors`), but light is the flagship state for this direction, since dark was half of what got rejected.

### Structure

1. **Panorama (bird's-eye, fixed)** — one asymmetric hero surface: saldo disponível (rolling numeric ticker), DAS a pagar with due-date chip, faturamento acumulado, notas emitidas. Spatial hierarchy, not a KPI grid.
2. **Quick actions (fixed, fewest taps)** — "Lançar receita" and "Emitir nota" open a Dynamic Sheet directly from Home.
3. **Human-readable activity (organizable)** — chronological feed translating domain events into plain sentences ("Guia DAS de julho paga com sucesso", "Nota fiscal emitida para Marina Duarte").
4. **Cashflow trend (organizable)** — a small line chart answering one question (is cash trending up), drawn from real fixture data points, not a decorative fixed curve.
5. **Tactile organization** — favorite (star), drag-reorder with spring settle, archive/restore, with button alternatives to gesture for accessibility.

### Visual language

- Colors: `useTheme().colors` only (`lightColors`/`darkColors` from `src/theme/colors.ts`). No hex literals in prototype components.
- Type: Poppins via `typography` variants from `src/theme/typography.ts`; tabular numerals for all money values.
- Radius: `radii.large`/`radii.card` from `src/theme/spacing.ts`. Borders: `StyleSheet.hairlineWidth`, `colors.border`.
- Shadows: restrained, from `getThemeShadows`, never glow-heavy.

### Motion language

- Press feedback via the existing `AnimatedPressable`/`Button` spring (`theme.motion.spring`).
- Numeric values roll digit-by-digit vertically (odometer style) on change; unrelated digits/glyphs stay static. See `NumericTicker` in `PrototypePrimitives.tsx`.
- Cards lift and settle with role-specific springs (`prototypeMotion.press`/`.settle`/`.sheet`/`.ticker` in `tokens.ts`).
- Charts draw in the direction of time via an animated stroke reveal, and hold a readable final state immediately.
- Dynamic Sheets resize elastically per step (measured content height animates the sheet's height) and are interruptible.
- All decorative motion (ticker roll, panorama reveal, chart draw) renders a stable final state when reduced motion is active (`useReducedMotion()` or the dev override switch). Drag itself is a direct-manipulation response to input and stays available regardless.

## Tech stack

- Expo `~57.0.17`, React Native `0.86.3`, React `19.2.3`
- Expo Router `~57.0.17`
- React Native Reanimated `4.5.1` (already used elsewhere in the app)
- React Native SVG `15.15.4`
- `react-native-gesture-handler` is **not** installed; drag uses `PanResponder` + legacy `Animated`, consistent with the rest of the codebase.

## Commands

- Install: `pnpm install`
- Development: `pnpm dev`
- Web prototype: `pnpm exec expo start --web`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Tests: `pnpm test -- --runInBand`

## Project structure

- `src/features/home/` — production Home data and presentation (`HomeMockupScreen.tsx`), untouched by this work.
- `src/features/home/prototype/` — explicitly throwaway Bright Desk prototype: `model.ts` (fixtures/types), `organization.ts` (pure reorder/favorite/archive/restore reducer, unchanged from before), `tokens.ts` (motion constants only), `PrototypePrimitives.tsx` (Panorama, NumericTicker, QuickActionsRow, ActivityFeed, CashflowTrend, TactileModuleShell), `DynamicSheet.tsx`, `HomePrototypeScreen.tsx`.
- `app/(protected)/home-prototype.tsx` — isolated, `__DEV__`-only route. Production is unreachable from it.
- `tests/HomePrototypeOrganization.test.ts` — unit tests for the organization reducer (unchanged, still green).

## Boundaries

- Always: read colors/type/radii/spacing from `@/theme`; keep the route `__DEV__`-gated; keep fixtures in memory (no Supabase read/write); keep button alternatives for every gesture-driven action.
- Ask first: adding `react-native-gesture-handler` or any new native dependency; touching `app/(protected)/home.tsx` or any Direção-B screen; persisting prototype state.
- Never: fabricate a competing color palette; make drag the only way to reorganize; block input during animation; ship prototype fixtures in a production data path.

## Success criteria

- A user can state saldo, DAS a pagar, faturamento acumulado, and notas emitidas after a five-second glance at the panorama.
- Every activity sentence names an event, amount when applicable, person/entity, and relative time.
- Favorite, reorder, archive, and restore all work with both gesture and buttons.
- A primary action (lançar receita / emitir nota) is reachable in at most two taps from Home and opens a Dynamic Sheet that visibly resizes between steps.
- The numeric ticker rolls digit-by-digit on value change and is accessible as a single spoken value, not digit soup.
- Reduced motion (system or dev override) yields stable final states for ticker, panorama reveal, and chart draw, while organization stays fully usable.
- `pnpm typecheck`, `pnpm lint`, and `pnpm test -- --runInBand` are clean; production `/home` and other Direção-B screens are untouched.

## Open questions

- Whether Bright Desk's light-first stance extends to the rest of the app, or Home stays visually distinct until a separate decision is made.
- Final DAS/obligations data contract once this connects to real Supabase data (out of scope for this prototype).
