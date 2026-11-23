import type { IAdminGateway } from '@/application/ports/admin-gateway'
import type {
  Category,
  CategoryOffer,
  Order,
  Product,
  ProductListResponse,
  Series,
  StockWarning,
} from '@/domain/entities'
import { http } from './client'

export const adminGateway: IAdminGateway = {
  async listProducts(query) {
    const { data } = await http.get<ProductListResponse>('/api/admin/products', {
      params: {
        categories: query.categories?.length ? query.categories.join(',') : undefined,
        series: query.series?.length ? query.series.join(',') : undefined,
        q: query.q?.trim() || undefined,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        inStock: query.inStock ? 'true' : undefined,
        sort: query.sort,
        page: query.page,
        pageSize: query.pageSize,
      },
    })
    return data
  },

  async createProduct(input) {
    const { data } = await http.post<Product>('/api/admin/products', input)
    return data
  },

  async updateProduct(id, input) {
    const { data } = await http.put<Product>(`/api/admin/products/${id}`, input)
    return data
  },

  async archiveProduct(id) {
    await http.delete(`/api/admin/products/${id}`)
  },

  async restoreProduct(id) {
    await http.post(`/api/admin/products/${id}/restore`)
  },

  async setProductActive(id, isActive) {
    const { data } = await http.patch<Product>(`/api/admin/products/${id}/active`, { isActive })
    return data
  },

  async setProductFeatured(id, isFeatured) {
    const { data } = await http.patch<Product>(`/api/admin/products/${id}/featured`, {
      isFeatured,
    })
    return data
  },

  async listCategories() {
    const { data } = await http.get<{ items: Category[] }>('/api/admin/categories')
    return data.items
  },

  async createCategory(input) {
    const { data } = await http.post<Category>('/api/admin/categories', input)
    return data
  },

  async updateCategory(id, input) {
    const { data } = await http.put<Category>(`/api/admin/categories/${id}`, input)
    return data
  },

  async archiveCategory(id) {
    await http.delete(`/api/admin/categories/${id}`)
  },

  async restoreCategory(id) {
    await http.post(`/api/admin/categories/${id}/restore`)
  },

  async listSeries() {
    const { data } = await http.get<{ items: Series[] }>('/api/admin/series')
    return data.items
  },

  async createSeries(input) {
    const { data } = await http.post<Series>('/api/admin/series', input)
    return data
  },

  async updateSeries(id, input) {
    const { data } = await http.put<Series>(`/api/admin/series/${id}`, input)
    return data
  },

  async archiveSeries(id) {
    await http.delete(`/api/admin/series/${id}`)
  },

  async restoreSeries(id) {
    await http.post(`/api/admin/series/${id}/restore`)
  },

  async listOffers() {
    const { data } = await http.get<{ items: CategoryOffer[] }>('/api/admin/offers')
    return data.items
  },

  async createOffer(input) {
    const { data } = await http.post<CategoryOffer>('/api/admin/offers', input)
    return data
  },

  async updateOffer(id, input) {
    const { data } = await http.put<CategoryOffer>(`/api/admin/offers/${id}`, input)
    return data
  },

  async archiveOffer(id) {
    await http.delete(`/api/admin/offers/${id}`)
  },

  async restoreOffer(id) {
    await http.post(`/api/admin/offers/${id}/restore`)
  },

  async listOrders(query) {
    const { data } = await http.get<{ items: Order[]; total: number }>('/api/admin/orders', {
      params: {
        status: query.status,
        q: query.q?.trim() || undefined,
        page: query.page,
        pageSize: query.pageSize,
      },
    })
    return data
  },

  async confirmOrder(id) {
    const { data } = await http.put<{ order: Order; warnings: StockWarning[] }>(
      `/api/admin/orders/${id}/confirm`,
    )
    return data
  },

  async cancelOrder(id) {
    const { data } = await http.put<Order>(`/api/admin/orders/${id}/cancel`)
    return data
  },
}
