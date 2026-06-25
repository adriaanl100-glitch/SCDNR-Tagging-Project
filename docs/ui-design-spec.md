# UI Design Specification

## Design Principles

- Mobile-first, one-handed boat operation
- Touch targets ≥ 48px (min-h-12)
- High-contrast outdoor palette (WCAG AA on white backgrounds)
- Large typography for glare conditions

## Color Palette (Tailwind)

| Token | Class | Use |
|-------|-------|-----|
| Primary | `bg-teal-700` / `hover:bg-teal-800` | GPS, Save, Sync |
| Secondary | `bg-slate-600` | Backup ZIP |
| Danger | `bg-red-600` | Clear logs (hidden) |
| Warning | `bg-amber-500` | Offline banner, DO NOT TAG |
| Success | `bg-green-600` | Save confirmation |
| Surface | `bg-slate-50` | Page background |
| Card | `bg-white shadow-md rounded-xl` | Form sections |

## Typography

- Headings: `text-xl font-bold text-slate-900`
- Labels: `text-sm font-semibold text-slate-700`
- Inputs: `text-base` (16px minimum — prevents iOS zoom)
- Counter badge: `text-lg font-bold`

## Screens

### 1. Catch Form (default tab)

- Header: app title + unsent badge (`3 Awaiting Sync`)
- Offline banner (conditional): amber strip
- GPS button: full-width, `min-h-14`, teal, icon + "Capture Current GPS Location"
- Map: 240px height, rounded, border
- Layer toggle + grid hint below map
- Form fields in stacked cards
- Species dropdown with DO NOT TAG warning (red text when Spotted Seatrout)
- Tag type radios with disabled states per species rules
- Photo capture: dashed border drop zone, camera input
- Save Catch: full-width green button

### 2. Sync Dashboard (tab)

- Large unsent count
- Progress bar (hidden until sync starts)
- Submit Sync to DNR (primary)
- Download Backup ZIP (secondary)
- Clear Local Logs (danger, double-confirm)

### 3. My Logbook (tab)

- Grid of saved catches (photo thumbnail, species, date, sync badge)
- Tap to view detail read-only

## Component Patterns

```html
<!-- Primary button -->
<button class="w-full min-h-14 rounded-xl bg-teal-700 text-white text-lg font-semibold active:bg-teal-800">

<!-- Form input -->
<input class="w-full min-h-12 px-4 rounded-lg border border-slate-300 text-base focus:ring-2 focus:ring-teal-500">

<!-- Radio group -->
<label class="flex items-center gap-3 min-h-12 px-4 rounded-lg border cursor-pointer has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
```

## Error & Empty States

| State | UI |
|-------|-----|
| Offline | Amber banner: "Offline — catches saved locally" |
| GPS denied | Red inline: "Location permission required" |
| Map tiles fail | Gray map area + GPS still works |
| Sync failed | Red toast: "Ingest Failed — Try Again" |
| Validation error | Red border + message under field |
| Empty logbook | Gray illustration text: "No catches logged yet" |

## Modals

- **Double-confirm clear:** Step 1 "Are you sure?" → Step 2 "This cannot be undone"
- **Sync success:** Green check + "All catches synced"
- **ZIP ready:** "Download complete. Clear local queue?" (optional confirm)

## Workflow Wireframe

```
Launch → [Catch Form]
  → GPS capture OR map tap
  → Fill dropdowns/radios
  → Photo
  → Save Catch → form reset, counter++

Dock → [Sync tab]
  → Submit Sync OR Download ZIP
```
