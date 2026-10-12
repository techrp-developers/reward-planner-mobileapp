-- Run after 20261007_01_create_app_icon_campaigns.sql, including on existing installations.
-- New Android artwork keys; the API keeps iOS restricted to its registered icons.
ALTER TABLE app_icon_campaigns
  MODIFY COLUMN icon_key ENUM(
    'default', 'diwali', 'eid', 'christmas', 'holi', 'independence_day', 'navratri', 'dasera'
  ) NOT NULL;
