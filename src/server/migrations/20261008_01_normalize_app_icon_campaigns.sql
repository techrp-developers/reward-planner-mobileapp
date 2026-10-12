-- Normalize festival app icon scheduling columns and seed catalog keys.
-- Schedule timestamps are stored in UTC DATETIME(3). API callers must send ISO 8601 timestamps with a timezone.

DELIMITER $$

CREATE PROCEDURE normalize_app_icon_campaigns()
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'app_icon_campaigns' AND column_name = 'start_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'app_icon_campaigns' AND column_name = 'starts_at'
  ) THEN
    ALTER TABLE app_icon_campaigns CHANGE COLUMN start_at starts_at DATETIME(3) NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'app_icon_campaigns' AND column_name = 'end_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'app_icon_campaigns' AND column_name = 'ends_at'
  ) THEN
    ALTER TABLE app_icon_campaigns CHANGE COLUMN end_at ends_at DATETIME(3) NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'app_icon_campaigns' AND column_name = 'enabled'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'app_icon_campaigns' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE app_icon_campaigns CHANGE COLUMN enabled is_active TINYINT(1) NOT NULL DEFAULT 1;
  END IF;
END$$

DELIMITER ;

CALL normalize_app_icon_campaigns();
DROP PROCEDURE normalize_app_icon_campaigns;

ALTER TABLE app_icon_campaigns
  MODIFY COLUMN platform ENUM('ios', 'android') NOT NULL,
  MODIFY COLUMN icon_key ENUM(
    'default', 'diwali', 'eid', 'christmas', 'holi', 'independence_day', 'navratri', 'dasera'
  ) NOT NULL,
  MODIFY COLUMN starts_at DATETIME(3) NOT NULL,
  MODIFY COLUMN ends_at DATETIME(3) NOT NULL,
  MODIFY COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;

DELIMITER $$

CREATE PROCEDURE recreate_app_icon_resolution_index()
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'app_icon_campaigns' AND index_name = 'idx_app_icon_resolution'
  ) THEN
    ALTER TABLE app_icon_campaigns DROP INDEX idx_app_icon_resolution;
  END IF;
END$$

DELIMITER ;

CALL recreate_app_icon_resolution_index();
DROP PROCEDURE recreate_app_icon_resolution_index;

ALTER TABLE app_icon_campaigns
  ADD INDEX idx_app_icon_resolution (platform, is_active, starts_at, ends_at, priority);

CREATE TABLE IF NOT EXISTS app_icon_catalog (
  icon_key ENUM('default', 'diwali', 'eid', 'christmas', 'holi', 'independence_day', 'navratri', 'dasera') NOT NULL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE app_icon_catalog
  MODIFY COLUMN icon_key ENUM('default', 'diwali', 'eid', 'christmas', 'holi', 'independence_day', 'navratri', 'dasera') NOT NULL;

INSERT INTO app_icon_catalog (icon_key)
SELECT 'navratri'
WHERE NOT EXISTS (SELECT 1 FROM app_icon_catalog WHERE icon_key = 'navratri');

INSERT INTO app_icon_catalog (icon_key)
SELECT 'dasera'
WHERE NOT EXISTS (SELECT 1 FROM app_icon_catalog WHERE icon_key = 'dasera');
