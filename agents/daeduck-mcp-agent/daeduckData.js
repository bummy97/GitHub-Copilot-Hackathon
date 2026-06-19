import { XMLParser } from 'fast-xml-parser';

const STOCK_CODE = '353200';
const STOCK_SYMBOL = `${STOCK_CODE}.KS`;
const DART_CORP_CODE = '01326380';
const NEWS_RSS_URL = 'https://news.google.com/rss/search?q=%EB%8C%80%EB%8D%95%EC%A0%84%EC%9E%90&hl=ko&gl=KR&ceid=KR:ko';
const KRX_JSON_URL = `https://query1.finance.yahoo.com/v8/finance/chart/${STOCK_SYMBOL}?range=5d&interval=1d`;

function pickFirst(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return null;
}

function extractImgFromHtml(html) {
  if (!html || typeof html !== 'string') return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? normalizeImageUrl(match[1]) : null;
}

function extractThumbnail(item) {
  const mediaContent = pickFirst(item?.['media:content']);
  const mediaThumb = pickFirst(item?.['media:thumbnail']);
  const enclosure = pickFirst(item?.enclosure);

  const candidates = [
    mediaContent?.['@_url'],
    mediaContent?.url,
    mediaThumb?.['@_url'],
    mediaThumb?.url,
    enclosure?.['@_url'],
    enclosure?.url,
    extractImgFromHtml(item?.description),
    extractImgFromHtml(item?.['content:encoded'])
  ];

  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate);
    if (normalized) return normalized;
  }

  return null;
}

function extractMetaImageFromHtml(html) {
  if (!html || typeof html !== 'string') return null;

  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const normalized = normalizeImageUrl(match[1]);
      if (normalized) return normalized;
    }
  }

  return null;
}

async function resolveArticleInfo(url) {
  if (!url) return { finalLink: url, thumbnail: null };

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
      }
    });

    const finalLink = response.url || url;
    if (!response.ok) {
      return { finalLink, thumbnail: null };
    }

    const html = await response.text();
    const metaImage = extractMetaImageFromHtml(html);
    return { finalLink, thumbnail: metaImage };
  } catch {
    return { finalLink: url, thumbnail: null };
  }
}

export function getAgentMeta() {
  return {
    company: '대덕전자',
    stockCode: STOCK_CODE,
    stockSymbol: STOCK_SYMBOL,
    dartCorpCode: DART_CORP_CODE
  };
}

export async function fetchDaeduckStock() {
  const response = await fetch(KRX_JSON_URL, {
    headers: {
      'User-Agent': 'daeduck-mcp-agent/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`주가 조회 실패: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta) {
    throw new Error('주가 데이터를 찾을 수 없습니다.');
  }

  const closes = result?.indicators?.quote?.[0]?.close || [];
  const validClose = closes.filter(v => typeof v === 'number');
  const latestClose = validClose.length ? validClose[validClose.length - 1] : Number(meta.regularMarketPrice);

  const previousClose = typeof meta.chartPreviousClose === 'number'
    ? meta.chartPreviousClose
    : typeof meta.previousClose === 'number'
      ? meta.previousClose
      : null;

  const change = (typeof latestClose === 'number' && typeof previousClose === 'number')
    ? latestClose - previousClose
    : null;

  const changePercent = (typeof change === 'number' && typeof previousClose === 'number' && previousClose !== 0)
    ? (change / previousClose) * 100
    : null;

  return {
    symbol: meta.symbol || STOCK_SYMBOL,
    shortName: meta.shortName || '대덕전자',
    currentPrice: latestClose,
    previousClose,
    change,
    changePercent,
    currency: meta.currency || 'KRW',
    marketState: meta.marketState || null,
    marketTime: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : null,
    source: KRX_JSON_URL
  };
}

export async function fetchDaeduckNews(limit = 8) {
  const response = await fetch(NEWS_RSS_URL, {
    headers: {
      'User-Agent': 'daeduck-mcp-agent/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`뉴스 조회 실패: HTTP ${response.status}`);
  }

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: true
  });
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item || [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  const selected = items.slice(0, Math.max(1, limit));

  const mapped = await Promise.all(selected.map(async (item, index) => {
    const rssLink = item?.link || '';
    const rssThumbnail = extractThumbnail(item);

    if (rssThumbnail) {
      return {
        id: index + 1,
        title: item?.title || '제목 없음',
        link: rssLink,
        publishedAt: item?.pubDate || null,
        source: item?.source?.['#text'] || item?.source || 'Google News',
        thumbnail: rssThumbnail
      };
    }

    const resolved = await resolveArticleInfo(rssLink);
    return {
      id: index + 1,
      title: item?.title || '제목 없음',
      link: resolved.finalLink || rssLink,
      publishedAt: item?.pubDate || null,
      source: item?.source?.['#text'] || item?.source || 'Google News',
      thumbnail: resolved.thumbnail
    };
  }));

  return mapped;
}

export function formatStockSummary(stock) {
  const price = typeof stock.currentPrice === 'number' ? stock.currentPrice.toLocaleString('ko-KR') : '-';
  const change = typeof stock.change === 'number' ? stock.change.toFixed(2) : '-';
  const changePct = typeof stock.changePercent === 'number' ? stock.changePercent.toFixed(2) : '-';
  return [
    `종목: ${stock.shortName} (${stock.symbol})`,
    `현재가: ${price} ${stock.currency || ''}`.trim(),
    `전일 대비: ${change} (${changePct}%)`,
    `기준 시각: ${stock.marketTime || 'N/A'}`
  ].join('\n');
}

export function formatNewsSummary(newsItems) {
  if (!newsItems.length) {
    return '수집된 뉴스가 없습니다.';
  }

  return newsItems
    .map(item => `- ${item.title} (${item.source})\n  ${item.link}`)
    .join('\n');
}
