# ☕ Tip Steward – Starbucks Partner Tip Distribution

Tip Steward reimagines the classic weekly tip count as a calm, mobile-first Starbucks
partner experience. Upload a photo of the labor report, review partner hours, and
count out equitable payouts with a UI inspired by the Starbucks mobile app.

---

## 1. Executive Summary
- **Current pain:** Ad-hoc spreadsheets and hurried back-room math introduce
discrepancies and erode trust among partners.
- **Design vision:** A warm, minimalist dashboard that mirrors the Starbucks app,
centering partners with clear payouts, soft transitions, and brand-right colors.
- **Outcome:** Consistent weekly rituals—drop in the report, confirm the pool, and
celebrate equitable distributions before the close shift huddle.

---

## 2. Code Architecture Refresh
- **Modern stack:** React 19 + TypeScript + Vite with a clean `/src` layout.
- **State management:** Context providers wrap the app for tip data, and React Query
handles server interaction.
- **Utilities:** Shared helpers live in `src/utils`, while UI components are organized
under `src/components` for easy discovery.
- **Tooling:** ESLint (flat config) + Prettier + Tailwind CSS keep the codebase
consistent and Starbucks-clean.

> **Project structure**
>
> ```text
> src/
> ├─ assets/
> │  └─ styles/
> ├─ components/
> │  ├─ layout/
> │  ├─ providers/
> │  └─ ui/
> ├─ context/
> ├─ pages/
> ├─ utils/
> └─ main.tsx
> ```

---

## 3. Starbucks UI / UX Highlights
- **Mobile-first shell:** Sticky header with theme toggle and a floating navigation
pill inspired by the Starbucks app tab bar.
- **Partner dashboard:** Hero metrics track synced partners, total hours, hourly rate,
and the current tip pool.
- **Guided ritual:** Upload flow, tip entry, best practices, and distribution summary
sit together for a predictable weekly cadence.
- **Partner detail cards:** Each payout card explains the math, highlights the rounded
value, and outlines the exact bill breakdown.
- **Light + dark palettes:** Toggle between partner-light and partner-dark modes that
respect Starbucks’ forest greens and warm neutrals.

---

## 4. Starbucks Design System Tokens

| Token | Light | Dark |
| --- | --- | --- |
| **Primary / Forest** | `#036635` | `#2a5a4c` |
| **Pine** | `#1e3932` | `#10231e` |
| **Accent Sky** | `#d4e9e2` | `#4d8576` |
| **Latte Neutral** | `#f3ebe1` | `#c9b59c` |
| **Cream Surface** | `#f9f6f1` | `#ece6dd` |
| **Text Default** | `#0e0e0e` | `#f5f5f5` |

- **Typography:** Inter (SoDo Sans–inspired) with generous letter spacing for labels
and tight tracking for numbers.
- **Spacing:** 8px baseline grid, 20px rounded cards (`--radius: 0.75rem`).
- **Buttons:** Rounded pills with gradient fills and soft drop shadows (`--shadow-soft`).
- **Icons:** Lucide icons sized 20–24px with clear contrast and accessible labels.

---

## 5. Getting Started

```bash
# Install dependencies
npm install

# Start the full stack (client + server)
npm run dev

# Type-check and lint
npm run check
npm run lint

# Format code
npm run format

# Production build
npm run build
```

The Vite dev server proxies API calls to the Express back end. Production builds
output static assets to `dist/public` and a bundled server to `dist/`.

---

## 6. Netlify Deployment Guide
1. **Connect the repository** at [Netlify](https://app.netlify.com) and choose this
branch.
2. **Build settings**
   - Build command: `npm run build`
   - Publish directory: `dist/public`
3. **Environment variables** (Site settings → Environment variables)
   - `SESSION_SECRET`
   - `OCR_ENGINE` (e.g., `auto`, `azure`, or `tesseract`)
   - Azure keys if using Document Intelligence: `AZURE_DI_KEY`, `AZURE_DI_ENDPOINT`
4. **SPA routing & caching** are handled in `netlify.toml` (includes `/index.html`
redirect and long-term asset caching).
5. **Local smoke test**
   ```bash
   npm install -g netlify-cli
   netlify login
   npm run build
   netlify deploy --dir=dist/public --functions=netlify/functions
   ```
6. Enable **Deploy Previews** for stakeholder sign-off on each pull request.

---

## 7. Feature Suggestions & Roadmap
- Partner login with Netlify Identity for store-specific access.
- Offline-ready mode via service workers and IndexedDB caching.
- Exportable PDF recap for manager signatures or labor logs.
- Lightweight charts to trend hourly rates across weeks.

---

## 8. Testing & Quality
- `npm run lint` – ESLint with React, accessibility, Tailwind, and import ordering
rules.
- `npm run check` – TypeScript project-wide type safety.
- Future CI recommendation: Netlify build + lint workflow on every PR to guard the
brand experience.

---

## 9. Contributing
See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the partner-ready workflow, coding
standards, and commit etiquette that keep this project aligned with Starbucks’ design
language.

---

### 🌱 Partner-first principle
Every pixel, string, and doc is written for Starbucks partners—calm, clear, and ready
for the next weekly tip ritual.
