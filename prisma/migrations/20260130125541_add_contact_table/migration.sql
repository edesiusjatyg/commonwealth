-- CreateTable
CREATE TABLE "user_insights" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "portfolio_tokens" JSON,
    "insight_type" VARCHAR(50) NOT NULL,
    "insight_text" VARCHAR(2000) NOT NULL,
    "confidence" INTEGER,
    "insight_metadata" JSON,
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "user_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ethAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_user_insights_created_at" ON "user_insights"("created_at");

-- CreateIndex
CREATE INDEX "ix_user_insights_id" ON "user_insights"("id");

-- CreateIndex
CREATE INDEX "ix_user_insights_user_id" ON "user_insights"("user_id");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
