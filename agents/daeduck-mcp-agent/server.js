import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fetchDaeduckNews,
  fetchDaeduckStock,
  formatNewsSummary,
  formatStockSummary,
  getAgentMeta
} from './daeduckData.js';

const app = express();
const port = process.env.PORT || 5600;
const meta = getAgentMeta();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.static(publicDir));

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, agent: 'daeduck-mcp-agent' });
});

app.get('/api/stock', async (_req, res) => {
  try {
    const stock = await fetchDaeduckStock();
    res.json({ company: meta.company, stock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit || 8);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 8;
    const news = await fetchDaeduckNews(limit);
    res.json({ company: meta.company, count: news.length, news });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/briefing', async (req, res) => {
  const rawLimit = Number(req.query.limit || 5);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 10) : 5;

  const [stockResult, newsResult] = await Promise.allSettled([
    fetchDaeduckStock(),
    fetchDaeduckNews(limit)
  ]);

  const stock = stockResult.status === 'fulfilled' ? stockResult.value : null;
  const news = newsResult.status === 'fulfilled' ? newsResult.value : [];

  if (!stock && news.length === 0) {
    res.status(500).json({ message: '주가/뉴스 데이터를 모두 가져오지 못했습니다.' });
    return;
  }

  const summaryText = [
    '[주가]',
    stock ? formatStockSummary(stock) : '주가 데이터를 불러오지 못했습니다.',
    '',
    '[뉴스]',
    news.length ? formatNewsSummary(news) : '뉴스 데이터를 불러오지 못했습니다.'
  ].join('\n');

  res.json({
    company: meta.company,
    summaryText,
    stock,
    news,
    warnings: {
      stockError: stockResult.status === 'rejected' ? stockResult.reason?.message || '주가 조회 실패' : null,
      newsError: newsResult.status === 'rejected' ? newsResult.reason?.message || '뉴스 조회 실패' : null
    }
  });
});

app.get('/chat', (_req, res) => {
  res.sendFile(path.join(publicDir, 'chat.html'));
});

// ── MCP 툴 기반 채팅 엔드포인트 ──────────────────────────────────────────
const INTENTS = {
  stock:    /주가|시세|가격|주식|코스피|등락|상승|하락|고가|저가|시총/,
  news:     /뉴스|기사|언론|보도|소식|헤드라인|최신|새로운/,
  briefing: /업황|브리핑|요약|현황|동향|상황|전반|종합|정리|알려줘|알려주세요|어때|어떤가/,
  help:     /다른 건|뭘 알려|뭐 알려|무엇을|기능|할 수 있|가능|소개|지원|어떤 것|무슨/ 
};

function detectIntent(msg) {
  const m = msg.toLowerCase();
  const isHelp = (
    m.includes('브리핑 말고') ||
    m.includes('다른 건') ||
    m.includes('뭘 알려') ||
    m.includes('뭐 알려') ||
    m.includes('무엇을') ||
    m.includes('기능') ||
    m.includes('할 수 있') ||
    m.includes('가능') ||
    m.includes('소개') ||
    m.includes('지원') ||
    m.includes('어떤 것') ||
    m.includes('무슨')
  );
  if (isHelp) return 'help';
  const isStock = INTENTS.stock.test(m);
  const isNews  = INTENTS.news.test(m);
  if (isStock && !isNews) return 'stock';
  if (isNews  && !isStock) return 'news';
  return 'briefing';
}

function buildHelpReply() {
  return [
    '🧭 **대덕전자 업황 확인 Agent가 알려줄 수 있는 것**',
    '',
    '1. **주가 조회**: 현재가, 전일 대비, 변동률',
    '2. **최신 뉴스**: 대덕전자 관련 기사 목록',
    '3. **업황 브리핑**: 주가 + 뉴스를 묶은 종합 요약',
    '',
    '예시 질문',
    '- 오늘 주가 어때?',
    '- 최신 뉴스만 보여줘',
    '- 업황 요약해줘',
    '- 브리핑 말고 다른 건 뭐 알려줄 수 있어?'
  ].join('\n');
}

function buildStockReply(stock) {
  if (!stock) return '주가 데이터를 가져오지 못했습니다.';
  const price  = typeof stock.currentPrice  === 'number' ? stock.currentPrice.toLocaleString('ko-KR')  : '-';
  const change = typeof stock.change        === 'number' ? Math.abs(stock.change).toLocaleString('ko-KR') : '-';
  const pct    = typeof stock.changePercent === 'number' ? Math.abs(stock.changePercent).toFixed(2)     : '-';
  const dir    = Number(stock.change) > 0 ? '▲' : Number(stock.change) < 0 ? '▼' : '─';
  const time   = stock.marketTime ? new Date(stock.marketTime).toLocaleString('ko-KR') : '-';
  return [
    `📈 **대덕전자(${stock.symbol}) 주가 현황**`,
    '',
    `현재가: **${price} ${stock.currency}**`,
    `전일 대비: ${dir} ${change} (${pct}%)`,
    `기준 시각: ${time}`
  ].join('\n');
}

function buildNewsReply(news) {
  if (!news.length) return '수집된 뉴스가 없습니다.';
  const items = news.slice(0, 5).map((n, i) => {
    const date = n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('ko-KR') : '-';
    return `${i + 1}. **${n.title}**\n   출처: ${n.source} · ${date}\n   🔗 ${n.link}`;
  }).join('\n\n');
  return `📰 **대덕전자 최신 뉴스 (${news.length}건)**\n\n${items}`;
}

function buildBriefingReply(stock, news) {
  return `📊 **대덕전자 업황 브리핑**\n\n${buildStockReply(stock)}\n\n---\n\n${buildNewsReply(news)}`;
}

app.post('/api/chat', async (req, res) => {
  const message = (req.body?.message || '').trim();
  if (!message) { res.status(400).json({ error: '메시지를 입력해주세요.' }); return; }

  const normalized = message.replace(/\s+/g, ' ').toLowerCase();
  const isCapabilityQuestion = (
    normalized.includes('말고') ||
    normalized.includes('다른 건') ||
    (normalized.includes('다른') && normalized.includes('알려')) ||
    normalized.includes('기능') ||
    normalized.includes('뭐 있어') ||
    normalized.includes('뭘 할 수') ||
    normalized.includes('무엇을')
  );

    if (isCapabilityQuestion) {
      res.json({ intent: 'help', reply: buildHelpReply(), debug: { normalized, isCapabilityQuestion } });
    return;
  }

  const intent = detectIntent(message);
  try {
    if (intent === 'help') {
      res.json({ intent, reply: buildHelpReply() });
    } else if (intent === 'stock') {
      const stock = await fetchDaeduckStock();
        res.json({ intent, reply: buildStockReply(stock), debug: { normalized, isCapabilityQuestion } });
    } else if (intent === 'news') {
      const news = await fetchDaeduckNews(5);
        res.json({ intent, reply: buildNewsReply(news), debug: { normalized, isCapabilityQuestion } });
    } else {
      const [sR, nR] = await Promise.allSettled([fetchDaeduckStock(), fetchDaeduckNews(5)]);
      const stock = sR.status === 'fulfilled' ? sR.value : null;
      const news  = nR.status === 'fulfilled' ? nR.value : [];
        res.json({ intent, reply: buildBriefingReply(stock, news), debug: { normalized, isCapabilityQuestion } });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`Daeduck agent server running: http://localhost:${port}`);
});
