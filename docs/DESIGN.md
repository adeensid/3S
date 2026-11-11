# Design system — Excellence

## Principles

- Calm, dense, precise interfaces with sentence-case copy.
- 4px spacing grid, 1px borders, 4px radius (6px dialogs only).
- Accent colour reserved for primary actions, focus rings, and selected states.

## Tokens

See `client/src/styles/tokens.css` for colour, type, motion, and layout variables. Light and dark themes share the same semantic names.

## Typography

- UI: IBM Plex Sans (400/500/600)
- Metadata: IBM Plex Mono for ticket keys, counts, timestamps
- Scale: 12, 13, 14 (base), 16, 20, 28 px

## Components

| Component | Usage |
| --- | --- |
| Button | Primary, secondary, ghost variants |
| Input | Labelled fields with inline errors |
| StatusBadge | Ticket status text colours |
| Toast | Deterministic error + rollback messaging |
| Skeleton | Loading placeholders |

## Do

- Pair icons with text labels or tooltips.
- Show empty, loading, and error states on every screen.
- Keep row height at 36px (32px compact).

## Do not

- Purple gradients, glassmorphism, glow, or mesh backgrounds.
- Marketing adjectives ("seamless", "unlock", "supercharge").
- Emoji icons or sparkle metaphors.
- ALL CAPS labels except 11px section headings with `0.04em` tracking.
