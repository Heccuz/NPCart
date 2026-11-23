import type { SeriesDto } from '../../application/dto/catalog'

export interface SeriesInput {
  name: string
  slug?: string
  imageUrl?: string | null
  sortOrder?: number
}

export interface ISeriesRepository {
  list(includeArchived: boolean): Promise<SeriesDto[]>
  findById(id: string): Promise<SeriesDto | null>
  findBySlug(slug: string): Promise<SeriesDto | null>
  create(input: SeriesInput): Promise<SeriesDto>
  update(id: string, input: SeriesInput): Promise<SeriesDto>
  archive(id: string): Promise<void>
  restore(id: string): Promise<void>
  countActivePrimaryProducts(seriesId: string): Promise<number>
}
