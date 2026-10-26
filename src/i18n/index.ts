import { ko, type Dict } from './dict/ko';
import { en } from './dict/en';
import { ja } from './dict/ja';
import { zhCN } from './dict/zh-cn';
import { ar } from './dict/ar';
import type { Locale } from './locales';

export { fill, money, num } from './format';
export const DICTS: Record<Locale, Dict> = { ko, en, ja, 'zh-cn': zhCN, ar };
