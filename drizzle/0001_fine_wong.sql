CREATE TABLE `aiInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('performance','suggestion','recovery','trend') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('strength','cardio','flexibility','sports','other') NOT NULL,
	`muscleGroups` json NOT NULL,
	`isCustom` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`exerciseId` int,
	`targetValue` decimal(10,2) NOT NULL,
	`currentValue` decimal(10,2) DEFAULT '0',
	`unit` varchar(50) NOT NULL,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`targetDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personalRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`setId` int NOT NULL,
	`achievedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `personalRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workoutId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`reps` int NOT NULL,
	`weight` decimal(8,2),
	`duration` int,
	`distance` decimal(8,2),
	`rpe` int,
	`notes` text,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`date` timestamp NOT NULL,
	`duration` int,
	`notes` text,
	`totalVolume` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workouts_id` PRIMARY KEY(`id`)
);
