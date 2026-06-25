-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 23, 2026 at 12:50 PM
-- Server version: 10.11.18-MariaDB
-- PHP Version: 8.4.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `rewardpl_main`
--

-- --------------------------------------------------------

--
-- Table structure for table `fitness_achievements`
--

CREATE TABLE `fitness_achievements` (
  `achievement_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('steps','streak','special') NOT NULL,
  `target_value` int(11) NOT NULL,
  `reward_coins` int(11) DEFAULT 0,
  `icon` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `group_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `fitness_achievements`
--
-- Only `type = 'steps'` achievements are kept here, checked against
-- LIFETIME cumulative steps (FitnessModel.getLifetimeSteps), not a single
-- day — hence "Lifetime Steps" wording and a target ladder spread across
-- weeks/months/years of normal use rather than clustering in the first
-- few days.
--
-- Removed vs. the original dump:
--  - 'special' achievements (Morning Steps / Walk Trail, old ids 11-20,
--    26-35): the unlock loop in fitnessService.js only ever checks
--    type 'steps' or 'streak', and nothing tracks pre-7AM steps or
--    outdoor-walk count, so these could never actually unlock.
--  - 'streak' achievements (old ids 21-25): superseded by
--    fitness_streak_bonus_config (see 001_fitness_reward_config.sql),
--    which now covers the 7/14/30/60/90-day milestones — keeping both
--    would pay out twice for the same streak.
--
-- Coins are scaled ~5x down from the original 10-500 range to stay
-- consistent with the reworked reward economy (1 coin = ₹1).

INSERT INTO `fitness_achievements` (`achievement_id`, `title`, `description`, `type`, `target_value`, `reward_coins`, `icon`, `created_at`, `group_id`) VALUES
(1, '10K Lifetime Steps', 'Walk 10,000 total steps', 'steps', 10000, 2, 'walking_10k.png', '2026-05-07 04:57:16', 1),
(2, '50K Lifetime Steps', 'Walk 50,000 total steps', 'steps', 50000, 4, 'walking_50k.png', '2026-05-07 04:57:16', 1),
(3, '100K Lifetime Steps', 'Walk 100,000 total steps', 'steps', 100000, 6, 'walking_100k.png', '2026-05-07 04:57:16', 1),
(4, '250K Lifetime Steps', 'Walk 250,000 total steps', 'steps', 250000, 10, 'walking_250k.png', '2026-05-07 04:57:16', 1),
(5, '500K Lifetime Steps', 'Walk 500,000 total steps', 'steps', 500000, 15, 'walking_500k.png', '2026-05-07 04:57:16', 1),
(6, '1M Lifetime Steps', 'Walk 1,000,000 total steps', 'steps', 1000000, 20, 'walking_1m.png', '2026-05-07 04:57:16', 1),
(7, '2M Lifetime Steps', 'Walk 2,000,000 total steps', 'steps', 2000000, 30, 'walking_2m.png', '2026-05-07 04:57:16', 1),
(8, '5M Lifetime Steps', 'Walk 5,000,000 total steps', 'steps', 5000000, 40, 'walking_5m.png', '2026-05-07 04:57:16', 1),
(9, '10M Lifetime Steps', 'Walk 10,000,000 total steps', 'steps', 10000000, 60, 'walking_10m.png', '2026-05-07 04:57:16', 1),
(10, '25M Lifetime Steps', 'Walk 25,000,000 total steps', 'steps', 25000000, 100, 'walking_25m.png', '2026-05-07 04:57:16', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fitness_achievements`
--
ALTER TABLE `fitness_achievements`
  ADD PRIMARY KEY (`achievement_id`),
  ADD KEY `fk_achievement_group` (`group_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fitness_achievements`
--
ALTER TABLE `fitness_achievements`
  MODIFY `achievement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `fitness_achievements`
--
ALTER TABLE `fitness_achievements`
  ADD CONSTRAINT `fk_achievement_group` FOREIGN KEY (`group_id`) REFERENCES `fitness_achievement_groups` (`group_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
