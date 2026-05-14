-- CreateTable
CREATE TABLE `TriageRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `medical_id` VARCHAR(191) NOT NULL,
    `patient` VARCHAR(191) NOT NULL,
    `age` INTEGER NULL,
    `gender` VARCHAR(191) NULL,
    `heartRate` INTEGER NULL,
    `bloodPressure` VARCHAR(191) NULL,
    `temperature` DOUBLE NULL,
    `symptoms` TEXT NOT NULL,
    `medications` TEXT NULL,
    `history` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `doctorNotes` TEXT NULL,
    `diagnosis` TEXT NULL,
    `urgency` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'English',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TriageRecord_medical_id_key`(`medical_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
