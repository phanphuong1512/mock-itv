---
name: ui-ux-enhancement
status: closed
created: 2026-05-18T03:57:00Z
progress: 100%
prd: .claude/prds/ui-ux-enhancement.md
github: (will be set on sync)
---

# Epic: ui-ux-enhancement

## Overview
This epic covers the high-fidelity UI/UX refactoring of the MockITV landing page and core layout using Tailwind CSS v4 and Framer Motion. The technical objective is to replace basic placeholders, standard lists, and inefficient vertical scroll blocks with high-density, screen-efficient, responsive elements. The rebranded platform will emphasize intense "Interview Prep Pathways" (Vòng phỏng vấn thực chiến) and offer a premium, unified startup experience across desktop and mobile.

## Architecture Decisions
1. **Viewport Optimization ("One-Screen" Rule)**: Restructure the layout grids and paddings of the primary home page sections to ensure each core section (Hero, Features, Journey, Pathways) fits cleanly within a standard `100vh` laptop viewport.
2. **Motion Standard**: Use `framer-motion` for hardware-accelerated transitions to avoid layout shifts (especially when loading client-side theme/language options).
3. **Tailwind CSS v4 Dominance**: Avoid all custom arbitrary Tailwind properties where native v4 utility classes suffice. Standardize colors, transitions, and glassmorphism.
4. **Bilingual Translation Safety**: Ensure all new copy and terms (especially around rebranding "Jobs") are properly configured in `LanguageProvider.tsx` with identical key mappings in VI and EN.

## Technical Approach

### Frontend Components
1. **Glassmorphic Navigation Bar (`Navbar.tsx`)**:
   * Add a responsive slide-in Drawer for mobile screens with backdrop-blur overlays.
   * Add a sliding highlight bubble underneath navigation links during hover.
   * Polish the language switch toggle into a sleek capsule pill.

2. **Hero Dashboard (`page.tsx` - Hero Section)**:
   * **Card A (AI Simulator Mock)**: Implement a micro terminal interface displaying typing animation of a tough System Design question and a candidate's structured bullet reply.
   * **Card B (Radar/Skills Analytics)**: Design a clean SVG-based visual showing a radar chart of candidate performance (Coding, System Design, Behavioral, Communication) with glow strokes.
   * Adjust overall hero height to fit perfectly in a standard viewport.

3. **Bento Features Grid (`page.tsx` - Features Grid)**:
   * Reorganize the current 5-card layout into a modern **Bento Grid**.
   * Add glowing border gradients (`hover:border-primary/40`) and slight 3D tilt effects on hover.
   * Incorporate sharp Lucide React icons styled with subtle shadows.

4. **Horizontal Journey Stepper (`page.tsx` - Journey Section)**:
   * Convert the vertical timeline into a beautiful, horizontal interactive stepper.
   * Add step indicators that illuminate and show rich tooltips as the user hovers or scrolls.

5. **Interview Pathways Grid (`page.tsx` - Rebranding Jobs)**:
   * Rename and reframe the mock jobs listing to "Practical Interview Pathways" targeting top tier Vietnam/Global tech standards (Algorithm, Backend/Frontend System, Leadership).

### Backend Services
* **Integration Check**: Inspect pages like `frontend/app/jobs/page.tsx` or relevant page handlers to ensure there are no integration or logic defects in communicating with the backend.

---

## Implementation Strategy
To ensure zero defects, we will execute the refactoring in structured, incremental work streams:
* **Task 1**: Refactor global theme styling, gradients, and custom utility classes in `globals.css` to build our Tailwind v4 design tokens.
* **Task 2**: Refactor `Navbar.tsx` to include glassmorphism, responsive mobile drawer, and refined language/theme switches.
* **Task 3**: Create premium interactive mock components (AI simulator card, skills SVG chart) and rebuild the Hero section with a compact viewport-height layout.
* **Task 4**: Transform the Features list into a high-density, bento-style responsive grid.
* **Task 5**: Rebuild the Journey timeline into a clean horizontal stepper.
* **Task 6**: Refactor "Jobs" page and copy to "Interview Pathways", update language translations, and check for any frontend/backend integration defects.

---

## Task Breakdown Preview
1. `001.md`: Setup core style tokens and base Tailwind CSS v4 variables in `globals.css`.
2. `002.md`: Implement premium glassmorphic navigation with fully responsive mobile drawer.
3. `003.md`: Build interactive mock dashboard cards and refactor Hero section to meet "One-Screen" rules.
4. `004.md`: Build bento features grid with high-fidelity gradients and Lucide startup icons.
5. `005.md`: Build the horizontal interactive Journey stepper.
6. `006.md`: Rebrand jobs to Interview Pathways, verify bilingual translations, and run an integration audit.

## Dependencies
* `framer-motion` (for elegant transitions)
* `lucide-react` (for premium startup icons)
* `next-themes` (for SSR-safe dark/light classes)

## Success Criteria (Technical)
* Zero Tailwind compilation warnings.
* Zero layout shifts on client components.
* Seamless responsiveness from `320px` to `1536px` viewport widths.
* Lighthouse layout shift score of 0.

## Estimated Effort
* Total: ~13 hours of parallel development/validation.

---

## Tasks Created
- [x] [001.md](file:///Users/phanphuong/Downloads/code/mock-itv/.claude/epics/ui-ux-enhancement/001.md) - Setup core style tokens and base Tailwind CSS v4 variables in globals.css (parallel: true)
- [x] [002.md](file:///Users/phanphuong/Downloads/code/mock-itv/.claude/epics/ui-ux-enhancement/002.md) - Premium glassmorphic navigation with fully responsive mobile drawer (parallel: true)
- [x] [003.md](file:///Users/phanphuong/Downloads/code/mock-itv/.claude/epics/ui-ux-enhancement/003.md) - Build interactive mock dashboard cards and refactor Hero section to meet One-Screen rules (parallel: true)
- [x] [004.md](file:///Users/phanphuong/Downloads/code/mock-itv/.claude/epics/ui-ux-enhancement/004.md) - Build bento features grid with high-fidelity gradients and Lucide startup icons (parallel: true)
- [x] [005.md](file:///Users/phanphuong/Downloads/code/mock-itv/.claude/epics/ui-ux-enhancement/005.md) - Build the horizontal interactive Journey stepper (parallel: true)
- [x] [006.md](file:///Users/phanphuong/Downloads/code/mock-itv/.claude/epics/ui-ux-enhancement/006.md) - Rebrand jobs to Interview Pathways, verify bilingual translations, and run an integration audit (parallel: false)

Total tasks: 6
Parallel tasks: 5
Sequential tasks: 1
Estimated total effort: 13 hours
