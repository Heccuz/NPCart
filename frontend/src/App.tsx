import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PublicLayout from '@/presentation/layouts/PublicLayout'
import CatalogPage from '@/presentation/pages/CatalogPage'
import HomePage from '@/presentation/pages/HomePage'
import NotFoundPage from '@/presentation/pages/NotFoundPage'
import ProductDetailPage from '@/presentation/pages/ProductDetailPage'
import SeriesPage from '@/presentation/pages/SeriesPage'

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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
