import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const categories = [
  { name: 'Mini pequeña', slug: 'mini-pequena', basePriceCents: 800, sortOrder: 1 },
  { name: 'Mini mediana', slug: 'mini-mediana', basePriceCents: 1500, sortOrder: 2 },
  { name: 'Mini grande', slug: 'mini-grande', basePriceCents: 2500, sortOrder: 3 },
]

const seriesSeed = [
  { name: 'Marvel', slug: 'marvel', sortOrder: 1 },
  { name: 'Spiderman', slug: 'spiderman', sortOrder: 2 },
  { name: 'Dungeons & Dragons', slug: 'dungeons-dragons', sortOrder: 3 },
  { name: 'Terror', slug: 'terror', sortOrder: 4 },
  { name: 'Super Héroes', slug: 'super-heroes', sortOrder: 5 },
  { name: 'Anime', slug: 'anime', sortOrder: 6 },
]

const productsSeed = [
  {
    name: 'Spiderman Clásico',
    category: 'mini-mediana',
    series: ['spiderman', 'marvel', 'super-heroes'],
    primary: 'spiderman',
    priceCents: 1500,
    stock: 12,
    isFeatured: true,
    details: 'Mini de Spiderman en pose de salto, base circular incluida. Impresión en resina a 0.03 mm.',
  },
  {
    name: 'Spiderman Miles Morales',
    category: 'mini-mediana',
    series: ['spiderman', 'marvel'],
    primary: 'spiderman',
    priceCents: 1500,
    stock: 8,
    isFeatured: true,
    details: 'Miles en pose dinámica con telaraña. Pintado opcional.',
  },
  {
    name: 'Beholder',
    category: 'mini-mediana',
    series: ['dungeons-dragons'],
    primary: 'dungeons-dragons',
    priceCents: 1500,
    stock: 6,
    isFeatured: false,
    details: 'El ojo que todo lo ve. Ideal para tu mesa de D&D.',
  },
  {
    name: 'Mimic',
    category: 'mini-mediana',
    series: ['dungeons-dragons', 'terror'],
    primary: 'dungeons-dragons',
    priceCents: 1600,
    stock: 4,
    isFeatured: false,
    details: 'El cofre que muerde. Sorpresa garantizada en la mesa.',
  },
  {
    name: 'Mind Flayer',
    category: 'mini-grande',
    series: ['dungeons-dragons', 'terror'],
    primary: 'dungeons-dragons',
    priceCents: 2600,
    stock: 5,
    isFeatured: true,
    details: 'Devorador de mentes con tentáculos detallados.',
  },
  {
    name: 'Dragón Rojo',
    category: 'mini-grande',
    series: ['dungeons-dragons'],
    primary: 'dungeons-dragons',
    priceCents: 2500,
    stock: 3,
    isFeatured: false,
    details: 'Jefe final de campaña. Escamas y alas listas para pintar.',
  },
  {
    name: 'Iron Man',
    category: 'mini-mediana',
    series: ['marvel', 'super-heroes'],
    primary: 'marvel',
    priceCents: 1600,
    stock: 0,
    isFeatured: false,
    details: 'Armadura Mark III en pose de aterrizaje. Reposición en camino.',
  },
  {
    name: 'Capitán América',
    category: 'mini-grande',
    series: ['marvel', 'super-heroes'],
    primary: 'marvel',
    priceCents: 2500,
    stock: 7,
    isFeatured: false,
    details: 'Con escudo y base temática.',
  },
  {
    name: 'Chucky',
    category: 'mini-mediana',
    series: ['terror'],
    primary: 'terror',
    priceCents: 1500,
    stock: 5,
    isFeatured: false,
    details: 'Muñeco poseído, escala mesa. No apto para cobardes.',
  },
  {
    name: 'Pennywise',
    category: 'mini-grande',
    series: ['terror'],
    primary: 'terror',
    priceCents: 2500,
    stock: 2,
    isFeatured: false,
    details: 'El payaso de Derry con globo incluido.',
  },
  {
    name: 'Tanjiro',
    category: 'mini-mediana',
    series: ['anime'],
    primary: 'anime',
    priceCents: 1600,
    stock: 9,
    isFeatured: true,
    details: 'Cazador de demonios en guardia. Espada y haori detallados.',
  },
  {
    name: 'Goku',
    category: 'mini-grande',
    series: ['anime'],
    primary: 'anime',
    priceCents: 2600,
    stock: 4,
    isFeatured: false,
    details: 'Pose de combate con aura modelada en la base.',
  },
  {
    name: 'Caballero con espada',
    category: 'mini-pequena',
    series: ['dungeons-dragons'],
    primary: 'dungeons-dragons',
    priceCents: 800,
    stock: 20,
    isFeatured: false,
    details: 'Aldeano armado, perfecto para ejércitos y NPCs.',
  },
  {
    name: 'Aldeano',
    category: 'mini-pequena',
    series: ['dungeons-dragons'],
    primary: 'dungeons-dragons',
    priceCents: 800,
    stock: 15,
    isFeatured: false,
    details: 'Habitante típico de pueblo. Lote disponible por encargo.',
  },
]

const offersSeed = [
  { category: 'mini-mediana', minQuantity: 5, unitPriceCents: 1200 },
  { category: 'mini-mediana', minQuantity: 10, unitPriceCents: 1000 },
  { category: 'mini-grande', minQuantity: 3, unitPriceCents: 2200 },
  { category: 'mini-pequena', minQuantity: 10, unitPriceCents: 600 },
]

async function main() {
  const categoryIds = new Map<string, string>()
  for (const category of categories) {
    const existing = await prisma.category.findFirst({ where: { slug: category.slug } })
    const row = existing
      ? await prisma.category.update({ where: { id: existing.id }, data: category })
      : await prisma.category.create({ data: category })
    categoryIds.set(category.slug, row.id)
  }

  const seriesIds = new Map<string, string>()
  for (const item of seriesSeed) {
    const existing = await prisma.series.findFirst({ where: { slug: item.slug } })
    const row = existing
      ? await prisma.series.update({ where: { id: existing.id }, data: item })
      : await prisma.series.create({ data: item })
    seriesIds.set(item.slug, row.id)
  }

  for (const seed of productsSeed) {
    const categoryId = categoryIds.get(seed.category)
    if (!categoryId) throw new Error(`Categoría desconocida: ${seed.category}`)
    const seriesIdsForProduct = seed.series.map((slug) => {
      const id = seriesIds.get(slug)
      if (!id) throw new Error(`Serie desconocida: ${slug}`)
      return id
    })
    const primarySeriesId = seriesIds.get(seed.primary)
    if (!primarySeriesId) throw new Error(`Serie principal desconocida: ${seed.primary}`)

    const data = {
      name: seed.name,
      categoryId,
      primarySeriesId,
      priceCents: seed.priceCents,
      stock: seed.stock,
      isFeatured: seed.isFeatured,
      details: seed.details,
    }

    const existing = await prisma.product.findFirst({ where: { name: seed.name } })
    const product = existing
      ? await prisma.product.update({ where: { id: existing.id }, data })
      : await prisma.product.create({ data })

    await prisma.productSeries.deleteMany({ where: { productId: product.id } })
    await prisma.productSeries.createMany({
      data: seriesIdsForProduct.map((seriesId) => ({ productId: product.id, seriesId })),
    })
  }

  for (const offer of offersSeed) {
    const categoryId = categoryIds.get(offer.category)
    if (!categoryId) throw new Error(`Categoría desconocida: ${offer.category}`)
    const existing = await prisma.categoryOffer.findFirst({
      where: { categoryId, minQuantity: offer.minQuantity, deletedAt: null },
    })
    if (existing) {
      await prisma.categoryOffer.update({
        where: { id: existing.id },
        data: { unitPriceCents: offer.unitPriceCents },
      })
    } else {
      await prisma.categoryOffer.create({
        data: {
          categoryId,
          minQuantity: offer.minQuantity,
          unitPriceCents: offer.unitPriceCents,
        },
      })
    }
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@npcart.local').toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'cambia-esta-clave-ahora'
  const passwordHash = await bcrypt.hash(adminPassword, 10)
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  })

  console.log(
    `[seed] ${categories.length} categorías, ${seriesSeed.length} series, ${productsSeed.length} productos, ${offersSeed.length} tramos y admin ${adminEmail}`,
  )
}

main()
  .catch((error) => {
    console.error('[seed] Error:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
