import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ProductQuery } from '@/application/ports/product-gateway'
import { productGateway } from '@/infrastructure/http/product-gateway'

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => productGateway.list(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productGateway.featured(),
    staleTime: 60_000,
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productGateway.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => productGateway.listCategories(),
    staleTime: 5 * 60_000,
  })
}

export function useSeries() {
  return useQuery({
    queryKey: ['series'],
    queryFn: () => productGateway.listSeries(),
    staleTime: 5 * 60_000,
  })
}

export function useOffers() {
  return useQuery({
    queryKey: ['offers'],
    queryFn: () => productGateway.listOffers(),
    staleTime: 60_000,
  })
}
