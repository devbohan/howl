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

## 品牌与视觉语言

**字标**：[Logo.tsx](src/components/Logo.tsx) —— 手绘横幅（左右出尖、上下两条长边内凹）里手写 `howl`。整个标记是 `currentColor` 描边的内联 SVG，所以**跟着文字颜色走、自动适配黑白天**，没有双色资源也没有远程文件。刻意保留了原稿的不对称（左尖比右尖高、上边下沉幅度大于下边上凸）—— 修正成几何对称就变成剪贴画了。

- 头部 `h-4.5`，`sm` 以上 `h-6`（18 / 24px）。再往下走 `howl` 就读不出来了，只剩横幅轮廓
- VIP 横幅右上角用同一个标记做 6% 透明度的水印，不再借用 ⚡️
- [favicon.svg](public/favicon.svg) 只用外框剪影 + 加粗描边：16px 下里面的字写不清，轮廓还认得出；内嵌 `prefers-color-scheme` 查询跟随浏览器主题

**颜色只表达状态，品牌本身不花颜色**：

| 令牌 | 浅色 / 深色 | 用途 |
| :--- | :--- | :--- |
| `accent` / `accent-fg` | `#101317` / `#f1f3f6` | 品牌填充与强调，**黑白** |
| `live` / `live-fg` | `#bdeb00` / `#ccff33` | **唯一保留荧光绿的状态**：正在抽选中 |
| `easy` / `medium` / `hard` | 绿 / 琥珀 / 红 | 海淘难度与库存状态 |

原来那套荧光绿被当成品牌色用在按钮、筛选芯片、悬停边框、VIP CTA 上，现在全部换成黑白；绿色只留给「进行中」，以及难度/库存这些本来就是状态的地方。

**界面里不出现 emoji**。品类图标、地区旗帜、难度圆点、🔥、🔔、☀️/🌙、卡片上的大 emoji 占位图全部移除，改成 [icons.tsx](src/components/icons.tsx) 里同一套单线 SVG（统一描边宽度、圆端点、只用 `currentColor`）。理由：emoji 在每个平台渲染都不一样，而且永远和手绘字标对不上。**[a11y.spec.ts](e2e/a11y.spec.ts) 有一条测试会在任何页面出现 emoji 时失败**，[i18n.test.ts](src/lib/__tests__/i18n.test.ts) 也会拦住混进文案里的 emoji。

商品卡与详情页的图片位现在是**纯渐变块**（`art: { from, to }`），emoji 占位已删，`glyph` 字段一并从类型和数据里移除。

## 约定

- **主题用 CSS 变量整套换，不写 `dark:` 变体**。浅色是基准调色板，`[data-theme="dark"]` 覆盖同一批变量，组件不用改就跟着变。[index.html](index.html) 里有首屏前脚本，刷新不闪。
- **圆角统一在 `@theme` 里覆盖 Tailwind 的 `--radius-*` 令牌**，比默认小一档（`rounded-xl` 12px→8px、`rounded-2xl` 16px→10px、`rounded` 4px→3px）。不要在组件里逐个改类名。
- 商品图区与品类横幅**特意不跟随主题**，白天模式下仍是深色渐变——那是将来商品实拍图的占位，图片本来就不随主题变色。（门户页原来也是这样，简化后已改为扁平卡片。）
- `--color-live-fg`：荧光绿做**填充**在两种主题都能用，但当**文字色**时白底看不清，所以浅色主题下文字用深橄榄绿。
- **门户标题和正文同号（12px）**，靠 `.shimmer` 的扫光取代字号来获得存在感。三个实现要点：`w-fit` 让渐变盒子贴合文字（否则光带大半时间扫在空白列上）；`background-size: 600%` 让光带每个周期只有约 1/4 时间在字上，读起来是脉冲而不是持续晃动；用 `-webkit-text-fill-color: transparent` 而不是 `color: transparent`，这样 computed color 仍是真实前景色，axe 才量得出对比度。`prefers-reduced-motion` 下动画与渐变一并关掉。
- 原型里不用远程图片：商品卡用 `art: { from, to }` 渐变占位，平台标识用纯文字（`PLATFORM_LABEL`），省掉加载和商标授权两件事。
- 外部内容的标题是**多语字段**：`en` 存英文释义、`ja` 存原标题。视频原标题不翻译，但跨境用户需要看懂讲的是什么。
- 内容语言标签**只在与当前站点语言不同时才显示**，否则每行都挂一个标签是纯噪音。

## SEO / GEO

**产品前提**：这个站 80% 的流量来自 `travis scott raffle date` 这类长尾搜索，而且**页面只在截止前有价值**——所以内容必须在爬虫第一次抓取时就是完整的，不能等渲染队列。

### 预渲染（不是 SSR）

`npm run build:static` = `vite build` + [scripts/prerender.mjs](scripts/prerender.mjs)：用 Playwright 把 sitemap 里的**每一条 URL 渲染成静态 HTML**（113 页）+ 85 张分享卡。

- **为什么不是 SSR**：应用是纯客户端的，数据在模块加载时用 `Date.now()` 生成，hydrate 必然 mismatch。所以用 `createRoot` 让 React 在快照上重新渲染一遍——标记一样，用户看不出来，但爬虫拿到的是完整 HTML。等 CMS 和 D1 落地再按 P0 计划迁 SSR。
- **输出扁平 `<route>.html` 而不是 `<route>/index.html`**：静态主机和 `vite preview` 都能把无扩展名 URL 解析到 `.html`，而目录形式只在带尾斜杠时才解析。这个坑是 E2E 抓到的。
- 快照会**剥掉 `data-theme`**：那是首屏脚本按渲染机器的偏好写的，留着会把每个静态页面钉死在一个主题上。
- 路由列表来自构建产物里的 sitemap，所以两者不可能对不上。

### 爬虫面

| 文件 | 生成方式 |
| :--- | :--- |
| `sitemap.xml` | 索引式，拆成 `sitemap-pages.xml` / `sitemap-drops.xml`——商品页每小时变，品类页几乎不动，爬虫按 sitemap 分配预算 |
| `robots.txt` | **显式 Allow GPTBot / ClaudeBot / PerplexityBot / Google-Extended 等**，见下 |
| `llms.txt` | 用 markdown 告诉答案引擎这个站是什么、每类页面有什么 |
| `{locale}/feed.xml` | 四个语种各一个 RSS —— 阅读器和聚合器比爬虫更早拿到新条目 |
| `og.png` + `og/drop/{slug}-{locale}.png` | 每个商品每个语种一张分享卡，用字标绘制 |

`<lastmod>` 按商品状态给：已结束的钉在截止时间，进行中的用构建时间——否则每次重建都会让爬虫重抓整个归档。

### 每页元数据

[seo.ts](src/lib/seo.ts) 生成 title / description / canonical / hreflang / JSON-LD，[useHead.ts](src/lib/useHead.ts) 负责写进 DOM（没有引 helmet 类库——只有三种页面，几十行 `setAttribute` 就够，而且预渲染读的就是 DOM）。

- **标题按视觉宽度截断，不是字符数**。搜索结果是按像素裁的，一个 CJK 字宽约等于两个拉丁字母，所以 `visualWidth()` 把 CJK 记 2 列。商品名过长时**截的是商品名，不是模板**，保证品牌和站名不会被挤出可见区。
- JSON-LD：商品页 `Product` + 每个渠道一个 `Offer`（含 `availability`、`priceValidUntil`）+ `BreadcrumbList`；品类页 `CollectionPage` + `ItemList`；门户 `WebSite`。
- `availability` 必须与渠道实际库存一致，有测试逐条校验——对结构化数据撒谎会被 Google 降权。
- **域名已定：`howl.tokyo`**。`SITE_URL` 默认值同时写在 [seo.ts](src/lib/seo.ts)、[vite.config.ts](vite.config.ts)、[prerender.mjs](scripts/prerender.mjs) 三处——三个阶段互相无法 import，改要一起改，否则同一次构建里会出现两个 origin。预览/staging 部署用 `VITE_SITE_URL` 覆盖，别让它们对爬虫宣称生产域名。

### 测试

[crawler.spec.ts](e2e/crawler.spec.ts) **整个文件在 `javaScriptEnabled: false` 下运行**，断言的就是不执行 JS 的答案引擎实际收到的东西。预渲染一旦坏掉，这些测试会失败，而不是站点悄悄消失。

### 对标 uptodate.tokyo（2026-08-27 实测）

| | uptodate.tokyo | HOWL |
| :--- | :--- | :--- |
| 完整 HTML | ✅ WordPress SSR | ✅ 预渲染 |
| canonical | ❌ **没有** | ✅ |
| hreflang | ❌ 单语 | ✅ 4 语互指 + x-default |
| JSON-LD | ❌ **0 块** | ✅ Product / Offer / CollectionPage / BreadcrumbList |
| llms.txt | ❌ 404 | ✅ |
| AI 爬虫策略 | ❌ 未声明 | ✅ 显式 Allow |
| sitemap | ✅ 索引式 + lastmod | ✅ 索引式 + lastmod + hreflang |
| RSS | ✅ | ✅ 四语种各一 |
| 分享卡 | 站点级一张 | 每商品每语种一张 |
| **首页可见文字量** | **34,511 字符** | **约 500 字符** ⚠️ |

技术层面已经全面领先，但**最后一行是真实差距且不是技术问题**：他们首页有三万多字可索引文本，我们门户页按要求做得极简。品类页和商品页文字量正常，门户页要不要加内容是产品决定。

## 测试

四层，全部可在本地跑：`npm run test:all`（typecheck → 单元 + 覆盖率 → E2E）。

| 命令 | 内容 |
| :--- | :--- |
| `npm run typecheck` | 应用/测试/工具三套 tsconfig 分别检查 |
| `npm test` | Vitest 235 个单元与组件测试 |
| `npm run test:coverage` | 同上 + 覆盖率，阈值 80%（当前 97% 语句 / 91% 分支） |
| `npm run test:e2e` | Playwright 142 个用例，chromium + Pixel 5 两套（含关掉 JS 的爬虫视角） |
| `npm run test:e2e:ui` | Playwright UI 模式，调试用 |
| `npm run storybook` | Storybook 9，组件工作台 |

**为什么这么分层**：单元测试盯纯逻辑和组件契约，E2E 盯真实浏览器里才会暴露的东西（布局溢出、CSS 变量主题、滚动容器、首屏无闪烁、axe 无障碍）。两边不重复覆盖同一件事。

### 关键约定

- **E2E 跑的是完整静态产物**（`npm run build:static && vite preview`），不是 dev server —— 只在构建产物或预渲染里才出现的问题必须被拦住。
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

成本：P0 约 $5/月（Workers Paid）；P2 约 $180–450/月，其中住宅代理占 $150–400，是唯一会失控的一项。

**完整成本模型见 [COST.md](COST.md)**（分阶段明细、住宅代理的敏感度分析、以及下面这两条悬崖的推导）。

### ⚠️ 预渲染的两条成本悬崖（实测，不是估算）

当前 21 件商品：`npm run build:static` **58.7 秒**（113 页 + 85 张分享卡），产物 7.2MB（其中分享卡 3.6MB）。

1. **构建时长随商品数线性增长**：200 件约 7 分钟，500 件约 17 分钟。**Cloudflare Pages 免费版构建超时 20 分钟**——大约 500 件商品时预渲染方案失效。
2. **构建次数**：[useRefresh.ts](src/lib/useRefresh.ts) 定的是 30 分钟刷新一次。静态站刷新数据＝重新构建，每月 1,440 次，而免费额度是 **500 次/月**。

这两条合起来就是**必须迁 SSR 的量化触发条件**，不需要凭感觉判断。在那之前，把重建频率降到每天几次、或只对变动的商品做增量预渲染，都能拖一段时间。

## 待办

- **域名（2026-08-27 用 RDAP 实测，早期会话里「howl.net 没被占有」的说法是错的）**：

  | 域名 | 状态 |
  | :--- | :--- |
  | `howl.net` | ❌ 已注册（1998-06-22），GoDaddy，停放在 Domains.com 待售 |
  | `howl.com` / `howl.app` / `howl.gg` / `howl.ink` / `howl.wtf` / `howl.fyi` | ❌ 均已注册 |
  | `howl.xyz` | ❌ 已注册（2020-05-25），NS 指向 `afternic.com` → 挂牌待售 |
  | `howls.xyz` | ❌ 已注册，停放在 Atom |
  | `gethowl.com` / `howlhq.com` | ❌ 已注册（域名投资商停放） |
  | **`howl.tokyo`** | ✅ **可注册（RDAP 404）— 已选定为正式域名** |
  | `howl.day` / `howldrops.com` / `howlraffle.com` / `gohowl.xyz` / `howldrop.xyz` | ✅ 可注册 |

  四字母域名在主流后缀基本全被占，能拿的只有新 gTLD 或加词。`howl.tokyo` 是其中唯一「整个域名都在表意」的选项，但它把品牌锚定在日本，和「外对日」那半边业务略有出入。
- Discord / X / Instagram 的 `howl` handle 未占（Discord 自定义邀请链接先到先得且不可赎回）
- 三处占位数据（见上表）需要真实来源；快讯与视频流理想状态是接各平台 API 自动刷新
- E2E 目前只跑 chromium 与 Pixel 5；firefox / webkit 需要 `npx playwright install` 后在 [playwright.config.ts](playwright.config.ts) 里加 project
- 视觉回归（截图对比）尚未接入
- **门户页可索引文字太少**（约 500 字符 vs 竞品三万），是目前最大的 SEO 短板
- **`howl.tokyo` 尚未实际注册** —— 代码已全面切过去，域名本身还得去买（RDAP 查过可注册）
- Google Search Console / Bing 站长验证、GA4 埋点尚未接入
- 品类横幅与商品卡的渐变仍是彩色（品类各一套色）——它们是实拍图的占位，等真图上线就会被替换；若希望在那之前整站彻底黑白，把 `CATEGORY_ART` 改成中性灰阶即可
- 未定：卡片信息密度是否加码、要不要真正的月历网格视图、首页要不要加"未来 48 小时横向时间轴"
