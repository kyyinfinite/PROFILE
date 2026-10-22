import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PageTransition, ScrollScenes, CursorFollower } from './components/motion/Motion';
import { Header, Footer } from './components/layout/Layout';
import { Home, Work, Detail, About, Contact, Services, NotFound } from './pages/PortfolioPages';
import { ContentProvider } from './context/ContentProvider';
import './styles.css';
import './styles/system.css';

const Admin = lazy(() => import('./pages/Admin'));

function RoutedApp() {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  return (
    <PageTransition>
      {isAdmin ? (
        <Suspense fallback={<main style={{ minHeight: '100dvh', background: '#1c1d20', color: '#f7f7f5', padding: 24 }}>Loading admin…</main>}>
          <Admin />
        </Suspense>
      ) : (
        <>
          <ScrollScenes />
          <CursorFollower />
          <div id="top">
            <a className="skip-link" href="#main">Skip to content</a>
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/work" element={<Work />} />
              <Route path="/work/:slug" element={<Detail />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </div>
        </>
      )}
    </PageTransition>
  );
}
/**
 * Shell shared by every route: skip link, global header, routed page, global curved footer.
 * PageTransition sits inside the router so route changes and the curtain stay in sync.
 */
function App() {
  return <ContentProvider><BrowserRouter><RoutedApp /></BrowserRouter></ContentProvider>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
