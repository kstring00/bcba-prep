# BCBA Prep — design direction

The brief for the premium pass. One page, so the reasoning survives the
people who wrote it.

## The one goal

Pre-launch, nothing is for sale. The single conversion is **joining the
founding list**, and every page exists to remove a doubt that stands between
a visitor and that button:

| Doubt | Answered by |
|---|---|
| "Is she qualified?" | About — credentials as a stat row, her story beside her photo |
| "Does this work for people like me?" | Testimonials — real notes, pass dates, nothing invented |
| "Will this be overwhelming?" | The design itself: calm, spacious, unhurried |
| "Can I afford it?" | Founding-member pricing, locked in — said plainly, never numbered |

Design decisions are judged against that table. A flourish that does not help
answer a doubt is clutter, however pretty.

## Palette

Four colours, one hero.

| Token | Hex | Role |
|---|---|---|
| `--cream` | `#f8f3ec` | The ground. Every page sits on it |
| `--night` | `#131110` | Feature bands and the footer. Contrast, not darkness for its own sake |
| `--gold` | `#c6a667` | **The hero accent.** Buttons, hex outlines, hover states, the honey |
| `--mauve-deep` | `#6a5473` | Plum. Secondary action, links, the quiet second voice |

Gold has a hard rule attached. `#c6a667` on cream is **2.1:1** — it is a fill
and a line colour, never a text colour below 24px. Text that must be gold is
`--gold-text: #7d6232` (5.2:1 on cream). Gold buttons carry **ink** text
(7.8:1), never white (2.3:1). Every gold-on-cream pairing in this pass was
measured, not eyeballed.

Honey — a `#e3c57a → #c6a667` gradient — appears only inside the motif.
Nowhere else.

## Type

Two faces, one of them loud.

- **Cormorant Garamond** (display). Already in the project. Big and light:
  56–88px on desktop at weight 400, tight leading (1.02–1.1). It is the
  voice of the site — warm, literate, a little old-fashioned on purpose.
- **System sans** (body). 16px minimum on phones, 17px on desktop, 1.65
  leading. It gets out of the way.
- **Parisienne** (script). Her handwriting. **At most once per page**, as an
  eyebrow or a sign-off. Twice and it stops being a signature.

Small caps (11–12px, 0.14em tracking, uppercase) carry labels, eyebrows and
attributions. They are always `--gold-text` or `--ink-dim`, never gold.

## The signature motif: honeycomb

Regular hexagons, flat-top, hairline gold. It is the bee without drawing a
bee, and it is structural rather than cute — a honeycomb is a grid.

Four uses, in decreasing size:

1. **Hex frame** — the portrait on About, the founder teaser on home. One
   large hexagon clipping a photo, with a gold hairline hex offset behind it.
2. **Tessellation** — a background field of hairline hexes at 4–6% opacity,
   on feature bands and behind the testimonials. Texture, not pattern.
3. **Cluster** — three to five hexes in a loose group at a section corner,
   one filled with honey. The "signature in the margin."
4. **Dividers** — a single hex between stats in the credential row, between
   name and pass date on a testimonial.

**Not puzzle pieces, ever.** Puzzle imagery is contested in the autism
community that this field serves, and the site should not carry it.

## Motion

Quiet, fast, honest about what it is.

- **Scroll reveal** — 16px rise + fade, 480ms, ease-out, 60ms stagger
  within a group. Once; never on scroll-back.
- **Gold hover** — underlines draw in from the left (180ms); cards lift 2px
  and their border warms to gold; buttons deepen to `--gold-deep`.
- **Honeycomb fill** — a cluster's honey cell fills as its section enters.
- **Parallax** — decorative layers only, ≤12px of travel. Content never
  parallaxes.
- **Reduced motion** — all of the above collapse to instant state changes.
  Nothing becomes unreachable, nothing stays hidden.

The ease everywhere is `cubic-bezier(0.22, 0.61, 0.36, 1)` — already the
project's `--ease`. Nothing springs, nothing bounces.

## Layout

The last passes were phone-first and stayed phone-shaped on desktop: a 640px
column with half the screen empty either side. That is fixed at the system
level, not page by page.

- **Container** 1280px. **12 columns**, 24px gutters on desktop, 20px side
  padding on phones. Pages compose inside it; feature bands bleed past it.
- **Phones stay stacked.** Mobile is the base and it is not a narrowed
  desktop. Desktop is not a stretched phone. They are composed separately
  from the same sections.
- **No page is a single narrow column on desktop.** Legal pages included —
  they get a sticky section rail beside the text.

### Section templates

Every page is assembled from these four. A page that needs a fifth is a
page that needs rethinking.

| Template | Desktop | Use |
|---|---|---|
| **Split** | 6/6 or 5/7, vertically centred | Text beside a visual, form beside a pitch |
| **Editorial** | 7/5, image offset upward, large type | A story beside a portrait |
| **Card grid** | 2–4 across, equal height | Tools, steps, testimonials, domains |
| **Feature band** | Full-bleed night or gold | A mission statement, a single number, a CTA |

The Contact page is the density reference. Match it.

### The sticky founding-list CTA

Not a nav tab. It is a slim pill, bottom-right on desktop, a bottom bar on
phones (safe-area aware). It appears after a short scroll, dismisses for the
session, hides whenever a form field has focus so it never covers what
someone is typing into, and does not exist on `/start` — the page it links to.

## What this pass does not do

- Change copy, except the credential row on About and the new Toolkit.
- Touch the founding-list flow, testimonial submission, or any of the
  security work.
- Invent a university, a figure, or a testimonial. Placeholders are marked
  as placeholders.
