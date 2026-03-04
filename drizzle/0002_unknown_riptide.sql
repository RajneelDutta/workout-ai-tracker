CREATE TABLE `activeSets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activeWorkoutId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`setNumber` int NOT NULL,
	`reps` int,
	`weight` decimal(8,2),
	`duration` int,
	`rpe` int,
	`isWarmup` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activeSets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activeWorkouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`notes` text,
	CONSTRAINT `activeWorkouts_id` PRIMARY KEY(`id`)
);
