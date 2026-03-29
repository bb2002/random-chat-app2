CREATE TABLE `queue_entries` (
	`id` varchar(36) NOT NULL,
	`user_name` varchar(20) NOT NULL,
	`chat_mode` enum('text','voice','video') NOT NULL,
	`status` enum('waiting','matched','cancelled') NOT NULL DEFAULT 'waiting',
	`session_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `queue_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`chat_mode` enum('text','voice','video') NOT NULL,
	`user1_name` varchar(20) NOT NULL,
	`user2_name` varchar(20) NOT NULL,
	`user1_queue_id` varchar(36) NOT NULL,
	`user2_queue_id` varchar(36) NOT NULL,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`ended_at` timestamp,
	`termination_reason` enum('timer_expired','user_left'),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
