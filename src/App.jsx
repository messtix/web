import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import PortfolioItem from './pages/PortfolioItem';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import Archivos from './pages/Archivos';

const Admin = lazy(() => import('./pages/Admin'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sobre-mi" element={<About />} />
        <Route path="/servicios" element={<Services />} />
        <Route path="/portafolio" element={<Portfolio />} />
        <Route path="/portafolio/:slug" element={<PortfolioItem />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/contacto" element={<Contact />} />
        <Route path="/archivos" element={<Archivos />} />
        <Route
          path="/accessgranted"
          element={
            <Suspense fallback={<div className="container" style={{ paddingTop: 80 }}>Cargando…</div>}>
              <Admin />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
