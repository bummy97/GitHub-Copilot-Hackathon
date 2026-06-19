import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  fetchDaeduckNews,
  fetchDaeduckStock,
  formatNewsSummary,
  formatStockSummary,
  getAgentMeta
} from './daeduckData.js';

const meta = getAgentMeta();

const server = new McpServer({
  name: 'daeduck-news-stock-agent',
  version: '1.0.0'
});

server.registerTool(
  'get_daeduck_stock',
  {
    title: '대덕전자 주가 조회',
    description: '대덕전자(353200) 최신 주가 정보를 조회합니다.',
    inputSchema: {}
  },
  async () => {
    const stock = await fetchDaeduckStock();
    return {
      content: [
        {
          type: 'text',
          text: formatStockSummary(stock)
        }
      ],
      structuredContent: stock
    };
  }
);

server.registerTool(
  'get_daeduck_news',
  {
    title: '대덕전자 뉴스 조회',
    description: '대덕전자 관련 최신 뉴스를 RSS 기반으로 조회합니다.',
    inputSchema: {
      limit: z.number().int().min(1).max(20).default(8)
    }
  },
  async ({ limit }) => {
    const items = await fetchDaeduckNews(limit);
    return {
      content: [
        {
          type: 'text',
          text: formatNewsSummary(items)
        }
      ],
      structuredContent: {
        company: meta.company,
        count: items.length,
        items
      }
    };
  }
);

server.registerTool(
  'get_daeduck_briefing',
  {
    title: '대덕전자 통합 브리핑',
    description: '대덕전자 주가와 뉴스를 함께 묶어 브리핑합니다.',
    inputSchema: {
      newsLimit: z.number().int().min(1).max(10).default(5)
    }
  },
  async ({ newsLimit }) => {
    const [stockResult, newsResult] = await Promise.allSettled([
      fetchDaeduckStock(),
      fetchDaeduckNews(newsLimit)
    ]);

    const stock = stockResult.status === 'fulfilled' ? stockResult.value : null;
    const news = newsResult.status === 'fulfilled' ? newsResult.value : [];

    if (!stock && news.length === 0) {
      throw new Error('주가/뉴스 데이터를 모두 가져오지 못했습니다.');
    }

    const text = [
      '[주가]',
      stock ? formatStockSummary(stock) : '주가 데이터를 불러오지 못했습니다.',
      '',
      '[뉴스]',
      news.length ? formatNewsSummary(news) : '뉴스 데이터를 불러오지 못했습니다.'
    ].join('\n');

    return {
      content: [
        {
          type: 'text',
          text
        }
      ],
      structuredContent: {
        company: meta.company,
        stock,
        news,
        warnings: {
          stockError: stockResult.status === 'rejected' ? stockResult.reason?.message || '주가 조회 실패' : null,
          newsError: newsResult.status === 'rejected' ? newsResult.reason?.message || '뉴스 조회 실패' : null
        }
      }
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
