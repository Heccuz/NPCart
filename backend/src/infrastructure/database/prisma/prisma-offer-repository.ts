import type { IOfferRepository } from '../../../domain/repositories/offer-repository'
import { prisma } from './client'
import { toOfferDto } from './mappers'

const offerInclude = { category: true } as const

export class PrismaOfferRepository implements IOfferRepository {
  async list(includeArchived: boolean) {
    const rows = await prisma.categoryOffer.findMany({
      where: includeArchived ? {} : { deletedAt: null },
      include: offerInclude,
      orderBy: [{ category: { sortOrder: 'asc' } }, { minQuantity: 'asc' }],
    })
    return rows.map(toOfferDto)
  }

  async listActive() {
    const rows = await prisma.categoryOffer.findMany({
      where: { isActive: true, deletedAt: null, category: { deletedAt: null } },
      include: offerInclude,
      orderBy: [{ category: { sortOrder: 'asc' } }, { minQuantity: 'asc' }],
    })
    return rows.map(toOfferDto)
  }

  async listActiveByCategoryIds(categoryIds: string[]) {
    if (categoryIds.length === 0) return []
    const rows = await prisma.categoryOffer.findMany({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
        deletedAt: null,
        category: { deletedAt: null },
      },
      include: offerInclude,
      orderBy: { minQuantity: 'asc' },
    })
    return rows.map(toOfferDto)
  }

  async listActiveByCategory(categoryId: string) {
    const rows = await prisma.categoryOffer.findMany({
      where: { categoryId, isActive: true, deletedAt: null },
      include: offerInclude,
      orderBy: { minQuantity: 'asc' },
    })
    return rows.map(toOfferDto)
  }

  async findById(id: string) {
    const row = await prisma.categoryOffer.findUnique({ where: { id }, include: offerInclude })
    return row ? toOfferDto(row) : null
  }

  async create(input: Parameters<IOfferRepository['create']>[0]) {
    const row = await prisma.categoryOffer.create({
      data: {
        categoryId: input.categoryId,
        minQuantity: input.minQuantity,
        unitPriceCents: input.unitPriceCents,
        isActive: input.isActive ?? true,
      },
      include: offerInclude,
    })
    return toOfferDto(row)
  }

  async update(id: string, input: Parameters<IOfferRepository['update']>[1]) {
    const row = await prisma.categoryOffer.update({
      where: { id },
      data: {
        categoryId: input.categoryId,
        minQuantity: input.minQuantity,
        unitPriceCents: input.unitPriceCents,
        isActive: input.isActive ?? true,
      },
      include: offerInclude,
    })
    return toOfferDto(row)
  }

  async archive(id: string) {
    await prisma.categoryOffer.update({ where: { id }, data: { deletedAt: new Date() } })
  }

  async restore(id: string) {
    await prisma.categoryOffer.update({ where: { id }, data: { deletedAt: null } })
  }
}
