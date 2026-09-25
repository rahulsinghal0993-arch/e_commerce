// `next build`/`next dev` handle CSS imports through their own bundler and
// don't need this, but a bare `tsc --noEmit` (our CI-independent type-check)
// has no CSS-aware resolver and errors on side-effect CSS imports without it.
declare module '*.css';
