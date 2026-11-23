import type { ISeriesRepository } from '../../../domain/repositories/series-repository'
import { slugify } from '../../../domain/value-objects/slug'
import { prisma } from './client'
import { toSeriesDto } from './mappers'

export class PrismaSeriesRepository implements ISeriesRepository {
  async list(includeArchived: boolean) {
    const rows = await prisma.series.findMany({
      where: includeArchived ? {} : { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return rows.map(toSeriesDto)
  }

  async findById(id: string) {
    const row = await prisma.series.findUnique({ where: { id } })
    return row ? toSeriesDto(row) : null
  }

  async findBySlug(slug: string) {
    const row = await prisma.series.findFirst({ where: { slug, deletedAt: null } })
    return row ? toSeriesDto(row) : null
  }

  async create(input: Parameters<ISeriesRepository['create']>[0]) {
    const row = await prisma.series.create({
      data: {
        name: input.name,
        slug: input.slug ?? slugify(input.name),
        imageUrl: input.imageUrl ?? null,
        sortOrder: input.sortOrder ?? 0,
      },
    })
    return toSeriesDto(row)
  }

  async update(id: string, input: Parameters<ISeriesRepository['update']>[1]) {
    const row = await prisma.series.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug ?? slugify(input.name),
        imageUrl: input.imageUrl ?? null,
        sortOrder: input.sortOrder ?? 0,
      },
    })
    return toSeriesDto(row)
  }

  async archive(id: string) {
    await prisma.series.update({ where: { id }, data: { deletedAt: new Date() } })
  }

  async restore(id: string) {
    await prisma.series.update({ where: { id }, data: { deletedAt: null } })
  }

  async countActivePrimaryProducts(seriesId: string) {
    return prisma.product.count({
      where: { primarySeriesId: seriesId, isActive: true, deletedAt: null },
    })
  }
}
