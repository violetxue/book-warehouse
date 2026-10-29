import type { Config } from 'tailwindcss';

// 独立部署版：不再依赖 @lark-apaas/fullstack-presets 的 Tailwind 预设。
// 视觉主题（护眼淡绿）已在 client/src/tailwind-theme.css 中通过 @theme 固化，
// Tailwind v4 支持任意数值的 spacing 工具类（如 h-124、size-22.5），无需额外扩展 spacing。
export default {
  content: ['./client/src/**/*.{ts,tsx,css}'],
  plugins: [],
} satisfies Config;
