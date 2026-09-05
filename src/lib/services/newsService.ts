import { supabase } from '../supabase';
import { generateDistributedId } from '../security/distributedId';

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  content: string;
  description: string;
  author: string;
  thumbnail: string;
  source: string;
  category?: string;
  region: 'iraq' | 'arab' | 'global';
  topic: string;
}

type ProxyDef = { url: string; isJson: boolean };
const PROXY_LIST: ProxyDef[] = [
  // Fast resilient CORS proxies
  { url: 'https://api.allorigins.win/raw?url=', isJson: false },
  { url: 'https://corsproxy.io/?url=', isJson: false },
  { url: 'https://api.codetabs.com/v1/proxy?quest=', isJson: false },
  { url: 'https://api.allorigins.win/get?url=', isJson: true },
];

// Fetch with short timeout (4.5 seconds)
async function fetchWithTimeout(url: string, timeoutMs = 4500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const newsService = {
  proxyImage(url: string): string {
    if (!url) return '';
    if (url.includes('telesco.pe') || url.includes('telegram.org') || url.includes('cdn4.telegram') || url.includes('cdn.telegram')) {
      return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    }
    return url;
  },

  proxies: PROXY_LIST.map(p => p.url),

  async fetchWithFallback(url: string): Promise<string> {
    // 1. Check positive cache first (10 min expiry)
    const cacheKey = `news_cache_v7_${url}`;
    const failCacheKey = `news_fail_v7_${url}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 10 * 60 * 1000) return data;
      } catch { /* ignore corrupt cache */ }
    }

    // 2. Check failure cache (1.5 min expiry)
    const failed = localStorage.getItem(failCacheKey);
    if (failed) {
      const failTime = parseInt(failed, 10);
      if (Date.now() - failTime < 90 * 1000) {
        throw new Error('URL recently failed; using short failure cache');
      }
    }

    // 3. Fast Parallel Proxy Race
    const fetchSingleProxy = async (proxy: ProxyDef): Promise<string> => {
      const proxyUrl = proxy.url + encodeURIComponent(url);
      const response = await fetchWithTimeout(proxyUrl, 4500);

      if (!response.ok) throw new Error(`Proxy status ${response.status}`);

      let text = '';
      if (proxy.isJson) {
        const json = await response.json();
        text = json?.contents || '';
      } else {
        text = await response.text();
      }

      if (text && text.length > 80) return text;
      throw new Error('Empty payload');
    };

    try {
      const text = await Promise.any(PROXY_LIST.map(p => fetchSingleProxy(p)));
      localStorage.setItem(cacheKey, JSON.stringify({ data: text, timestamp: Date.now() }));
      localStorage.removeItem(failCacheKey);
      return text;
    } catch {
      localStorage.setItem(failCacheKey, Date.now().toString());
      throw new Error('All proxies failed');
    }
  },

  async fetchRSS(url: string, sourceName: string): Promise<NewsItem[]> {
    if (url.includes('telegram_scraper:')) {
      const username = url.split(':')[1];
      return this.scrapeTelegram(username, sourceName);
    }
    try {
      const xml = await this.fetchWithFallback(url);
      return this.parseXML(xml, sourceName);
    } catch (error) {
      console.warn(`[newsService] Skipping feed ${sourceName}`);
      return [];
    }
  },

  async scrapeTelegram(username: string, sourceName: string): Promise<NewsItem[]> {
    const cleanUser = username.replace(/^@/, '').trim();
    // 1. Try HTML scraping of public channel preview
    const webUrl = `https://t.me/s/${cleanUser}`;
    try {
      const html = await this.fetchWithFallback(webUrl);
      if (html && html.includes('tgme_widget_message')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const messages = Array.from(doc.querySelectorAll('.tgme_widget_message_wrap')).slice(-15);

        if (messages.length > 0) {
          return messages.map((msg, idx) => {
            const textEl = msg.querySelector('.tgme_widget_message_text');
            const photoEl = msg.querySelector('.tgme_widget_message_photo_wrap') as HTMLElement;
            const dateEl = msg.querySelector('.tgme_widget_message_date time') as HTMLTimeElement;
            const linkEl = msg.querySelector('.tgme_widget_message_date') as HTMLAnchorElement;

            const content = this.cleanText(textEl?.innerHTML || '');
            const rawTitle = textEl?.textContent?.split('\n').filter(t => t.trim().length > 0)[0] || 'فرصة وظيفية وإعلان جديد';
            const title = rawTitle.slice(0, 100).trim();

            let thumbnail = '';
            if (photoEl) {
              const style = photoEl.getAttribute('style') || '';
              const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
              if (match) {
                thumbnail = this.proxyImage(match[1]);
              }
            }

            return {
              id: generateDistributedId(`tg-${cleanUser}-${idx}`),
              title: this.cleanText(title),
              link: linkEl?.href || `https://t.me/${cleanUser}`,
              pubDate: dateEl?.dateTime || new Date().toISOString(),
              content: content || title,
              description: content || title,
              author: `@${cleanUser}`,
              thumbnail: thumbnail,
              source: sourceName,
              region: 'iraq' as const,
              topic: 'وظائف'
            };
          }).filter(m => m.content.length > 5).reverse();
        }
      }
    } catch (_) {
      // Continue to RSS bridge fallback
    }

    // 2. Fallback: Telegram RSS bridge
    try {
      const rssBridgeUrl = `https://tg.i-c-a.su/rss/${cleanUser}`;
      const xml = await this.fetchWithFallback(rssBridgeUrl);
      const items = this.parseXML(xml, sourceName);
      if (items.length > 0) return items;
    } catch (_) {}

    return [];
  },

  cleanText(html: string): string {
    if (!html) return '';
    let cleaned = html.replace(/\r/g, '').replace(/<p[^>]*>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n');
    cleaned = cleaned.replace(/<[^>]*>?/gm, ' ');
    cleaned = cleaned.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');
    return cleaned.trim();
  },

  parseXML(xml: string, source: string): NewsItem[] {
    try {
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const items = Array.from(doc.querySelectorAll('item, entry')).slice(0, 15);
      return items.map(el => {
        const get = (tag: string) => el.querySelector(tag)?.textContent?.trim() || '';
        const rawContent = get('description') || get('content') || get('summary') || '';
        const link = get('link') || el.querySelector('link')?.getAttribute('href') || '#';
        const title = this.cleanText(get('title'));

        return {
          id: get('guid') || get('id') || link || Math.random().toString(),
          title: title || 'خبر جديد',
          link: link,
          pubDate: get('pubDate') || get('updated') || get('published') || new Date().toISOString(),
          content: this.cleanText(rawContent),
          description: this.cleanText(rawContent),
          author: source,
          thumbnail: this.proxyImage(el.querySelector('enclosure')?.getAttribute('url') ||
                     this.extractFirstImage(rawContent) || ''),
          source: source,
          region: 'iraq' as const,
          topic: 'أخبار'
        };
      }).filter(i => i.title !== 'خبر جديد');
    } catch { return []; }
  },

  extractFirstImage(html: string): string | null {
    if (!html) return null;
    const match = html.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : null;
  },

  getTelegramRssUrl(username: string): string {
    return `telegram_scraper:${username}`;
  },

  getDefaultSources() {
    return [
      { name: 'الوسيط (وظائف)', url: this.getTelegramRssUrl('Keko4444') },
      { name: 'أحمد إنج (وظائف)', url: this.getTelegramRssUrl('engahmad88') },
      { name: 'وظائف العراق والمحافظات', url: this.getTelegramRssUrl('iraqjobs_1') },
    ];
  }
};

