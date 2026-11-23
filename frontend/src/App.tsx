import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout, { ProtectedRoute } from '@/presentation/layouts/AdminLayout'
import PublicLayout from '@/presentation/layouts/PublicLayout'
import AdminLoginPage from '@/presentation/pages/AdminLoginPage'
import CatalogPage from '@/presentation/pages/CatalogPage'
import HomePage from '@/presentation/pages/HomePage'
import NotFoundPage from '@/presentation/pages/NotFoundPage'
import ProductDetailPage from '@/presentation/pages/ProductDetailPage'
import SeriesPage from '@/presentation/pages/SeriesPage'
import AdminCategoriesPage from '@/presentation/pages/admin/AdminCategoriesPage'
import AdminOffersPage from '@/presentation/pages/admin/AdminOffersPage'
import AdminOrdersPage from '@/presentation/pages/admin/AdminOrdersPage'
import AdminProductsPage from '@/presentation/pages/admin/AdminProductsPage'
import AdminSeriesPage from '@/presentation/pages/admin/AdminSeriesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="catalogo" element={<CatalogPage />} />
          <Route path="producto/:id" element={<ProductDetailPage />} />
          <Route path="series/:slug" element={<SeriesPage />} />
        </Route>

        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="productos" replace />} />
          <Route path="productos" element={<AdminProductsPage />} />
          <Route path="pedidos" element={<AdminOrdersPage />} />
          <Route path="categorias" element={<AdminCategoriesPage />} />
          <Route path="series" element={<AdminSeriesPage />} />
          <Route path="ofertas" element={<AdminOffersPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
