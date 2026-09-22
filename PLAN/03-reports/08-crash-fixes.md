# Runtime Crash Fix Report

## 1. Root Cause Analysis
The application was experiencing a total runtime crash resulting in a blank blue screen. 

### Primary Error:
`Uncaught TypeError: Cannot destructure property 'Symbol(Symbol.iterator)' of 'useRegisterSW(...)' as it is undefined.`

### Origin:
`components/Common/ReloadPrompt.tsx:7`

### Explanation:
The `useRegisterSW` hook from the `virtual:pwa-register/react` module (provided by `vite-plugin-pwa`) was returning `undefined` in certain runtime environments (specifically during initialization or when Service Workers were disabled/unsupported). The code was immediately attempting to destructure this `undefined` result as an object, and further destructuring its properties (`offlineReady`, `needUpdate`) as arrays. This caused an unhandled TypeError that halted the React execution before any UI could be rendered.

## 2. Technical Fixes Applied

### A. Defensive Guard in ReloadPrompt
Added a strict null-check for the return value of `useRegisterSW`. If the hook returns `undefined`, the component now gracefully returns `null`, preventing the crash and allowing the rest of the application to render.

**File:** `components/Common/ReloadPrompt.tsx`
**Line:** ~7-15

### B. Production-Grade Error Boundary
Created and implemented a top-level `ErrorBoundary` component. This ensures that if any future component crashes, the user is presented with a professional "Failsafe" recovery screen rather than a blank page. It also provides an "Acknowledge/Reload" mechanism.

**File:** `components/Common/ErrorBoundary.tsx`
**File:** `index.tsx` (wrapped `<App />`)

### C. Build-Time Tailwind Migration
Removed the production-incompatible `cdn.tailwindcss.com` script from `index.html`. Migrated the project to use Tailwind CSS v4 with `@tailwindcss/postcss`.

**Files Modified:**
- `index.html`: Removed CDN script and inline styles.
- `package.json`: Added `tailwindcss`, `@tailwindcss/postcss`, `postcss`, and `autoprefixer`.
- `tailwind.config.js`: Initialized configuration.
- `postcss.config.js`: Configured PostCSS with the new Tailwind plugin.
- `index.css`: Added Tailwind V4 `@import` and theme definitions.
- `index.tsx`: Imported the local `index.css`.

## 3. Verification Evidence
- **Build Status:** `npm run build` now completes successfully with 0 errors.
- **Bundle Analysis:** Tailwind utility classes are now correctly bundled into `dist/assets/index-[hash].css`.
- **Runtime Safety:** The `ReloadPrompt` no longer crashes the React tree when the PWA module is inactive.
- **Failsafe:** `ErrorBoundary` verified to catch component-level failures.

## 4. Success Criteria
The application now renders correctly on both desktop and mobile. The "Blue Screen of Death" has been resolved by neutralizing the `TypeError` and adding top-level runtime protection.
