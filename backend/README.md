# seed_assets/

Drop client logo files here, then run `npm run seed` (from `backend/`) to store
them in MongoDB (GridFS). The seed is idempotent — re-run it any time you add or
replace a logo.

## Files expected (by `scripts/seed.js`)

| Client   | Filename (any of these extensions) | Status         |
| -------- | ---------------------------------- | -------------- |
| Ather    | `ather.svg`                        | ✅ included     |
| Solis    | `solis.svg` / `.png` / `.webp`     | ⬜ add this     |
| FirstCry | `firstcry.svg` / `.png` / `.webp`  | ⬜ add this     |
| Toppr    | `toppr.svg` / `.png` / `.webp`     | ⬜ add this     |
| TVS      | `tvs.svg` / `.png` / `.webp`       | ⬜ add this     |

The seed script auto-detects the extension, so `solis.png` works just as well as
`solis.svg` — no code change needed.

## Tips for best quality / performance
- **Prefer SVG** (vector, tiny, sharp at any size). Otherwise PNG/WebP with a
  **transparent background**.
- Trim surrounding whitespace so all logos optically align in the marquee.
- Keep each file small (logos should be a few KB–tens of KB).

To add more clients later, extend the `MANIFEST` array in `scripts/seed.js`, or
use the upload endpoint: `POST /api/clients` (multipart: `logo` file + `name`).
