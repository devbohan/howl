/**
 * Pre-launch gate. Fails if anything fabricated is still in the datasets.
 *
 * This exists because the failure it guards against already happened once: the
 * news feed shipped invented items attributed to real companies, and the
 * wantlist shipped invented vote counts. Both were labelled as placeholders in
 * the source, which turned out to protect nobody — the label is not what
 * reaches the visitor or the crawler.
 *
 *   npm run check:launch
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DATASETS = [
  ['src/data/mock.ts', 'DROPS', '商品目录'],
  ['src/data/news.ts', 'NEWS', '快讯'],
  ['src/data/creators.ts', 'CATEGORY_MEDIA', '品类视频流'],
  ['src/data/wants.ts', 'WANTS', '求复刻'],
]

/** Wording that means the data was written to look real without being real. */
const SMELLS = [
  [/PLACEHOLDER|占位内容|invented|fabricated|make-believe/i, '文件里仍标着占位/虚构'],
  [/handles are invented|creator handles are invented/i, '虚构的创作者 handle'],
]

let problems = 0
const say = (mark, text) => console.log(`${mark} ${text}`)

for (const [path, name, label] of DATASETS) {
  let source
  try {
    source = await readFile(resolve(path), 'utf8')
  } catch {
    say('✗', `${label}：读不到 ${path}`)
    problems += 1
    continue
  }

  // Rough but adequate: entries are object literals at two-space indent.
  const body = source.slice(source.indexOf(name))
  const entries = (body.match(/^\s{2,4}\{/gm) ?? []).length

  const smell = SMELLS.find(([pattern]) => pattern.test(source))
  if (smell && entries > 0) {
    say('✗', `${label}：${entries} 条，且${smell[1]} —— 上线前必须换成真实数据或清空`)
    problems += 1
  } else if (entries === 0) {
    say('·', `${label}：空（等待录入）`)
  } else {
    say('✓', `${label}：${entries} 条真实数据`)
  }
}

// The site-level origin has to be real before anything is crawled.
const seo = await readFile(resolve('src/lib/seo.ts'), 'utf8')
const origin = seo.match(/VITE_SITE_URL \?\? '([^']+)'/)?.[1]
if (!origin || origin.includes('example')) {
  say('✗', `SITE_URL 看起来不是真实域名：${origin ?? '未找到'}`)
  problems += 1
} else {
  say('✓', `SITE_URL：${origin}`)
}

console.log()
if (problems > 0) {
  console.error(`上线前还有 ${problems} 项要处理。`)
  process.exit(1)
}
console.log('数据检查通过。仍需人工确认的项见 LAUNCH.md。')
