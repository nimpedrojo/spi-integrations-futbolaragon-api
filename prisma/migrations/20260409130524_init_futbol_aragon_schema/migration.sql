-- CreateTable
CREATE TABLE `teams` (
    `id` VARCHAR(128) NOT NULL,
    `clubId` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NULL,
    `slug` VARCHAR(255) NULL,
    `season` VARCHAR(64) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `teams_clubId_idx`(`clubId`),
    INDEX `teams_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competitions` (
    `id` VARCHAR(128) NOT NULL,
    `sourceId` VARCHAR(128) NOT NULL,
    `teamId` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `season` VARCHAR(64) NOT NULL,
    `sourceSystem` VARCHAR(64) NULL,
    `externalCode` VARCHAR(128) NULL,
    `groupName` VARCHAR(255) NULL,
    `status` ENUM('active', 'inactive') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `competitions_sourceId_key`(`sourceId`),
    INDEX `competitions_teamId_idx`(`teamId`),
    INDEX `competitions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendars` (
    `id` VARCHAR(128) NOT NULL,
    `sourceId` VARCHAR(128) NOT NULL,
    `competitionId` VARCHAR(128) NOT NULL,
    `teamId` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `seasonLabel` VARCHAR(128) NULL,
    `visibleContext` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `calendars_sourceId_key`(`sourceId`),
    INDEX `calendars_competitionId_idx`(`competitionId`),
    INDEX `calendars_teamId_idx`(`teamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rounds` (
    `id` VARCHAR(128) NOT NULL,
    `sourceId` VARCHAR(128) NOT NULL,
    `calendarId` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `roundOrder` INTEGER NOT NULL,
    `number` INTEGER NULL,
    `dateLabel` VARCHAR(64) NULL,
    `status` ENUM('scheduled', 'in_progress', 'completed') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rounds_sourceId_key`(`sourceId`),
    INDEX `rounds_calendarId_idx`(`calendarId`),
    INDEX `rounds_status_idx`(`status`),
    INDEX `rounds_roundOrder_idx`(`roundOrder`),
    INDEX `rounds_number_idx`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` VARCHAR(128) NOT NULL,
    `sourceId` VARCHAR(128) NOT NULL,
    `roundId` VARCHAR(128) NOT NULL,
    `homeTeamName` VARCHAR(255) NOT NULL,
    `awayTeamName` VARCHAR(255) NOT NULL,
    `kickoffAt` VARCHAR(64) NOT NULL,
    `status` ENUM('scheduled', 'in_progress', 'played', 'final', 'provisional') NOT NULL,
    `result` VARCHAR(64) NULL,
    `homeScore` INTEGER NULL,
    `awayScore` INTEGER NULL,
    `venue` VARCHAR(255) NULL,
    `sourceUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `matches_sourceId_key`(`sourceId`),
    INDEX `matches_roundId_idx`(`roundId`),
    INDEX `matches_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `standings` (
    `id` VARCHAR(128) NOT NULL,
    `sourceId` VARCHAR(128) NOT NULL,
    `competitionId` VARCHAR(128) NOT NULL,
    `teamName` VARCHAR(255) NOT NULL,
    `position` INTEGER NOT NULL,
    `points` INTEGER NOT NULL,
    `played` INTEGER NULL,
    `won` INTEGER NULL,
    `drawn` INTEGER NULL,
    `lost` INTEGER NULL,
    `goalsFor` INTEGER NULL,
    `goalsAgainst` INTEGER NULL,
    `goalDifference` INTEGER NULL,
    `sourceUrl` TEXT NULL,
    `capturedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `standings_competitionId_idx`(`competitionId`),
    INDEX `standings_capturedAt_idx`(`capturedAt`),
    INDEX `standings_competitionId_capturedAt_idx`(`competitionId`, `capturedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `source_references` (
    `id` VARCHAR(128) NOT NULL,
    `entity` VARCHAR(64) NOT NULL,
    `entityType` VARCHAR(64) NULL,
    `internalId` VARCHAR(128) NOT NULL,
    `internalName` VARCHAR(255) NULL,
    `sourceId` VARCHAR(128) NULL,
    `sourceName` VARCHAR(255) NULL,
    `sourceClubName` VARCHAR(255) NULL,
    `sourceSystem` VARCHAR(64) NULL,
    `sourceEntityType` VARCHAR(64) NULL,
    `sourceUrl` TEXT NULL,
    `navigation` JSON NULL,
    `notes` TEXT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastSeenAt` DATETIME(3) NULL,

    INDEX `source_references_internalId_idx`(`internalId`),
    INDEX `source_references_entity_idx`(`entity`),
    INDEX `source_references_entityType_idx`(`entityType`),
    INDEX `source_references_sourceSystem_idx`(`sourceSystem`),
    INDEX `source_references_sourceId_idx`(`sourceId`),
    INDEX `source_references_internalId_entity_sourceSystem_idx`(`internalId`, `entity`, `sourceSystem`),
    INDEX `source_references_internalId_entityType_sourceSystem_idx`(`internalId`, `entityType`, `sourceSystem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_runs` (
    `id` VARCHAR(128) NOT NULL,
    `teamId` VARCHAR(128) NOT NULL,
    `sourceSystem` VARCHAR(64) NULL,
    `accessMode` VARCHAR(32) NULL,
    `status` ENUM('running', 'completed', 'completed_with_warnings', 'failed') NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `finishedAt` DATETIME(3) NULL,
    `summary` JSON NULL,
    `errorMessage` TEXT NULL,
    `issues` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sync_runs_teamId_idx`(`teamId`),
    INDEX `sync_runs_status_idx`(`status`),
    INDEX `sync_runs_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_batch_runs` (
    `id` VARCHAR(128) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `finishedAt` DATETIME(3) NULL,
    `status` ENUM('running', 'success', 'partial_success', 'failed') NOT NULL,
    `totalTeams` INTEGER NOT NULL,
    `successCount` INTEGER NOT NULL,
    `partialCount` INTEGER NOT NULL,
    `failedCount` INTEGER NOT NULL,
    `teamIds` JSON NOT NULL,
    `summary` JSON NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sync_batch_runs_status_idx`(`status`),
    INDEX `sync_batch_runs_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendars` ADD CONSTRAINT `calendars_competitionId_fkey` FOREIGN KEY (`competitionId`) REFERENCES `competitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendars` ADD CONSTRAINT `calendars_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rounds` ADD CONSTRAINT `rounds_calendarId_fkey` FOREIGN KEY (`calendarId`) REFERENCES `calendars`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_roundId_fkey` FOREIGN KEY (`roundId`) REFERENCES `rounds`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `standings` ADD CONSTRAINT `standings_competitionId_fkey` FOREIGN KEY (`competitionId`) REFERENCES `competitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sync_runs` ADD CONSTRAINT `sync_runs_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
