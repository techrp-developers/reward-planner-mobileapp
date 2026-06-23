-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 23, 2026 at 09:55 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `rewardplanners_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `fitness_achievement_groups`
--

CREATE TABLE `fitness_achievement_groups` (
  `group_id` int(11) NOT NULL,
  `group_key` varchar(50) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `fitness_achievement_groups`
--
-- Only `walking` (group_id 1) is kept — see fitness_achievements.sql.
-- `sunrise_strider`, `streak_keeper`, and `trailblazer` had no remaining
-- achievements pointing at them (their milestones were unreachable or
-- superseded by fitness_streak_bonus_config), so the groups themselves
-- are dropped too rather than left as empty sections.

INSERT INTO `fitness_achievement_groups` (`group_id`, `group_key`, `title`, `description`, `icon`, `display_order`, `created_at`) VALUES
(1, 'walking', 'Walking Enthusiast', 'You’ve taken your first step toward a healthier lifestyle!', NULL, 1, '2026-05-06 12:37:09');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fitness_achievement_groups`
--
ALTER TABLE `fitness_achievement_groups`
  ADD PRIMARY KEY (`group_id`),
  ADD UNIQUE KEY `group_key` (`group_key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fitness_achievement_groups`
--
ALTER TABLE `fitness_achievement_groups`
  MODIFY `group_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
