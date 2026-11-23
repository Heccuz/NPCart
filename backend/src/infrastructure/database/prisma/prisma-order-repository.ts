import type { Prisma } from '../../../generated/prisma/client'
import type { StockWarning } from '../../../application/dto/catalog'
import type { IOrderRepository } from '../../../domain/repositories/order-repository'
import { prisma } from './client'
import { toOrderDto } from './mappers'

const orderInclude = { items: true } as const

export class PrismaOrderRepository implements IOrderRepository {
  async createPending(data: Parameters<IOrderRepository['createPending']>[0]) {
    const { items, ...rest } = data
    const row = await prisma.order.create({
      data: {
        ...rest,
        items: { create: items },
      },
      include: orderInclude,
    })
    return toOrderDto(row)
  }

  async existsByCode(code: string) {
    const count = await prisma.order.count({ where: { code } })
    return count > 0
  }

  async list(filters: Parameters<IOrderRepository['list']>[0]) {
    const page = Math.max(1, Math.trunc(filters.page ?? 1))
    const pageSize = Math.min(50, Math.max(1, Math.trunc(filters.pageSize ?? 20)))

    const where: Prisma.OrderWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.q?.trim() ? { code: { contains: filters.q.trim(), mode: 'insensitive' } } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    }

    const [total, rows] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return { items: rows.map(toOrderDto), total }
  }

  async findById(id: string) {
    const row = await prisma.order.findUnique({ where: { id }, include: orderInclude })
    return row ? toOrderDto(row) : null
  }

  async findByCode(code: string) {
    const row = await prisma.order.findUnique({ where: { code }, include: orderInclude })
    return row ? toOrderDto(row) : null
  }

  async confirm(id: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: orderInclude })
      if (!order) return { order: null, warnings: [] }

      if (order.status !== 'PENDIENTE') {
        return { order: toOrderDto(order), warnings: [] }
      }

      const warnings: StockWarning[] = []

      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        })
        const available = product?.stock ?? 0
        if (available < item.qty) {
          warnings.push({
            productId: item.productId,
            name: item.name,
            requested: item.qty,
            available,
          })
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: Math.max(0, available - item.qty) },
        })
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: 'CONFIRMADO', confirmedAt: new Date() },
        include: orderInclude,
      })

      return { order: toOrderDto(updated), warnings }
    })
  }

  async cancel(id: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: orderInclude })
      if (!order) return null
      if (order.status === 'CANCELADO') return toOrderDto(order)

      if (order.status === 'CONFIRMADO') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
          })
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: 'CANCELADO', confirmedAt: null },
        include: orderInclude,
      })
      return toOrderDto(updated)
    })
  }
}
