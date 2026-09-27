# Portal theme accessibility audit

Reviewed 2026-09-26 with the better-colors and better-accessibility workflows. Changes are limited to the extension's native theme files, metadata, documentation, and development checks. Severity below describes the original problem; each listed issue is addressed.

## Measure the rendered pair

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | `themes/Rick and Morty Theme-color-theme.json:284`, `:353`, `:479`; `themes/Portal Light-color-theme.json:284`, `:353`, `:479` | Numbers/constants and nested JSON keys used `#7c3e1d` on black (2.56:1); invalid code, language variables, and some names used `#683a28` (2.22:1). Both miss 4.5:1. | All declared syntax foregrounds pass 4.5:1 against the tested editor, selection, search, occurrence, and diff backgrounds in both appearances. Lowest tested text pairs: dark 5.08:1, light 5.75:1. | Measuring foregrounds against their actual role backgrounds prevents essential code from disappearing. |
| HIGH | `themes/Rick and Morty Theme-color-theme.json:414`; `themes/Portal Light-color-theme.json:414` | Markdown fence punctuation used translucent black over black (1.00:1). | Fence punctuation uses the readable muted text color. On the editor background: dark 6.79:1, light 7.34:1. Embedded languages retain syntax highlighting. | Fences are structural content and need readable foregrounds. |
| MEDIUM | `themes/Rick and Morty Theme-color-theme.json:7`, `:79`, `:110`; `themes/Portal Light-color-theme.json:7`, `:79`, `:110` | Bright button, status, and badge backgrounds were supplied without coordinated foregrounds; most workbench states inherited unrelated defaults. | Explicit pairs cover the main editor, sidebar, tabs, status, buttons, inputs, lists, suggestions, notifications, menus, and terminal. Alpha overlays are composited for contrast checks. | A background and its text must be designed and measured together. |

## Visible focus and redundant cues

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `themes/Rick and Morty Theme-color-theme.json:89`; `themes/Portal Light-color-theme.json:89` | No coordinated focus, search-match, or selected-list outline colors. | Explicit focus and match borders pass 3:1 on the tested adjacent surfaces. Native squiggles, icons, underlined links, and active-tab borders remain available. | Keyboard location and diagnostic meaning should not depend on hue alone. VS Code controls the indicator geometry. |

## Roles and theme parity

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `package.json:24`; both theme files at `:5`, `:479` | One dark appearance, no semantic token palette, and overlapping language-specific rules including per-depth JSON colors. | Two separately tuned palettes share 190 workbench roles, 25 TextMate rules, and semantic token selectors. The dark theme retains the original settings ID. | Consistent semantic roles make language-service highlighting and appearance switching predictable. |
| LOW | `README.md:1`; `.vscodeignore:5`; `scripts/check-themes.cjs:1` | Stale installation instructions and previews; no contrast regression check; old VSIX archives could be packaged again. | Current previews, installation/customization guidance, a dependency-free check run by CI and prepublish, and package exclusions. | Users can understand the theme before installing and maintainers can detect contrast regressions before release. |

## Verification

- **Passed:** strict JSON parsing, contribution paths/labels/types, retention of the original theme ID, light/dark role and scope parity, semantic highlighting enabled, all declared colors valid sRGB hex, and no extension activation entry points.
- **Passed:** 883 contrast checks per theme (1,766 total). Normal text threshold 4.5:1; tested essential UI indicators 3:1. The tests use unrounded ratios for pass/fail. Lowest tested UI pairs: dark 3.71:1, light 3.90:1.
- **Passed:** transparent overlays preserve underlying decorations. Diff word highlights are also measured composited over diff line highlights.
- **Passed:** all 190 workbench identifiers checked against the current official VS Code color reference.
- **Visually checked in VS Code 1.138.0 on macOS:** both palettes on TypeScript; native keyboard Find and Quick Open in light; Quick Open in dark; dark Markdown source including fences, nested JSON, Python, and HTML. Accessibility-tree inspection exposed editor contents, control names, selection state, and a Find result announcement. This does not establish spoken screen-reader behavior.
- **Preview environment:** the original dark preview used isolated user data. The normal profile had global color overrides; the temporary light/dark review workspace overrode those keys with the exact theme values. Personal user settings were not edited. Screenshots may show the profile's font, icons, or layout preferences.
- **Not verified:** VoiceOver/NVDA spoken output, every keyboard flow, forced-colors behavior, focus-ring area/thickness, color-vision simulations, every third-party grammar/semantic provider, rendered terminal and diff combinations, every overlay stacking order, Windows/Linux rendering, or VS Code 1.45 compatibility. Newer unrecognized color IDs fall back to the editor's defaults on older versions; prefer a current VS Code release.
- **Scope limit:** terminal ANSI foregrounds are measured on the default terminal background. Applications may choose arbitrary foreground/background combinations. This is a color audit, not full WCAG certification of VS Code or extensions.

References: [VS Code color tokens](https://code.visualstudio.com/api/references/theme-color), [semantic highlighting](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide), [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), and [WCAG non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

**Approve** for the inspected theme declarations and the visual checks listed above. No HIGH finding remains in that scope; the items marked Not verified are outside this approval.
