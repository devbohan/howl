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

`npm run dev` 可看，`npm run build` 通过（约 118KB gzip JS）。

三层路由：
- `/:locale` — 门户页 [PortalPage.tsx](src/pages/PortalPage.tsx)：一行一个品类的扁平列表，**无图标无装饰**。每行右侧三列等宽数字：`追踪数` / `● 进行中` / `● 现货`，零值压暗但不隐藏（隐藏会让列错位、没法竖着比）。顶部 hero 的同名三项同时充当这三列的图例。
- `/:locale/c/:category` — 品类页 [CategoryPage.tsx](src/pages/CategoryPage.tsx)：横幅 → **快讯 + 开箱视频两块滚动面板** → 筛选栏 → 分组卡片列表。地区/形式/难度三组筛选**默认折叠**，只有「● 只看现货」常驻。
- `/:locale/drop/:slug` — 详情页 [ItemPage.tsx](src/pages/ItemPage.tsx)：多渠道聚合、每渠道标注直邮/外卡/具体坑、难度拆解、关税、转运路线、**开箱与媒体报道**、右侧吸顶倒计时卡

核心模块：
- [types.ts](src/lib/types.ts) — `Drop` / `Channel` 结构**已按将来的 D1 表设计**，基本可直接翻译成两张表。另有 `MediaLink`（外部内容）、`NewsItem`（快讯）、`Heat`（热度信号）
- [schedule.ts](src/lib/schedule.ts) — 四相状态机 `upcoming → open → in-stock → ended`，`sortWeight` 保证"最紧急的永远在最上面"；`bestOffer` 跨币种折算成 JPY 比出最低现货价和对定价的溢价率（可为负）
- [feed.ts](src/lib/feed.ts) — 两块滚动面板共用的排序：`rankFeed()` 按热度排序并截断，`MAX_FEED_ITEMS = 50`
- [useRefresh.ts](src/lib/useRefresh.ts) — 30 分钟刷新周期，**这就是将来接 CMS fetch 的位置**
- [i18n.ts](src/lib/i18n.ts) — EN / JA / zh-CN / zh-TW 全站字符串 + 内容分语种。切语言自动跟切默认币种（ja→JPY, zh-CN→CNY, en→USD），用户手动改过之后不再自动覆盖
- [format.ts](src/lib/format.ts) — JPY / USD / EUR / CNY（汇率暂为常量）+ `formatRelative` 相对时间
- [theme.ts](src/lib/theme.ts) + [index.css](src/index.css) — 黑白天切换

### 滚动面板（品类页顶部）

两块并排、窄屏堆叠，都固定 144px 高：

- **快讯** [NewsTicker.tsx](src/components/NewsTicker.tsx) — 分五类各有配色：`已确认`(绿) / `补货`(荧光绿) / `传闻`(黄) / `剧透`(红) / `开奖`(灰)。有对应商品的深链到详情页。
- **开箱视频** [CreatorFeed.tsx](src/components/CreatorFeed.tsx) — 品类级的传媒人/媒体，和详情页那份 `drop.media`**层级不同**：这里是"值得长期关注的频道"，那里是"这一件商品的开箱"。

共用 [VerticalMarquee.tsx](src/components/VerticalMarquee.tsx)：

- **上下滚动，用 `scrollTop` 驱动而不是 CSS transform**。这样面板是真正的滚动容器，有可用的滚动条，滚轮/拖拽/键盘随时能接管。位移量存浮点累加器再赋给 `scrollTop`——直接加小数会因取整而卡住。
- 列表渲染两遍，第二份 `aria-hidden`，滚过一半重置实现无缝循环。
- 鼠标移入暂停，暂停期间累加器反向同步到用户滚到的位置，移出后原地续跑。
- `prefers-reduced-motion` 下不滚动**且只渲染一份**（能手动滚时留着克隆会读到两遍）。
- 上下渐隐是绝对定位遮罩，右侧留 8px 避开滚动条；用 `mask-image` 会把滚动条一起淡掉。

### 热度排序（[feed.ts](src/lib/feed.ts)）

两块面板都按 `rankFeed()` 排序，**最多 50 条**：

```
score = 0.6 · norm(log1p(站内热度)) + 0.4 · norm(log1p(站外热度))
        + 0.35（urgent 突发） + 0.2（featured 编辑推荐）
```

- **站内权重高于站外**：200 个 HOWL 用户点开的链接，比一条百万播放但观众根本不打算买的视频更该排前面。
- 两个信号都是长尾分布，所以比的是对数；再按当前列表的最大值归一化，避免"几百次点击"和"几百万播放"两个量级互相淹没。
- `urgent` 从硬置顶改成大幅加权——突发通常仍会领先，但热度足够高的条目可以超车。
- 只有最热的前 2–3 条挂 🔥，其余靠顺序表达；悬停显示站内/站外原始数字。

### 刷新节奏

[useRefresh.ts](src/lib/useRefresh.ts) 每 **30 分钟**一个刷新点，面板头部显示「更新于 X 分钟前」。除定时外，**标签页从后台切回且数据已过期时立即刷新**——浏览器会节流后台标签的定时器，只靠 interval 的话隔夜的标签页会一直显示昨天的内容。

> ⚠️ 原型里这个周期只是**接口就位**：mock 数据在模块加载时生成，刷新不会真的产生新内容。真实版本在这里发 CMS 请求。

## ⚠️ 占位数据说明

以下三处是**占位内容，不能当真**，真实版本必须逐条人工采集或接 API：

| 文件 | 内容 | 占位方式 |
| :--- | :--- | :--- |
| [mock.ts](src/data/mock.ts) 的 `media` | 21 件商品中 12 件的开箱链接 | 创作者 handle 是编的，URL 指向平台搜索页 |
| [news.ts](src/data/news.ts) | 22 条品类快讯 | 事件虚构（机制真实：SNKRS DAN 15 分钟、LivePocket SMS 限制等） |
| [creators.ts](src/data/creators.ts) | 25 条品类级传媒人 | 同上，另外 `heat` 数值也是生成的 |

**不要用真实 KOL 的名字去配虚构的视频标题**——那等于替真人捏造内容。占位一律用明显虚构的 handle。

## 约定

- **主题用 CSS 变量整套换，不写 `dark:` 变体**。浅色是基准调色板，`[data-theme="dark"]` 覆盖同一批变量，组件不用改就跟着变。[index.html](index.html) 里有首屏前脚本，刷新不闪。
- **圆角统一在 `@theme` 里覆盖 Tailwind 的 `--radius-*` 令牌**，比默认小一档（`rounded-xl` 12px→8px、`rounded-2xl` 16px→10px、`rounded` 4px→3px）。不要在组件里逐个改类名。
- 详情页商品图区**特意不跟随主题**，白天模式下仍是深色渐变——那是将来商品实拍图的占位，图片本来就不随主题变色。（门户页原来也是这样，简化后已改为扁平卡片。）
- `--color-accent-fg`：荧光绿做**填充**在两种主题都能用，但当**文字色**时白底看不清，所以文字用深橄榄绿。
- 原型里不用远程图片：商品卡用 `art: { from, to, glyph }` 渐变占位，平台标识用纯文字（`PLATFORM_LABEL`），省掉加载和商标授权两件事。
- 外部内容的标题是**多语字段**：`en` 存英文释义、`ja` 存原标题。视频原标题不翻译，但跨境用户需要看懂讲的是什么。
- 内容语言标签**只在与当前站点语言不同时才显示**，否则每行都挂一个标签是纯噪音。

## 测试

四层，全部可在本地跑：`npm run test:all`（typecheck → 单元 + 覆盖率 → E2E）。

| 命令 | 内容 |
| :--- | :--- |
| `npm run typecheck` | 应用/测试/工具三套 tsconfig 分别检查 |
| `npm test` | Vitest 213 个单元与组件测试 |
| `npm run test:coverage` | 同上 + 覆盖率，阈值 80%（当前 97% 语句 / 91% 分支） |
| `npm run test:e2e` | Playwright 110 个用例，chromium + Pixel 5 两套 |
| `npm run test:e2e:ui` | Playwright UI 模式，调试用 |
| `npm run storybook` | Storybook 9，组件工作台 |

**为什么这么分层**：单元测试盯纯逻辑和组件契约，E2E 盯真实浏览器里才会暴露的东西（布局溢出、CSS 变量主题、滚动容器、首屏无闪烁、axe 无障碍）。两边不重复覆盖同一件事。

### 关键约定

- **E2E 跑的是生产构建**（`npm run build && vite preview`），不是 dev server —— 只在构建产物里才出现的问题必须被拦住。
- `vite preview` 默认只绑 IPv6，配置里显式加了 `--host 127.0.0.1`。
- **Playwright 1.62 的 `reducedMotion` fixture 不生效**（`test.use({ reducedMotion })` 和 project 级都试过，页面里 `matchMedia` 仍是 false）。[motion.spec.ts](e2e/motion.spec.ts) 改用 `page.emulateMedia()`，并在 `beforeEach` 里断言这个偏好确实生效——否则测试会因为"根本没开启"而假绿。
- **单元测试不碰 `mock.ts` 的时间**：那份数据在模块加载时用 `Date.now()` 生成，逻辑测试一律自己造 fixture（[src/test/fixtures.ts](src/test/fixtures.ts)）。
- jsdom 没有 `matchMedia`、`scrollTo`、`requestAnimationFrame` 的可用实现，统一在 [src/test/setup.ts](src/test/setup.ts) 里打桩；`preferReducedMotion()` / `preferDarkScheme()` 供单测按需切换。
- 组件测试统一走 [src/test/render.tsx](src/test/render.tsx) 的 `renderApp()`，它挂的是和 App 一样的 provider 栈。
- **内容也有测试**：[content.test.ts](src/data/__tests__/content.test.ts) 校验 slug 唯一、时间线自洽、快讯只深链到存在的商品、四语种无缺漏、只有视频才有时长等 23 条不变式。加数据时先看它。
- **`data-stat` / `data-testid` 是测试锚点**，不要当成可随意改的样式类删掉。

### 这套测试当场发现并已修掉的真实缺陷

1. **门户页在 320px 宽度横向溢出**——行是 grid item，默认 `min-width: auto`，固定宽度的统计列把整行撑破。修复：行加 `min-w-0`。
2. **手机上完全没有语言切换入口**——语言按钮组是 `hidden sm:flex`，一个四语种跨境站在手机上被锁死在单一语言。修复：`< sm` 时降级成 `<select>`。
3. **Logo 链接在手机上没有可访问名称**——文字 `hidden sm:flex`，只剩 `aria-hidden` 的 SVG。修复：`aria-label="HOWL"`。
4. **滚动面板的克隆副本可被键盘 Tab 进入**——`aria-hidden` 挡不住焦点，键盘用户会走两遍相同的行。修复：加 `inert`。
5. **配色不满足 WCAG AA**——`faint` 在浅色下只有 2.94:1，`easy`/`medium`/`hard` 在自身 10% 底色上也不足 4.5:1。修复：重算 `--color-faint / easy / medium / hard`，并把所有半透明文字（`text-faint/80` 之类）换成实色 token。这也是为什么这几个色值不是整数——它们是算到刚好过线的。
6. **相对时间会显示「60s ago」「60m ago」**——先取整再选单位导致。修复：取整后若达到单位上限就进位。
7. **`prefers-reduced-motion` 下滚动面板会先动一帧**——原来在 effect 里读偏好。修复：改为 `useState` 惰性初始化同步读取。

## 路线图

- **P0（2–3 周）**：Vite + RRv7 SSR + D1 + 后台 CMS，先 EN/JA 两语种，数据全人工录入，只上潮鞋 + TCG 两品类。验证有没有人看、SEO 起不起量。
- **P1（+3 周）**：Web Push + Discord Bot、Friction Index、Affiliate 深链（**Buyee / AmiAmi / StockX 的联盟号要提前申请，审核要时间**）。
- **P2**：独立 VPS 采集层 + DO 秒级 restock 监控 + Stripe 订阅（日本用户建议加 Paddle 或 KOMOJU 覆盖便利店/PayPay）。

成本：P0 约 $5/月（Workers Paid）；P2 约 $150–400/月，主要是住宅代理流量费。

## 待办

- 域名与 handle 未占：`howl.app` / `gethowl.com` / `howldrops.com` / `howl.gg`，以及 Discord / X / Instagram 的 `howl`（Discord 自定义邀请链接先到先得且不可赎回）
- 三处占位数据（见上表）需要真实来源；快讯与视频流理想状态是接各平台 API 自动刷新
- E2E 目前只跑 chromium 与 Pixel 5；firefox / webkit 需要 `npx playwright install` 后在 [playwright.config.ts](playwright.config.ts) 里加 project
- 视觉回归（截图对比）尚未接入
- 未定：卡片信息密度是否加码、要不要真正的月历网格视图、首页要不要加"未来 48 小时横向时间轴"
