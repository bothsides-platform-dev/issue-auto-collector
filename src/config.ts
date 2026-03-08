import { SiteConfig, SiteName } from './types.js';

export const SITE_CONFIGS: Record<SiteName, SiteConfig> = {
  dcinside: {
    name: 'dcinside',
    listUrl: 'https://gall.dcinside.com/board/lists/?id=dcbest',
    baseUrl: 'https://gall.dcinside.com',
    maxRequestsPerMinute: 15,
  },
  fmkorea: {
    name: 'fmkorea',
    listUrl: 'https://www.fmkorea.com/best',
    baseUrl: 'https://www.fmkorea.com',
    maxRequestsPerMinute: 15,
  },
  ppomppu: {
    name: 'ppomppu',
    listUrl: 'https://www.ppomppu.co.kr/hot.php',
    baseUrl: 'https://www.ppomppu.co.kr',
    maxRequestsPerMinute: 15,
  },
  ruliweb: {
    name: 'ruliweb',
    listUrl: 'https://bbs.ruliweb.com/best',
    baseUrl: 'https://bbs.ruliweb.com',
    maxRequestsPerMinute: 15,
  },
  theqoo: {
    name: 'theqoo',
    listUrl: 'https://theqoo.net/hot',
    baseUrl: 'https://theqoo.net',
    maxRequestsPerMinute: 15,
  },
  instiz: {
    name: 'instiz',
    listUrl: 'https://www.instiz.net/',
    baseUrl: 'https://www.instiz.net',
    maxRequestsPerMinute: 15,
  },
};

export const MAX_CONCURRENCY = 1;
export const MAX_RETRIES = 2;
export const SEEN_POSTS_MAX = 10000;
