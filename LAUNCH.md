# 上线清单

> 按**「以后补不补得回来」**排，不按难易排。
> 做完一项就把 `[ ]` 改成 `[x]`。最后更新：2026-08-28

---

## 🩸 正在流血

**这四项每天都在丢数据，而且丢掉的部分永远拿不回来。** 代码都已就位，缺的是配置。

### [ ] 绑定 `CLICKS_DB`（出站点击）

没绑之前，**每一次点击都在丢**。这是你唯一能拿去跟零售商谈的数字，而它无法追溯补测。

```bash
npx wrangler d1 create howl-clicks
# 把输出的 database_id 填进 Cloudflare Pages → Settings → Functions → D1 bindings
# 变量名必须是 CLICKS_DB
```

建表用仓库里的 [schema.sql](schema.sql)（三个库都执行同一份，重复执行安全）：

```bash
npx wrangler d1 execute howl-clicks --remote --file=schema.sql
```

验证：点一个商品页的「前往商店」，然后 `GET /api/clicks?days=1` 应该看到一条。
实现见 [functions/api/clicks.ts](functions/api/clicks.ts)。

### [ ] 绑定 `WANTS_DB`（求复刻）

没绑之前，**每一票都在丢**。页面照常显示种子数据，投票在用户本机排队，看起来一切正常——这正是它危险的地方。

```bash
npx wrangler d1 create howl-wants   # 绑定变量名：WANTS_DB
```

```bash
npx wrangler d1 execute howl-wants --remote --file=schema.sql
```

实现见 [functions/api/wants.ts](functions/api/wants.ts)。

### [ ] 绑定 `DEMAND_DB`（代购需求计数）

```bash
npx wrangler d1 create howl-demand   # 绑定变量名：DEMAND_DB
```

```bash
npx wrangler d1 execute howl-demand --remote --file=schema.sql
```

只存日期、商品、语种、次数——**没有任何联系方式**，所以这张表里没有可泄露的东西。
`GET /api/proxy-demand` 需要 `ADMIN_PASSWORD`。

### [ ] Google Search Console + Bing 站长验证

**GSC 只从验证之日起累积数据，验证前的搜索表现永久看不到。** 晚一天少一天，而它是判断 SEO 有没有起量的唯一依据。

1. [search.google.com/search-console](https://search.google.com/search-console) 添加 `howl.tokyo`，用 DNS TXT 验证（Cloudflare 里加一条记录即可）
2. 提交 `https://howl.tokyo/sitemap.xml`
3. [Bing 站长工具](https://www.bing.com/webmasters) 可以直接从 GSC 导入
4. 重点看：**四个语种是不是各自被索引**（这是当初 URL 前缀方案的全部意义）

### [ ] 访问分析

现在不装，前几个月的流量曲线永远是空白。

Cloudflare Web Analytics：免费、无 cookie、不需要 GDPR 弹窗。Pages 项目里一键开启，或手动加一行 script。
**别急着上 GA4** —— 它更重、要 cookie 同意、而你现在只需要知道「有没有人来、从哪来」。

---

### [ ] 用真实商品替换 mock 数据

**四份数据集现在全部为空**：商品、快讯、品类视频流、求复刻。之前全是编的，已清除——其中快讯那份最危险，它把虚构声明署名给了真实公司。

跑 `npm run check:launch` 随时确认状态。

⚠️ **虚构数据绝不能上线**：每个商品页都带 `Product` + `Offer` 结构化数据，把编造的价格和日期提交给 Google 是提交虚假结构化数据；而在一个倒计时站上，错的日期会让用户错过抽选然后再也不回来。**上线前先清空 [mock.ts](src/data/mock.ts)。**

最低限度：**10–20 条真实商品**，用 [/admin.html](admin.html) 录。渠道档案先建 5–8 个（难度挂在渠道上，一次搞定终身继承）。

#### 数据源分级（2026-08-28 实测 robots.txt 与实际响应）

| 源 | 实测 | 能不能自动 |
| :--- | :--- | :--- |
| **p-bandai.jp** | robots 允许，`sitemap.xml` 6.3MB HTTP 200 | 🟢 **可以** —— sitemap 本就是给机器读的 |
| **suruga-ya.jp** | `User-agent: * Allow: /`，sitemap 200 | 🟢 **可以**（注意：它明确屏蔽了 ClaudeBot/CCBot 等 AI 爬虫） |
| **hypebeast.com** | `/feed` RSS 200 | 🟢 **可以** —— RSS 是公开发布给机器消费的 |
| **联盟 API**（AmiAmi / Rakuten / Yahoo!ショッピング / StockX） | — | 🟢 **最优** —— 合法、稳定、自带 affiliate 参数 |
| amiami.com 网页 | robots.txt 就 **403** | 🔴 别抓，走它的联盟 API |
| atmos-tokyo.com | **403** | 🔴 别抓 |
| pokemoncenter-online.com | 连不上（**000**） | 🔴 别抓 |
| endclothing.com | robots 限制多，实际有防护 | 🔴 别抓 |

**规则很简单：**

- 🟢 **官方结构化源**（RSS / sitemap / 联盟 API）—— 它们存在的目的就是被机器读，抓它们零风险
- 🟡 **普通网页** —— 先读 robots.txt，遵守它；限速（每几秒一次）；UA 里带真实联系方式
- 🔴 **有机器人防护的**（403 / 连不上）—— **不要绕**。绕过机器人识别属于「规避访问控制」，和当初砍掉自动填单避开的是同一类风险。这些站的信息从它们的官方公告和社交账号拿
- ⚫ **抓不到的** —— Instagram Story、LINE 推送、Discord 公告、店头张贴，以及 **Friction Index 本身**和**日期的最终确认**。这部分永远是人工，也正是护城河

### [ ] 保护后台与经营数据

**已修的两个洞**（代码已就位，缺配置）：

- `robots.txt` 原本写着 `Disallow: /admin.html` —— robots.txt 是每个爬虫读的第一个文件，那等于**主动广播后台地址**。已移除，改用真实鉴权。
- `GET /api/clicks` 原本无鉴权 —— 那是经营数据（哪些零售商拿到多少点击、哪些商品在转化），竞争对手轮询就全知道了。现在需要鉴权。

**你要做的：**

```
Pages → Settings → Environment variables → 新增 ADMIN_PASSWORD
```

**没设 = 后台和点击报表全部返回 503，不是全部开放** —— [_middleware.ts](functions/_middleware.ts) 是 fail closed 的。

更好的方案是在 `/admin.html` 前面加 **Cloudflare Access**（50 用户以内免费）：真 SSO、没有共享密钥躺在环境变量里、还有审计日志。middleware 是 Access 配错时仍然生效的底线。

**⚠️ 关于「防别人爬我」要认清的事**

你不可能同时做到：被 Google 和 AI 答案引擎完整读取（你**全部**的获客策略），以及不被竞争对手抓取。因为爬虫可以伪装成 Googlebot，而你的内容按设计就是静态 HTML + 结构化数据。

**真正有效的是决定什么公开，而不是拦爬虫：**

| 手段 | 有没有用 |
| :--- | :--- |
| 保护后台与 `/api/clicks` | ✅ 真的有用 —— 这些本来就不该公开 |
| Cloudflare WAF 限流（免费版 1 条规则） | ✅ 挡得住随手写的脚本 |
| **埋金丝雀数据** —— 放几条无害但唯一可识别的记录 | ✅ 抄袭时能**举证**（地图行业的「陷阱街道」就是这个原理） |
| 把最深的 Friction Index 攻略放进 VIP | ✅ **最有效** —— 公开的是你想被索引的，值钱的在账号后面 |
| 封 User-Agent | ❌ 一行代码就能伪造 |
| 禁右键 / JS 混淆 | ❌ 无效，且会毁掉 SEO |
| Cloudflare Bot Fight Mode | ⚠️ 会连你想要的 AI 爬虫一起挡 |

另外：**日期和价格是事实，多数法域下事实不受版权保护**；你的**表述**（Friction 说明的具体措辞、编排）才受保护。所以真正抄不走的是判断，不是数据。

### [ ] 装上比价书签

`比价台` 页签里有一个书签，**拖到书签栏**（点它没用，要拖）。

在任何商品页点它 → 商品名、价格、库存、JAN 码自动回到比价台。**它读的是你已经打开的页面，所以不是爬虫** —— SNKRS、Pokémon Center、AmiAmi、atmos 这些封机器人的店照样能用，因为你本来就是个正常访客。

流程：比价台输入商品名 → 「全部打开」开一圈店 → 每页点一下书签 → 价格并排出现，最低价自动标出 → 「挂上并建渠道」。

换了后台地址就重新生成：`ADMIN_URL=https://… npm run build:bookmarklet`

> 价格和库存抓得到，**海淘难度抓不到** —— 「要不要日本手机号」「海外卡能不能付」哪个页面都不会写。那部分永远在「渠道」页人工答，答一次终身继承。

### [ ] 用摄取器拿一批真实线索

```bash
npm run ingest                     # 全部源
npm run ingest -- --only 4gamer    # 单个源
npm run ingest -- --check <url>    # 这个源能不能加
```

产出 `leads.json`，在 [/admin.html](admin.html) 收件箱点「导入线索文件」，重复的自动跳过。

**只抓主动把内容交给机器的源**，源清单在 [scripts/sources.json](scripts/sources.json)。摄取器会：先读 robots.txt 并遵守、请求间隔 1.5 秒、UA 带真实联系方式、**识别到「アクセス制限」这类拒绝页就停止抓该源**。

> p-bandai 已被移除：它的 sitemap 是开放的，但商品页连续请求几次后返回「アクセス制限」。**robots.txt 允许 ≠ 欢迎程序连抓。** 它的限定受注信息改从官方 X 与新闻稿人工获取。

## 🏃 先到先得

### [ ] 注册 `howl.tokyo`

代码已全面指向它（canonical、hreflang、sitemap、OG 图、RSS）。**域名本身还没买。**

### [ ] 占下 handle：Discord / X / Instagram 的 `howl`

**Discord 的自定义邀请链接先到先得且不可赎回**——产品一旦被人看到就抢不回来了。

---

## ⏳ 有审核周期

### [ ] 申请联盟号

Buyee / ZenMarket / FromJapan / AmiAmi Global / StockX / END.。免费，但**审核要时间，而且不少联盟要求站点已有流量**——现在申请，等有量时正好能用。

顺序上先申请、后导流：链接位已经建好（`Channel.affiliate` + `rel="sponsored"` + 点击追踪），拿到联盟参数填进 [proxies.ts](src/lib/proxies.ts) 的 `affiliateParam` 即可，链接结构不用改。

**代购的联盟优先申请** —— 那是全站转化意图最强的一批点击（用户刚读到「买不了」就点了「谁能帮我买」）。

---

## 可以晚一点

- [ ] 日本 / 中国的「HOWL」商标
- [ ] 代拍的法务判断（见 [CLAUDE.md](CLAUDE.md) 的边界那节）
- [ ] 卖家自助上架 —— 等出站点击和需求票数都有量了再谈
- [ ] 门户页加可索引内容（目前约 500 字符，是最大的 SEO 短板）

---

## 本地把后端跑一遍

静态页面用 `vite preview` 就够，但 **Pages Functions 和那些 SQL 只有 wrangler 才会真的执行**。上线前至少跑一次：

```bash
npm run build:static     # 产物
npm run db:local         # 在本地 D1 建表（用的是同一份 schema.sql）
npm run dev:api          # → http://localhost:8788，带 Functions 和 D1
```

带上密码启动才能看报表：

```bash
npx wrangler pages dev --port 8788 --binding ADMIN_PASSWORD=你的密码
```

该看到的结果：

| 请求 | 期望 |
| :--- | :--- |
| `GET /admin.html` 无密码 | **401** |
| `GET /api/clicks` 无密码 | **401** |
| `GET /api/proxy-demand` 无密码 | **401** |
| `POST /api/clicks`（任何人） | `{"recorded":1}` |
| `POST /api/wants` 同一商品的不同写法 | 同一个 `id`，`counted:false` |
| `POST /api/clicks` 坏 JSON | **400**，不是 500 |
| `GET /api/clicks` 带密码 | 按渠道分组的报表，`byKind` 里 `proxy` 与 `store` 分开 |

> ⚠️ **Functions 没有自动化测试** —— 单元测试跑在 jsdom 里，碰不到 D1。这一节的手动检查是它们唯一的验证途径，改动 `functions/` 下的任何东西之后都要重跑一次。

## 常做的事

```bash
npm run build:static   # 构建 + 预渲染 113 页 + 85 张分享卡
npm run test:all       # typecheck + 单元 + 覆盖率 + E2E
npm run dev            # 开发；后台在 /admin.html
```

改域名：

```bash
VITE_SITE_URL=https://howl.tokyo npm run build:static
```

> ⚠️ `SITE_URL` 的默认值同时写在 [seo.ts](src/lib/seo.ts)、[vite.config.ts](vite.config.ts)、
> [prerender.mjs](scripts/prerender.mjs) 三处，改要一起改。

## 相关文档

| | |
| :--- | :--- |
| [CLAUDE.md](CLAUDE.md) | 决策、架构、约定、测试 |
| [COST.md](COST.md) | 分阶段成本与收入模型，两条架构悬崖 |
| [howl.md](howl.md) | 原始 PRD（部分内容已被后续决策取代） |
