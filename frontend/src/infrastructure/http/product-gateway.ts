import axios from 'axios'
import type { IProductGateway, ProductQuery } from '@/application/ports/product-gateway'
import type {
  Category,
  CategoryOffer,
  Product,
  ProductListResponse,
  Series,
} from '@/domain/entities'
import { http } from './client'

function listParams(query: ProductQuery) {
  return {
    categories: query.categories?.length ? query.categories.join(',') : undefined,
    series: query.series?.length ? query.series.join(',') : undefined,
    q: query.q?.trim() || undefined,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    inStock: query.inStock ? 'true' : undefined,
    sort: query.sort,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export const productGateway: IProductGateway = {
  async list(query) {
    const { data } = await http.get<ProductListResponse>('/api/products', {
      params: listParams(query),
    })
    return data
  },

  async featured() {
    const { data } = await http.get<{ items: Product[] }>('/api/products/featured')
    return data.items
  },

  async getById(id) {
    try {
      const { data } = await http.get<Product>(`/api/products/${id}`)
      return data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null
      throw error
    }
  },

  async listCategories() {
    const { data } = await http.get<{ items: Category[] }>('/api/categories')
    return data.items
  },

  async listSeries() {
    const { data } = await http.get<{ items: Series[] }>('/api/series')
    return data.items
  },

  async listOffers() {
    const { data } = await http.get<{ items: CategoryOffer[] }>('/api/offers')
    return data.items
  },
}
