# Frontend Improvement Plan for CDSS Doctor Dashboard

## 1. Current State Assessment
- **Build succeeded** (`npm run build`) producing production assets.
- **Lint errors**: unused imports (`useEffect`, `i`), 23 errors, 1 warning.
- **Codebase**: React 19 with Vite, using custom `AuthProvider`, `ThemeProvider`, and many page components.
- **Routing**: `react-router-dom` v7, protected routes based on roles.
- **Styling**: CSS modules (`App.css`) and global CSS.
- **Testing**: No test suite present.
- **Accessibility**: No explicit ARIA attributes or focus management.
- **Performance**: No code‑splitting/lazy loading for heavy pages, no image optimization.
- **Documentation**: Minimal inline comments, no component documentation.

## 2. Identified Improvement Areas
| Area | Issue | Recommended Action |
|------|-------|--------------------|
| **Lint & Code Quality** | Unused imports, many ESLint errors | Run `npm run lint -- --fix`, add missing rules, enforce `no-unused-vars`.
| **Accessibility** | No ARIA, focus traps, color contrast not verified | Add `aria-labels`, ensure keyboard navigation, use `react-axe` for audits.
| **Performance** | All pages bundled together, large JS bundle (308 KB gzipped) | Implement route‑level code‑splitting with `React.lazy` & `Suspense`, enable Vite's `build.rollupOptions.output.manualChunks`.
| **Testing** | No unit/integration tests | Add Jest + React Testing Library, write tests for critical components (ProtectedRoute, Sidebar, Dashboard, API calls).
| **State Management** | Context used for Theme/Auth only | Evaluate using a lightweight state lib (e.g., Zustand) for shared UI state (selected patient, filters).
| **Error Handling** | No error boundaries | Add a global `ErrorBoundary` component to catch UI errors.
| **Styling & Design** | Plain CSS, no design system | Adopt a design token system (CSS variables) and consistent component library (e.g., Material‑UI or custom UI kit) to match the premium aesthetic described in project rules.
| **CI/CD** | No pipeline for lint/build/test | Add GitHub Actions workflow: `npm ci`, `npm run lint`, `npm test`, `npm run build`.
| **Documentation** | Lack of component docs | Use JSDoc/TypeScript type hints, generate docs with TypeDoc.
| **Security** | Amplify imported but not configured | Configure Amplify Auth with Cognito, ensure JWT validation on API calls.

## 3. Implementation Steps
1. **Fix Lint Errors**
   - Run `npm run lint -- --fix`.
   - Remove unused imports (`useEffect`, `i`).
   - Add ESLint rule `react-hooks/exhaustive-deps` and `no-unused-vars`.
2. **Introduce Code Splitting**
   - Refactor route imports in `App.jsx`:
     ```js
     const Patients = React.lazy(() => import('./pages/Patients/Patients'));
     const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'));
     // ...other pages
     ```
   - Wrap routes with `<Suspense fallback={<Spinner/>}>`.
   - Update `vite.config.js` to create manual chunks for `react`, `aws-amplify`, and `react-router-dom`.
3. **Add Accessibility Enhancements**
   - Install `react-aria` and `react-axe`.
   - Add `aria-label` to navigation buttons, ensure contrast ratios ≥ 4.5:1.
   - Implement focus management on route changes.
4. **Create Error Boundary**
   - Add `components/ErrorBoundary/ErrorBoundary.jsx`.
   - Wrap `<AppLayout>` with `<ErrorBoundary>`.
5. **Testing Infrastructure**
   - Install `jest`, `@testing-library/react`, `@testing-library/jest-dom`.
   - Add `jest.config.cjs` and basic test scripts.
   - Write tests for:
     - `ProtectedRoute` role enforcement.
     - `Sidebar` navigation links.
     - API service wrapper (`api/*.js`).
6. **State Management Upgrade**
   - Add `zustand` (lightweight) for UI state (selected patient, filters).
   - Replace ad‑hoc prop drilling with store hooks.
7. **Design System Integration**
   - Choose a UI library (e.g., Material‑UI) or create custom component library.
   - Apply consistent color palette, typography (Google Font *Inter*), and spacing tokens.
   - Update `App.css` to use CSS variables for theming.
8. **Amplify Auth Configuration**
   - Initialise Amplify with Cognito pool IDs from `aws-exports.js`.
   - Protect API calls with JWT in `api/index.js`.
9. **CI/CD Pipeline**
   - Add `.github/workflows/ci.yml` with steps: `npm ci`, `npm run lint`, `npm test`, `npm run build`.
   - Enable artifact upload of `dist/` for deployment.
10. **Documentation Generation**
    - Add JSDoc comments to all public functions.
    - Run `npx typedoc` to generate HTML docs in `docs/frontend/`.

## 4. Verification Plan
- **Automated**: CI pipeline must pass lint, tests, and build.
- **Manual**:
  1. Run `npm start` (dev server) and verify each page loads without console errors.
  2. Use Chrome Lighthouse to ensure performance > 90, accessibility > 90.
  3. Test role‑based routing by logging in as `doctor` and `admin`.
  4. Confirm lazy‑loaded bundles are split (Network tab shows separate chunks).
- **Security**: Verify that API requests include `Authorization: Bearer <JWT>` header.

## 5. Alignment with Project Conventions
- All new code uses **type hints** (via JSDoc) and follows the **Python‑first** mindset for backend; frontend follows analogous strict typing.
- **Logging**: UI errors are sent to CloudWatch via Amplify Analytics (consistent with backend logging policy).
- **IAM & Secrets**: No hard‑coded credentials; Amplify pulls secrets from Cognito.
- **Safety‑First**: UI warns users when AI confidence is low (e.g., display a banner on AI‑generated summaries).

---
*This plan is stored as `docs/frontend-improvement-plan.md` and can be reviewed before implementation.*
