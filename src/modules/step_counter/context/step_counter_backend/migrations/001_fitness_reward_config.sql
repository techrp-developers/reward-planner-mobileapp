-- Reward economy config: lets goal/streak coin amounts and streak milestones
-- be tuned by editing rows instead of redeploying fitnessService.js.

CREATE TABLE IF NOT EXISTS fitness_reward_config (
  config_key  VARCHAR(50) PRIMARY KEY,
  coins       INT NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fitness_streak_bonus_config (
  streak_days INT PRIMARY KEY,
  coins       INT NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed: "moderate" reward tier (1 coin = ₹1). Daily goal = 5 coins (₹1825/yr
-- per fully-consistent user, vs. ₹18,250/yr under the old hardcoded 50/day).
-- Streak milestones escalate as one-time bonuses at 7/14/30/60/90 days.
INSERT INTO fitness_reward_config (config_key, coins)
VALUES ('goal_daily', 5)
ON DUPLICATE KEY UPDATE coins = 5;

INSERT INTO fitness_streak_bonus_config (streak_days, coins)
VALUES (7, 20), (14, 40), (30, 100), (60, 200), (90, 400)
ON DUPLICATE KEY UPDATE coins = VALUES(coins);

-- To add a new milestone later, e.g. a 180-day bonus of 800 coins:
-- INSERT INTO fitness_streak_bonus_config (streak_days, coins) VALUES (180, 800);
-- To disable a milestone without deleting history: UPDATE fitness_streak_bonus_config SET is_active = 0 WHERE streak_days = 14;
