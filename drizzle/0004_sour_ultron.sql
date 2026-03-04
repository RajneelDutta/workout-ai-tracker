CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`programDescription` text,
	`schedule` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templateExercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`exerciseOrder` int NOT NULL,
	`targetSets` int NOT NULL DEFAULT 3,
	`targetReps` int,
	`targetWeight` decimal(8,2),
	`restDuration` int,
	`exerciseNotes` text,
	`supersetGroup` int,
	CONSTRAINT `templateExercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workoutTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`estimatedDuration` int,
	`category` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workoutTemplates_id` PRIMARY KEY(`id`)
);
