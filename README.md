# bcba-prep

Bookshelf navigation for BCBA exam study content. Nine domains render as
horizontal book spines; clicking one animates it open into that domain's page.

Next.js App Router · Motion · CSS 3D transforms only (no WebGL, no Three.js,
no 3D assets, no image sequences).

## Status

Navigation shell only. No study content is built, and no BCBA subject matter
is written anywhere in this repo.

## Placeholders to fill in

Every unresolved value is a `[[TODO_...]]` token. Find them all with:

```sh
grep -rn '\[\[TODO_' --include='*.ts' --include='*.tsx' .
```

Domain names and slugs must come from the current BACB Test Content Outline
and be supplied by the project owner — they are deliberately not guessed.

## The 3D geometry

The rotation signs in `app/globals.css` are load-bearing and the failure mode
is invisible in code (mirrored spine text, or the cover rendering in front of
the spine). The derivation is written out in the comment at the top of that
file. Two things that will bite anyone editing it:

- A `filter` on `.book` flattens its 3D rendering context and collapses the
  spine to an invisible edge. Brightness shifts go on a leaf face.
- `overflow: hidden` is safe on `.face--cover` (a leaf) and unsafe on any
  ancestor that needs `preserve-3d`.

## Route transition

`components/PageTransition.tsx` uses `AnimatePresence mode="popLayout"`, not
`mode="wait"`; the reason is documented in that file.
