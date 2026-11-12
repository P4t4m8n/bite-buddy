-- Switch from Auth.js to Better Auth.
-- Hand-written instead of Prisma's generated SQL so existing users and their Google links are kept.

-- Account: convert Auth.js columns to the Better Auth shape.
ALTER TABLE "Account" RENAME COLUMN "providerAccountId" TO "accountId";
ALTER TABLE "Account" RENAME COLUMN "provider" TO "providerId";
ALTER TABLE "Account" RENAME COLUMN "access_token" TO "accessToken";
ALTER TABLE "Account" RENAME COLUMN "refresh_token" TO "refreshToken";
ALTER TABLE "Account" RENAME COLUMN "id_token" TO "idToken";

ALTER TABLE "Account"
ADD COLUMN "id" TEXT,
ADD COLUMN "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "password" TEXT;

UPDATE "Account"
SET "id" = md5(random()::text || clock_timestamp()::text || "accountId"),
    "accessTokenExpiresAt" = to_timestamp("expires_at");

ALTER TABLE "Account" DROP CONSTRAINT "Account_pkey",
DROP COLUMN "type",
DROP COLUMN "expires_at",
DROP COLUMN "token_type",
DROP COLUMN "session_state",
ALTER COLUMN "id" SET NOT NULL,
ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");

-- User: Better Auth requires name and email, and stores emailVerified as a boolean.
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "emailVerified" TYPE BOOLEAN USING ("emailVerified" IS NOT NULL),
ALTER COLUMN "emailVerified" SET DEFAULT false,
ALTER COLUMN "emailVerified" SET NOT NULL;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
