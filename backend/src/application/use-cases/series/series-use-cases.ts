import type { SeriesDto } from '../../dto/catalog'
import type { ISeriesRepository } from '../../../domain/repositories/series-repository'
import type { IImageUrlResolver } from '../../ports/image-url-resolver'
import { Series } from '../../../domain/entities/series'
import { conflict, notFound, unprocessable } from '../../errors/app-error'

export interface SeriesInput {
  name: string
  slug?: string
  imageUrl?: string | null
  sortOrder?: number
}

export class SeriesUseCases {
  constructor(
    private readonly series: ISeriesRepository,
    private readonly images: IImageUrlResolver,
  ) {}

  private map(dto: SeriesDto): SeriesDto {
    return { ...dto, imageUrl: dto.imageUrl ? this.images.resolve(dto.imageUrl) : null }
  }

  async listPublic(): Promise<SeriesDto[]> {
    return (await this.series.list(false)).map((dto) => this.map(dto))
  }

  async listAdmin(): Promise<SeriesDto[]> {
    return (await this.series.list(true)).map((dto) => this.map(dto))
  }

  async create(input: SeriesInput): Promise<SeriesDto> {
    const entity = Series.create(input)
    const existing = await this.series.findBySlug(entity.props.slug)
    if (existing) {
      throw conflict('SERIES_SLUG_TAKEN', `Ya existe una serie con el slug "${entity.props.slug}"`)
    }
    const dto = await this.series.create({
      name: entity.props.name,
      slug: entity.props.slug,
      imageUrl: entity.props.imageUrl,
      sortOrder: entity.props.sortOrder,
    })
    return this.map(dto)
  }

  async update(id: string, input: SeriesInput): Promise<SeriesDto> {
    const existing = await this.series.findById(id)
    if (!existing) throw notFound('SERIES_NOT_FOUND', 'Serie no encontrada')
    if (existing.deletedAt) {
      throw unprocessable('SERIES_ARCHIVED', 'Restaura la serie antes de editarla')
    }
    const entity = Series.create(input)
    const clash = await this.series.findBySlug(entity.props.slug)
    if (clash && clash.id !== id) {
      throw conflict('SERIES_SLUG_TAKEN', `Ya existe una serie con el slug "${entity.props.slug}"`)
    }
    const dto = await this.series.update(id, {
      name: entity.props.name,
      slug: entity.props.slug,
      imageUrl: entity.props.imageUrl,
      sortOrder: entity.props.sortOrder,
    })
    return this.map(dto)
  }

  async archive(id: string): Promise<void> {
    const existing = await this.series.findById(id)
    if (!existing) throw notFound('SERIES_NOT_FOUND', 'Serie no encontrada')
    const primaryProducts = await this.series.countActivePrimaryProducts(id)
    if (primaryProducts > 0) {
      throw conflict(
        'SERIES_IS_PRIMARY',
        `No puedes archivar: es serie principal de ${primaryProducts} producto(s) activo(s). Reasigna la principal primero.`,
      )
    }
    await this.series.archive(id)
  }

  async restore(id: string): Promise<void> {
    const existing = await this.series.findById(id)
    if (!existing) throw notFound('SERIES_NOT_FOUND', 'Serie no encontrada')
    await this.series.restore(id)
  }
}
