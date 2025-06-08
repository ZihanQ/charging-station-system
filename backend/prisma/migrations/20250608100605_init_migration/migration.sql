-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(30) NOT NULL,
    `username` VARCHAR(30) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(20) NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `charging_piles` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(10) NOT NULL,
    `type` ENUM('FAST', 'SLOW') NOT NULL,
    `power` DOUBLE NOT NULL,
    `status` ENUM('NORMAL', 'FAULT', 'DISABLED') NOT NULL DEFAULT 'NORMAL',
    `position` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `charging_piles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `charging_records` (
    `id` VARCHAR(30) NOT NULL,
    `record_number` VARCHAR(50) NOT NULL,
    `user_id` VARCHAR(30) NOT NULL,
    `charging_pile_id` VARCHAR(30) NOT NULL,
    `requested_amount` DOUBLE NOT NULL,
    `actual_amount` DOUBLE NOT NULL,
    `charging_time` DOUBLE NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `charging_fee` DOUBLE NOT NULL,
    `service_fee` DOUBLE NOT NULL,
    `total_fee` DOUBLE NOT NULL,
    `status` ENUM('WAITING', 'CHARGING', 'COMPLETED', 'CANCELLED', 'FAULT') NOT NULL DEFAULT 'WAITING',

    UNIQUE INDEX `charging_records_record_number_key`(`record_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `queue_records` (
    `id` VARCHAR(30) NOT NULL,
    `queue_number` VARCHAR(10) NOT NULL,
    `user_id` VARCHAR(30) NOT NULL,
    `charging_pile_id` VARCHAR(30) NULL,
    `battery_capacity` DOUBLE NOT NULL,
    `requested_amount` DOUBLE NOT NULL,
    `charging_mode` ENUM('FAST', 'SLOW') NOT NULL,
    `position` INTEGER NOT NULL,
    `waiting_time` DOUBLE NULL,
    `status` ENUM('WAITING', 'IN_QUEUE', 'CHARGING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `queue_records_queue_number_key`(`queue_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_configs` (
    `id` VARCHAR(30) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_configs_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `charging_records` ADD CONSTRAINT `charging_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `charging_records` ADD CONSTRAINT `charging_records_charging_pile_id_fkey` FOREIGN KEY (`charging_pile_id`) REFERENCES `charging_piles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `queue_records` ADD CONSTRAINT `queue_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `queue_records` ADD CONSTRAINT `queue_records_charging_pile_id_fkey` FOREIGN KEY (`charging_pile_id`) REFERENCES `charging_piles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
