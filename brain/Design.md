# Hacker's Unity — Design System & UI/UX Specifications

> **Document Version:** 2.6.0  
> **Brand Authority:** Official Hacker's Unity Brand Guidelines  
> **Design Philosophy:** Premium High-Energy Developer Aesthetics (Glassmorphism, High Modernity, Deep Dark & Crisp Light Modes)  
> **Target Framework:** TailwindCSS v4 with `@theme inline`  
> **Last Updated:** October 2026  

---

## 1. Brand Identity & Design Principles

The design of **Hacker's Unity** balances developer speed and functional density with a vibrant, high-energy competitive aesthetic. It avoids generic flat colors or cookie-cutter templates, utilizing:
- Dual-mode clarity: Flawless transition between clean daylight canvas and deep midnight dark mode (`#0c1017`).
- Tactile glassmorphism: Layered backdrop blurs (`backdrop-blur-md`), translucent border strokes, and subtle ambient glows.
- Micro-interactions: Spring transitions, hover lift (`hover:-translate-y-0.5`), and animated gradient borders.

### 1.1. Core Brand Rules (From Brand Guidelines)
1. **Vertical Lockup Standard:** The Hacker's Unity mark and wordmark appear together as a vertical lockup with consistent spacing.
2. **Strict Clearspace:** A minimum clearspace of **5–6px** (at small scale) is maintained around all edges of the logo mark. No typography, icons, or borders may intrude into this zone.
3. **Approved Variants:**
   - **Black Mark:** Exclusively on light backgrounds (`#FFFFFF`, `#F8FAFC`, `#EEE5D4`).
   - **White/Cream Mark:** Exclusively on dark surfaces (`#000000`, `#0F172A`, `#0c1017`).
4. **No Modification:** The mark is never stretched, distorted, rotated, bordered, or rendered in unauthorized colors. Scale proportionally only.

---

## 2. Color Palette System

Hacker's Unity utilizes a strictly calibrated 5-tone brand palette supported by slate neutral shades for interface depth:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CORE BRAND COLOR PALETTE                          │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────────┤
│    Black    │  Sky Blue   │Signal Orange│    Cream    │     White      │
│   #000000   │   #00A6DA   │   #FF8500   │   #EEE5D4   │    #FFFFFF     │
│ RGB 0,0,0   │RGB 0,168,218│RGB 255,133,0│RGB238,229,212│ RGB 255,255,255│
└─────────────┴─────────────┴─────────────┴─────────────┴────────────────┤
│ Dark Base   │Primary Blue │Urgency CTA  │Paper Muted  │  Light Canvas  │
│   #0c1017   │   #0099e6   │   #f97316   │   #f5f0e8   │    #f8fafc     │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────────┘
```

### 2.1. Primary Brand Tokens
- **Brand Black / Dark Canvas (`#000000` / `#0c1017` / `#0f172a`):** Core identity color. Used for primary dark surfaces, modals, and navigation contrast.
- **Sky Blue (`#00A6DA` / `#0099e6`):** Dedicated to the "Hacker's" wordmark, primary interactive buttons, tech tags, and focused states. Hover: `#0284c7`.
- **Signal Orange (`#FF8500` / `#f97316`):** Dedicated to the "Unity" wordmark, prize pools, live status pings, urgency pills, and primary CTAs. Hover: `#ea580c`.
- **Cream (`#EEE5D4` / `#f5f0e8`):** Organic neutral tone used for paper-like card elevations and high-contrast editorial backings.
- **Pure White (`#FFFFFF`):** Base canvas in light mode and pristine card surface.

### 2.2. Interface Neutral Gradients & Accents
- **Light Background:** `#f8fafc` (Soft off-white with radial ambient mesh).
- **Dark Background:** `#0c1017` (Deep midnight black).
- **Border Subtlety:** `#e2e8f0` (Light borders) and `rgba(255, 255, 255, 0.08)` (Dark borders).
- **Muted Text:** `#64748b` (Slate-500) and `#94a3b8` (Slate-400 in dark mode).
- **High-Contrast Text:** `#0f172a` (Slate-900 in light) and `#ffffff` (White in dark).

### 2.3. Brand Gradients
```css
/* Wordmark & Highlight Gradient */
.text-gradient-brand {
  background: linear-gradient(135deg, #0099e6 0%, #0284c7 50%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Blue Accent Gradient */
.text-gradient-blue {
  background: linear-gradient(135deg, #0099e6 0%, #0369a1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Orange Accent Gradient */
.text-gradient-orange {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 3. Typography Hierarchy

The platform uses modern, geometric sans-serif typography paired with monospaced accents for developer data.

- **Primary Sans:** `Geist Sans` (via `next/font`), falling back to `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Developer Mono:** `Geist Mono`, falling back to `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`.

### Typography Scale
| Element | Font | Size | Weight | Tracking / Leading |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | Sans | `3.75rem` - `4.5rem` (60-72px) | Black (900) | `tracking-tight leading-[1.08]` |
| **Page Title (H1)** | Sans | `2.25rem` - `3rem` (36-48px) | Black (900) | `tracking-tight leading-tight` |
| **Section Header (H2)** | Sans | `1.5rem` - `1.875rem` (24-30px) | Bold (700) | `tracking-tight` |
| **Card Title (H3)** | Sans | `1.125rem` - `1.25rem` (18-20px) | Bold (700) | `leading-snug` |
| **Body Primary** | Sans | `0.9375rem` - `1rem` (15-16px) | Normal (400) / Medium (500) | `leading-relaxed` |
| **Small / Meta** | Sans | `0.75rem` - `0.8125rem` (12-13px) | Medium (500) / Semibold (600) | `leading-normal` |
| **Pill / Label / Tag** | Mono / Sans | `0.6875rem` - `0.75rem` (11-12px) | Bold (700) / Black (900) | `uppercase tracking-wider` |
| **Data / Numbers** | Mono | `0.875rem` - `1.5rem` (14-24px) | Bold (700) / Black (900) | `font-mono tracking-tight` |

---

## 4. UI Surface Patterns & Component Specs

### 4.1. Glassmorphic Surface Cards
```tsx
// Standard High-Elevation Card with Light & Dark support
className="rounded-2xl p-6 bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-md"
```

### 4.2. Status Badges & Pills
- **Live / Active Event:** Emerald pulse ring (`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`).
- **Registration Open:** Sky Blue badge (`bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] dark:text-[#38bdf8] border border-sky-200 dark:border-sky-800/40`).
- **Prize Pool Ticker:** Amber gradient badge with Trophy icon (`bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono font-bold`).
- **Host / Owner:** Amber crown badge (`bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 font-extrabold uppercase`).
- **Co-Host Admin:** Sky shield badge (`bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-[#0099e6] dark:text-[#38bdf8] font-extrabold uppercase`).

### 4.3. Interactive Modal Dialogs
All modals (`<ProjectSubmissionModal />`, `<CertificateModal />`, `<CropModal />`, Team Invite Modals):
- Backdrop: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4`.
- Modal Body: `w-full max-w-xl bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.1] shadow-2xl overflow-hidden`.
- Escape Key & Backdrop Click Dismissal enabled by default.

---

## 5. Responsive Design Standards

- **Mobile Viewport (375px - 640px):** Single column layouts, sticky bottom registration CTAs, horizontally scrollable category tabs, collapsed navigation hamburger.
- **Tablet (640px - 1024px):** 2-column event grid, side-by-side forms, expanded modal dimensions.
- **Desktop (1024px+):** 3-column event grid, persistent sidebar filters, split-screen live preview in the Host wizard.
