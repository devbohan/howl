-- HOWL 的全部 D1 表。三个库各建自己那部分即可，重复执行安全。
--
--   npx wrangler d1 execute howl-clicks --remote --file=schema.sql
--   npx wrangler d1 execute howl-wants  --remote --file=schema.sql
--   npx wrangler d1 execute howl-demand --remote --file=schema.sql
--
-- 本地跑（wrangler pages dev 用的是同一份本地库）：把 --remote 换成 --local。

-- ── 出站点击 (CLICKS_DB) ────────────────────────────────────────────────────
-- 按天预聚合，所以表永远很小：一年重度使用是几千行而不是几百万行。
CREATE TABLE IF NOT EXISTS clicks (
  day        TEXT    NOT NULL,
  kind       TEXT    NOT NULL,
  host       TEXT    NOT NULL,
  locale     TEXT    NOT NULL,
  context    TEXT,
  channel_id TEXT,
  affiliate  INTEGER NOT NULL DEFAULT 0,
  hits       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, host, locale, context, channel_id)
);
CREATE INDEX IF NOT EXISTS clicks_by_day ON clicks (day);

-- ── 求复刻 (WANTS_DB) ───────────────────────────────────────────────────────
-- norm 是归一化后的名字，UNIQUE 让「151 UPC」和「151upc 复刻」落到同一条。
CREATE TABLE IF NOT EXISTS wants (
  id             TEXT    PRIMARY KEY,
  name           TEXT    NOT NULL,
  norm           TEXT    NOT NULL UNIQUE,
  category       TEXT    NOT NULL,
  note           TEXT,
  count          INTEGER NOT NULL DEFAULT 1,
  first_asked_at TEXT    NOT NULL,
  last_asked_at  TEXT    NOT NULL,
  matched_slug   TEXT
);
CREATE INDEX IF NOT EXISTS wants_by_count ON wants (count DESC);

-- 一台设备一票。voter 是 IP+UA 的哈希，不存任何能识别到人的东西。
CREATE TABLE IF NOT EXISTS want_votes (
  want_id TEXT NOT NULL,
  voter   TEXT NOT NULL,
  PRIMARY KEY (want_id, voter)
);

-- ── 代购需求计数 (DEMAND_DB) ────────────────────────────────────────────────
-- 只有日期、商品、语种、次数——没有联系方式，所以这张表里没有可泄露的东西。
CREATE TABLE IF NOT EXISTS proxy_demand (
  day    TEXT    NOT NULL,
  slug   TEXT    NOT NULL,
  locale TEXT    NOT NULL,
  hits   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, slug, locale)
);
