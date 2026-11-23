import type { ICategoryRepository } from '../../../domain/repositories/category-repository'
import { slugify } from '../../../domain/value-objects/slug'
import { prisma } from './client'
import { toCategoryDto } from './mappers'

export class PrismaCategoryRepository implements ICategoryRepository {
  async list(includeArchived: boolean) {
    const rows = await prisma.category.findMany({
      where: includeArchived ? {} : { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return rows.map(toCategoryDto)
  }

  async findById(id: string) {
    const row = await prisma.category.findUnique({ where: { id } })
    return row ? toCategoryDto(row) : null
  }

  async findBySlug(slug: string) {
    const row = await prisma.category.findFirst({ where: { slug, deletedAt: null } })
    return row ? toCategoryDto(row) : null
  }

  async create(input: Parameters<ICategoryRepository['create']>[0]) {
    const row = await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug ?? slugify(input.name),
        basePriceCents: input.basePriceCents,
        sortOrder: input.sortOrder ?? 0,
      },
    })
    return toCategoryDto(row)
  }

  async update(id: string, input: Parameters<ICategoryRepository['update']>[1]) {
    const row = await prisma.category.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug ?? slugify(input.name),
        basePriceCents: input.basePriceCents,
        sortOrder: input.sortOrder ?? 0,
      },
    })
    return toCategoryDto(row)
  }

  async archive(id: string) {
    await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } })
  }

  async restore(id: string) {
    await prisma.category.update({ where: { id }, data: { deletedAt: null } })
  }

  async countActiveProducts(categoryId: string) {
    return prisma.product.count({ where: { categoryId, isActive: true, deletedAt: null } })
  }
}
