-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "basePriceCents" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "primarySeriesId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "details" TEXT NOT NULL DEFAULT '',
    "stock" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSeries" (
    "productId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,

    CONSTRAINT "ProductSeries_pkey" PRIMARY KEY ("productId","seriesId")
);

-- CreateTable
CREATE TABLE "CategoryOffer" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CategoryOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDIENTE',
    "subtotalCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "seriesName" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "lineTotalCents" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("orderId","productId")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");

-- CreateIndex
CREATE INDEX "Series_deletedAt_idx" ON "Series"("deletedAt");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_primarySeriesId_idx" ON "Product"("primarySeriesId");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- CreateIndex
CREATE INDEX "ProductSeries_seriesId_idx" ON "ProductSeries"("seriesId");

-- CreateIndex
CREATE INDEX "CategoryOffer_categoryId_idx" ON "CategoryOffer"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryOffer_deletedAt_idx" ON "CategoryOffer"("deletedAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- Índices únicos parciales: el borrado lógico libera slugs y tramos.
CREATE UNIQUE INDEX "Category_slug_active_key" ON "Category"("slug") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "Series_slug_active_key" ON "Series"("slug") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "CategoryOffer_categoryId_minQuantity_active_key" ON "CategoryOffer"("categoryId", "minQuantity") WHERE "deletedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_primarySeriesId_fkey" FOREIGN KEY ("primarySeriesId") REFERENCES "Series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSeries" ADD CONSTRAINT "ProductSeries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSeries" ADD CONSTRAINT "ProductSeries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryOffer" ADD CONSTRAINT "CategoryOffer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
