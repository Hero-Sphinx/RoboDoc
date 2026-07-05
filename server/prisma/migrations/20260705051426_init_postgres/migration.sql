-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DOCTOR', 'ADMIN');

-- CreateTable
CREATE TABLE "TriageRecord" (
    "id" SERIAL NOT NULL,
    "medical_id" TEXT NOT NULL,
    "patient" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "heartRate" INTEGER,
    "bloodPressure" TEXT,
    "temperature" DOUBLE PRECISION,
    "symptoms" TEXT NOT NULL,
    "medications" TEXT,
    "history" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "seenBy" TEXT,
    "doctorNotes" TEXT,
    "diagnosis" TEXT,
    "urgency" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'English',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'DOCTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
