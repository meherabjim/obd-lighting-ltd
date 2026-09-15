import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { LangProvider } from './i18n/index.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { CatalogueProvider } from './context/CatalogueContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

import ErrorBoundary from './components/ErrorBoundary.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import WhatsAppFab from './components/WhatsAppFab.jsx';

import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Projects from './pages/Projects.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminLayout from './admin/Layout.jsx';
import Dashboard from './admin/Dashboard.jsx';
import AdminProducts from './admin/Products.jsx';
import ProductForm from './admin/ProductForm.jsx';
import AdminCategories from './admin/Categories.jsx';
import AdminSlider from './admin/Slider.jsx';
import AdminEnquiries from './admin/Enquiries.jsx';
import AdminSettings from './admin/Settings.jsx';

/** Jump to the top when the route changes, the way a real site behaves. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** The public site: header, page, footer, floating WhatsApp button. */
function PublicShell({ children }) {
  const { pathname } = useLocation();
  // The product page renders its own button (it knows which product).
  const showFab = !pathname.startsWith('/product/');
  return (
    <>
      <Header />
      <main><ErrorBoundary>{children}</ErrorBoundary></main>
      <Footer />
      {showFab ? <WhatsAppFab /> : null}
    </>
  );
}

const page = (element) => <PublicShell>{element}</PublicShell>;

export default function App() {
  return (
    <LangProvider>
      <SettingsProvider>
        <CatalogueProvider>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/"               element={page(<Home />)} />
              <Route path="/shop"           element={page(<Shop />)} />
              <Route path="/product/:slug"  element={page(<Product />)} />
              <Route path="/projects"       element={page(<Projects />)} />
              <Route path="/about"          element={page(<About />)} />

              <Route path="/admin" element={<ErrorBoundary><AdminLayout /></ErrorBoundary>}>
                <Route index                    element={<Dashboard />} />
                <Route path="products"          element={<AdminProducts />} />
                <Route path="products/new"      element={<ProductForm />} />
                <Route path="products/:id"      element={<ProductForm />} />
                <Route path="categories"        element={<AdminCategories />} />
                <Route path="slider"            element={<AdminSlider />} />
                <Route path="enquiries"         element={<AdminEnquiries />} />
                <Route path="settings"          element={<AdminSettings />} />
              </Route>

              <Route path="*" element={page(<NotFound />)} />
            </Routes>
          </AuthProvider>
        </CatalogueProvider>
      </SettingsProvider>
    </LangProvider>
  );
}
