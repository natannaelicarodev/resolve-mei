# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# UI DESIGN STANDARD

Project UI rules take precedence:

- Aim for the visual rigor of Family, X, and Linear without copying them.
- Use a consistent 4 px / 8 px spacing grid.
- Align adjacent elements precisely; never ship elements that are only almost aligned.
- Give information blocks inside the same card clear visual separation.
- Maintain explicit typographic hierarchy and proportional internal spacing.
- Avoid decoration without a functional or communicative purpose.
- Preserve the active theme tokens and validate both light and dark variants.
- Audit the existing screen and behavior before changing visual structure.

For UI and animation tasks, consult references in this order after applying the
project rules above:

1. `.agents/skills/react-native-design/SKILL.md` for React Native implementation,
   navigation, Reanimated, Gesture Handler, transitions, styling, and native
   interaction behavior.
2. `.agents/skills/ui-ux-design/SKILL.md` for visual direction, hierarchy,
   typography, palette, spacing, accessibility, and pattern research. Always use
   its `react-native` stack data for this app; ignore web-only hover, cursor, DOM,
   CSS, Tailwind, and browser guidance.
3. `ui-ux-pro-mcp` for current iOS HIG, Android Material, and React Native
   platform conventions once that MCP server is configured and available.

These references advise implementation; they never authorize adding a runtime
dependency. Verify Expo SDK 57 compatibility and obtain user approval before
adding or changing any application package. Preserve existing navigation and
behavior unless the task explicitly requests a change.

# BRAND IDENTITY DECISIONS

Read `TAVI_BRAND_DECISIONS.md` before touching anything related to the Tavi
mascot or the app store icon — colors, gradients, shading, or the deliberate
gap between the icon's premium finish and the flat-color rules the rest of
the interface follows. Do not "fix" that gap without a new documented
decision.

# REACT NATIVE PERFORMANCE

For every investigation of slowness, freezing, startup time, dropped frames,
JS-thread blocking, bridge overhead, unnecessary re-renders, memory leaks, or
other React Native performance optimization, consult
`.agents/skills/react-native-best-practices/SKILL.md` first.

Keep this responsibility separate from UI work: `react-native-design` remains
the reference for visual implementation and animation behavior, while
`react-native-best-practices` owns performance diagnosis, measurement, and
optimization. Neither skill authorizes adding or changing runtime dependencies;
the Expo SDK 57 compatibility and approval rules above still apply.

# EXPERIMENTAL API IN USE — EXPO ROUTER HEADLESS TABS

The bottom navigation is built on `expo-router/ui` (`Tabs`, `TabList`,
`TabTrigger`, `TabSlot`), which Expo documents as **experimental**. This is a
deliberate trade, not an oversight.

**Why it is here.** The four main sections used to be Stack screens, so every
switch tore down and rebuilt the Home's native view tree — measured at 195
attached views, of which ~21 are `Animated.View` instances that React Native
can never flatten. Device measurement put the 90th percentile frame time at
57ms against a 16.7ms budget, with `Slow UI thread` high and the GPU idle at
8ms. Headless tabs keep the tree mounted between switches; a real tab bar was
the only way to stop the remount without redesigning the notch and the
floating "+" button.

**Why headless and not the visual `Tabs`.** The custom bar draws an SVG notch
and overlaps a floating create button. `TabTrigger` may sit outside `TabList`,
which is what keeps that layout intact.

**Before upgrading the Expo SDK**, treat this area as a breaking-change risk:

1. Read the `expo-router/ui` changelog for renamed or removed exports —
   `TabSlot`'s `detachInactiveScreens` and `renderFn` carry the screen
   preservation this optimisation depends on.
2. Re-run `scripts/measure-nav.ps1` on a **release** build and compare the
   90th percentile against the numbers above. A silent regression here looks
   like "the app feels heavy", not like a build error.
3. Verify the notch and the floating "+" still align, in both themes.

Measurement belongs to the same loop: never accept "it feels smoother" as
evidence in this area — the manual-tap readings that preceded this work varied
by 3x on identical binaries.
