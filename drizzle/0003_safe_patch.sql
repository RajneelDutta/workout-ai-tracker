CREATE TABLE `bossFights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('strength','endurance','volume','consistency') NOT NULL,
	`description` text,
	`targetValue` int NOT NULL,
	`currentValue` int NOT NULL DEFAULT 0,
	`xpReward` int NOT NULL,
	`bossStatus` enum('active','defeated','expired') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bossFights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `characterProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`prestigeLevel` int NOT NULL DEFAULT 0,
	`title` varchar(100) NOT NULL DEFAULT 'Rookie',
	`statSTR` int NOT NULL DEFAULT 0,
	`statEND` int NOT NULL DEFAULT 0,
	`statAGI` int NOT NULL DEFAULT 0,
	`statFLX` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `characterProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `characterProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `lootRewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lootType` enum('title','badge_frame','theme') NOT NULL,
	`name` varchar(255) NOT NULL,
	`rarity` enum('common','uncommon','rare','epic','legendary') NOT NULL,
	`lootMetadata` json,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lootRewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skillNodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`muscleGroup` varchar(100) NOT NULL,
	`tier` enum('novice','intermediate','advanced','master') NOT NULL DEFAULT 'novice',
	`xp` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skillNodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unlockedBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` varchar(100) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unlockedBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `xpTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`source` varchar(100) NOT NULL,
	`multiplier` decimal(4,2) DEFAULT '1.00',
	`statType` enum('STR','END','AGI','FLX'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xpTransactions_id` PRIMARY KEY(`id`)
);
