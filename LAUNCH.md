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

```sql
CREATE TABLE clicks (
  day TEXT NOT NULL, kind TEXT NOT NULL, host TEXT NOT NULL,
  locale TEXT NOT NULL, context TEXT, channel_id TEXT,
  affiliate INTEGER NOT NULL DEFAULT 0, hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, host, locale, context, channel_id)
);
```

验证：点一个商品页的「前往商店」，然后 `GET /api/clicks?days=1` 应该看到一条。
实现见 [functions/api/clicks.ts](functions/api/clicks.ts)。

### [ ] 绑定 `WANTS_DB`（求复刻）

没绑之前，**每一票都在丢**。页面照常显示种子数据，投票在用户本机排队，看起来一切正常——这正是它危险的地方。

```bash
npx wrangler d1 create howl-wants   # 绑定变量名：WANTS_DB
```

```sql
CREATE TABLE wants (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, norm TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, note TEXT,
  count INTEGER NOT NULL DEFAULT 1,
  first_asked_at TEXT NOT NULL, last_asked_at TEXT NOT NULL,
  matched_slug TEXT
);
CREATE TABLE want_votes (
  want_id TEXT NOT NULL, voter TEXT NOT NULL,
  PRIMARY KEY (want_id, voter)
);
```

实现见 [functions/api/wants.ts](functions/api/wants.ts)。

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

**现在站上 21 件商品全是编的，一件真的都没有，也没有任何抓取在跑。**

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

## 🏃 先到先得

### [ ] 注册 `howl.tokyo`

代码已全面指向它（canonical、hreflang、sitemap、OG 图、RSS）。**域名本身还没买。**

### [ ] 占下 handle：Discord / X / Instagram 的 `howl`

**Discord 的自定义邀请链接先到先得且不可赎回**——产品一旦被人看到就抢不回来了。

---

## ⏳ 有审核周期

### [ ] 申请联盟号

Buyee / AmiAmi Global / StockX / END.。免费，但**审核要时间，而且不少联盟要求站点已有流量**——现在申请，等有量时正好能用。

顺序上先申请、后导流：链接位已经建好（`Channel.affiliate` + `rel="sponsored"` + 点击追踪），拿到联盟参数直接换 URL 即可。

---

## 可以晚一点

- [ ] 日本 / 中国的「HOWL」商标
- [ ] 代拍的法务判断（见 [CLAUDE.md](CLAUDE.md) 的边界那节）
- [ ] 卖家自助上架 —— 等出站点击和需求票数都有量了再谈
- [ ] 门户页加可索引内容（目前约 500 字符，是最大的 SEO 短板）

---

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
