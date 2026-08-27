# HOWL — 项目上下文

> 本文件整合了 `Yayosu` / `howl59` 两个历史会话中的决策，供后续会话直接读取。
> 产品需求见 [howl.md](howl.md)（PRD），本文件记录的是**已经拍板的决策和当前实现状态**。

## 一句话

全球限定发售与抽选的**资讯聚合站**：结构化倒计时 + 海淘门槛指南 + 实时推送。日本↔欧美/中国双向。

## 名字的由来（已定，勿再改）

Yayosu → （候选 Gentei / Sente / Tipoff）→ **HOWL** → HOWL59 → **HOWL**（最终）。

- 选 HOWL 的理由：四字母、怪物气质、且"嚎叫"本身就是**狼群里最先传出去的那个信号**，与推送产品同构。品牌语 **You'll hear it first.**
- 数字后缀 59 已废弃（无含义、口头传播读法分叉）。全项目引用、localStorage key(`howl-theme`)、文件夹名均已回到 `howl`。
- VIP 档位命名预留：**HOWL Pack**（狼群）。
- Logo：一个点向外发射两道弧的信号标记，见 [Header.tsx](src/components/Header.tsx)。

## 三条关键决策

**1. 我们不代抽、不代付款 —— 这是产品边界，也是合规基线。**
用户在 HOWL 看倒计时，点按钮跳转到 Nike / Pokémon Center / END. 官网**自己**完成抽选和付款。
因此 PRD 模块三里的"自动化填单/抽选工具"**已被砍掉**（违反 SNKRS/Supreme ToS，美国 CFAA、日本不正アクセス禁止法暴露面，且 Stripe 会封抢购 bot 类目商户号）。
若将来一定要做，只能做成**浏览器扩展的本地自动填充**（用户自己的浏览器/账号/触发，数据不出本机）。
页脚固定挂免责声明，四语种齐全。

**2. VIP 卖点重新定位为「比别人早知道 + 知道怎么买」**，不是"帮你抢"：
- 时间差：免费用户开售前 1 小时提醒，VIP 提前 24 小时 + 截止前 10 分钟兜底
- 通道差：免费 Web Push / 邮件，VIP Discord / Telegram 秒推
- 内容差：免费只看 🟢🟡🔴 三色难度，VIP 看完整攻略（转运路线、关税估算、Billing Address 怎么填、日本 SMS 那关怎么过）
- 个人关注列表、日历导出 iCal / Google Calendar

**3. 技术栈：Cloudflare 全家桶，但采集层不放 Cloudflare。**
Vite + React Router v7（**必须 SSR/SSG**，80% 流量来自 `travis scott raffle date` 这类长尾搜索词）+ D1 + R2 + Queues + KV + 自建后台 CMS。
- 语言走 **URL 前缀**（`/zh-CN/drop/xxx`）而非前端 state，每个语种独立可索引，切 SSR 时不返工
- 汇率由 Worker cron 每小时刷进 KV（现在是写死常量）
- 秒级定时：Cron Trigger 最细 1 分钟，需要秒级用 **Durable Object Alarm** 自轮询
- ⚠️ **Workers 抓不动目标站**：SNKRS / PCO / POP MART / END. 全在 Akamai / PerimeterX 后面，Workers 出口是数据中心 IP + 固定 JA3，秒 403。采集层必须是自建 VPS（东京 + 法兰克福）+ 住宅代理 + Playwright/curl-impersonate，结果 POST 回 Workers 入库。这是 P2 的事。
- 冷启动靠 **爬虫 + 运营后台人工补录 + 用户投稿** 三路并行，所以 CMS 第一期就要做

## 当前实现状态（纯前端原型，无后端/无数据库/无 loader）

`npm run dev` 可看，`npm run build` 通过（约 103KB gzip JS）。数据全在 [mock.ts](src/data/mock.ts)，21 件商品覆盖 6 品类 5 地区，8 件现货。

三层路由：
- `/:locale` — 门户页 [PortalPage.tsx](src/pages/PortalPage.tsx)：只有 6 个品类瓷砖，每块显示追踪数/进行中数（有进行中才亮绿点）/现货数
- `/:locale/c/:category` — 品类页 [CategoryPage.tsx](src/pages/CategoryPage.tsx)：地区/形式/难度三组筛选**默认折叠**成一条横条，只有「● 只看现货」常驻
- `/:locale/drop/:slug` — 详情页 [ItemPage.tsx](src/pages/ItemPage.tsx)：多渠道聚合、每渠道标注直邮/外卡/具体坑、难度拆解、关税、转运路线、右侧吸顶倒计时卡

核心模块：
- [types.ts](src/lib/types.ts) — `Drop` / `Channel` 结构**已按将来的 D1 表设计**，基本可直接翻译成两张表
- [schedule.ts](src/lib/schedule.ts) — 四相状态机 `upcoming → open → in-stock → ended`，`sortWeight` 保证"最紧急的永远在最上面"；`bestOffer` 跨币种折算成 JPY 比出最低现货价和对定价的溢价率（可为负）
- [i18n.ts](src/lib/i18n.ts) — EN / JA / zh-CN / zh-TW 全站字符串 + 商品名分语种。切语言自动跟切默认币种（ja→JPY, zh-CN→CNY, en→USD），用户手动改过之后不再自动覆盖
- [format.ts](src/lib/format.ts) — JPY / USD / EUR / CNY，汇率暂为常量
- [theme.ts](src/lib/theme.ts) + [index.css](src/index.css) — 黑白天切换

## 约定

- **主题用 CSS 变量整套换，不写 `dark:` 变体**。浅色是基准调色板，`[data-theme="dark"]` 覆盖同一批变量，组件不用改就跟着变。[index.html](index.html) 里有首屏前脚本，刷新不闪。
- 有两处**特意不跟随主题**：门户页品类瓷砖、详情页商品图区，白天模式下仍是深色渐变——那是将来商品实拍图的占位，图片本来就不随主题变色。
- `--color-accent-fg`：荧光绿做**填充**在两种主题都能用，但当**文字色**时白底看不清，所以文字用深橄榄绿。
- 原型里不用远程图片，卡片用 `art: { from, to, glyph }` 渐变占位。

## 路线图

- **P0（2–3 周）**：Vite + RRv7 SSR + D1 + 后台 CMS，先 EN/JA 两语种，数据全人工录入，只上潮鞋 + TCG 两品类。验证有没有人看、SEO 起不起量。
- **P1（+3 周）**：Web Push + Discord Bot、Friction Index、Affiliate 深链（**Buyee / AmiAmi / StockX 的联盟号要提前申请，审核要时间**）。
- **P2**：独立 VPS 采集层 + DO 秒级 restock 监控 + Stripe 订阅（日本用户建议加 Paddle 或 KOMOJU 覆盖便利店/PayPay）。

成本：P0 约 $5/月（Workers Paid）；P2 约 $150–400/月，主要是住宅代理流量费。

## 待办（历史会话遗留）

- git 仓库**还没有任何 commit**
- 域名与 handle 未占：`howl.app` / `gethowl.com` / `howldrops.com` / `howl.gg`，以及 Discord / X / Instagram 的 `howl`（Discord 自定义邀请链接先到先得且不可赎回）
- 未定：卡片信息密度是否加码、要不要真正的月历网格视图、首页要不要加"未来 48 小时横向时间轴"
