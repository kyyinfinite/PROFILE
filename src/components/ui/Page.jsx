/** Shared <main> wrapper: skip-link target and a consistent page-shell class. */
export function Page({ className = '', shell = true, children }) {
  return (
    <main id="main" tabIndex={-1} className={`${shell ? 'page-shell ' : ''}${className}`.trim()}>
      {children}
    </main>
  );
}
