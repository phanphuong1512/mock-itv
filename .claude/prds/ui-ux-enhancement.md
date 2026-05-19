---
name: ui-ux-enhancement
description: Exquisite UI/UX refactoring for MockITV using Tailwind CSS v4, focusing on screen-efficiency, high-end aesthetics, premium developer icons, and fixing potential front/back defects.
status: backlog
created: 2026-05-18T03:55:00Z
---

# PRD: ui-ux-enhancement

## Executive Summary
MockITV is an advanced AI-powered mock interview platform designed to address the severe discrepancy between extremely rigorous IT interview standards and actual daily on-job requirements. To elevate the platform to a world-class standard, this PRD specifies an exquisite, high-aesthetic UI/UX refactoring. It strictly adheres to a "One-Screen" viewport efficiency rule (maximizing data density per screen height) and uses Tailwind CSS v4 to establish a premium, professional startup look with high-fidelity, interactive components and icons.

## Problem Statement
1. **Market Reality Disconnection**: The IT market's interview bar is exceptionally high and stressful. The concept of "jobs" is misleading; the core problem is intense interview preparation. The UI must pivot to emphasize "Interview Prep Pathways" (Vòng phỏng vấn thực chiến).
2. **Visual & Interaction Gaps**: The current frontend contains empty structural placeholders, standard scrolling lists, and generic UI blocks that lack a premium startup feel.
3. **Screen Efficiency**: Current sections require extensive vertical scrolling. Modern SaaS interfaces leverage high-density, viewport-optimized layouts ("One-Screen" per main content).
4. **Bugs and Glitches**: Micro-interaction glitches, lack of smooth mobile responsiveness (like a proper navbar drawer), and potential backend integrations need meticulous quality auditing.

## User Stories
1. **As a candidate preparing for a hard tech interview**, I want a highly dense, visual dashboard of features so that I can immediately grasp the platform's power without endless scrolling.
2. **As a mobile user**, I want a fully functioning, beautiful responsive navigation drawer with clean language and theme switches so that I can navigate smoothly on any device.
3. **As a user viewing the landing page**, I want the decorative blocks in the Hero section to show actual mock interview data (like real-time evaluation scores, skill charts, or mini-code snippets) so that the product feels alive and highly interactive.
4. **As a Vietnamese developer**, I want to see professional, premium developer-oriented icons and clean bilingual terminology that reflects the elite nature of the prep.

## Functional Requirements
### 1. Refined Premium Navigation (Navbar)
* **Design**: Full glassmorphism (`bg-background/70 backdrop-blur-md border-b border-foreground/5`).
* **Animations**: Sliding active indicators for navigation links using Framer Motion.
* **Mobile Drawer**: Add a fully animated mobile hamburger menu/drawer to host links, theme selector, and language selector.
* **Language Switcher**: Refactored into a sleek, premium pill component.

### 2. High-Density Hero Dashboard (Hero Section)
* **One-Screen Constraint**: Optimize heights and padding so the entire Hero section fits perfectly within `100vh` on standard laptops.
* **Interactive Floating Cards**: Replace the current empty placeholders with high-fidelity interactive elements:
  * **Card A (Skills Analysis)**: A micro radial progress chart displaying "System Design: 88%", "Behavioral: 92%".
  * **Card B (Mock Session)**: An animated chat bubble representing a real-time question from an AI interviewer and the candidate's optimal structured answer.
* **Main Visual**: An elegant, premium vector illustration with custom gradient overlays matching the dark slate/blue styling.

### 3. Practical Interview Pathways (Formerly Jobs)
* **Rebranding**: Refocus the "Jobs" section terminology to "Practical Interview Tracks" (Vòng phỏng vấn thực chiến) or "Company-Specific Pathways" (mocking actual Vietnam top-tier technical rounds).
* **Compact Grids**: Refactor the long list to a dense, card-based comparison matching the one-screen viewport limit.

### 4. Compact Features Dashboard
* **Layout**: Transform vertical feature cards into a cohesive, high-density Bento Grid style that displays all key features on a single screen without scrolling.
* **Styling**: Hover effects using premium Tailwind CSS v4 gradient borders (`hover:border-blue-500/30`), neon glows, and micro-scale up effects.
* **Icons**: Replace standard icons with ultra-sharp, professional Lucide React compositions customized with gradient fills and drop shadows.

### 5. Interactive Horizontal Journey Timeline
* **UX Refactoring**: Convert the vertical, scrolling timeline into a sleek, horizontal stepper or an interactive, single-screen tabbed interface.
* **State Highlight**: Visual animations indicating the candidate's progression from "CV Screening" to "AI Mock Battle" to "Detailed Rubric Score" to "Offer Received".

## Non-Functional Requirements
1. **Tailwind CSS v4 Compliance**: Implement styling exclusively using native Tailwind CSS v4 utilities. Avoid legacy arbitrary hacks or inline-styles.
2. **60fps Fluidity**: Ensure all animations, transitions, and hover-states operate at a fluid 60fps using Framer Motion.
3. **Bilingual Completeness**: Complete integration with the existing `LanguageProvider` for English and Vietnamese.
4. **Zero Layout Shifts**: Optimize layouts to prevent Cumulative Layout Shift (CLS) on dynamic mounting (especially client-side states like the theme toggles).

## Success Criteria
* The landing page and core pages contain **zero** overlapping text, broken boundaries, or raw unstyled elements.
* Main visual sections (Hero, Features, Timeline) fit completely within a single viewport screen height respectively.
* Desktop and mobile performance scores (Lighthouse) remain above 90.
* No raw emojis are used as mock graphics; all icons and badges look premium.

## Constraints & Assumptions
* **Technology**: Next.js (App Router), Tailwind CSS v4, Lucide React, Framer Motion.
* **Integrations**: Existing backend services remain unmodified unless a defect is actively discovered.

## Out of Scope
* Modifying the core AI LLM prompt generation engine.
* Building a full database schema migration.

## Dependencies
* Next-themes for SSR-safe dark/light mode switches.
* Framer Motion for premium hardware-accelerated animations.
