-- Replaces the fabricated percentage-split hourly chart with real (if
-- approximate) data: each sync's new steps (stepDiff) get attributed to the
-- server-hour the sync happened in, accumulating across the day. Not exact
-- (a sync at 2pm covering steps walked since 11am all lands in the 2pm
-- bucket), but it's real proportional data instead of a fixed shape that
-- looks identical for every user every day.

CREATE TABLE IF NOT EXISTS fitness_hourly_steps (
  user_id    INT NOT NULL,
  step_date  DATE NOT NULL,
  hour       TINYINT NOT NULL, -- 0-23, server-local
  steps      INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, step_date, hour)
);
