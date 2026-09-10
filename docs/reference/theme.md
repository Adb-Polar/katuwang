# Theme tokens — see `src/app/globals.css`

> **Retired 2026-09-10.** This file previously duplicated the DaisyUI theme and
> had drifted to an earlier palette (bright emerald / black / vivid violet). The
> shipped theme is muted deep teal, ube violet, and marigold gold.

The single source of truth for the palette, radii, and sizes is the
`@plugin "daisyui/theme"` block at the top of **`src/app/globals.css`**. The
`--kt-*` derived tokens (surface tints, badge text colours, `--kt-muted` /
`--kt-faint`, card shadow, radius aliases) are defined immediately below it in
the same file.

See also `docs/reference/decisions.md` → "Live palette supersedes
`docs/reference/theme.md`".
