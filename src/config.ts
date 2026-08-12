import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "勇敢DBA不怕困难",
	subtitle: "数据库运维实战笔记",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 345, // QZone 怀旧粉；备选 25(暖橙) / 200(青) / 250(蓝)
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: false,
		src: "assets/images/demo-banner.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the original artwork or artist
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "说说",
			url: "/talks/", // 说说墙
		},
		{
			name: "留言板",
			url: "/guestbook/", // giscus 留言板
		},
		{
			name: "小游戏",
			url: "/games/", // 种菜等小游戏
		},
		{
			name: "OBCP刷题",
			url: "/quiz/", // OBCP 认证刷题 654 题
		},
		{
			name: "GitHub",
			url: "https://github.com/649082922",
			external: true,
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/demo-avatar.png", // 先用 fuwari 默认头像，后续替换成自己的
	name: "勇敢DBA不怕困难",
	bio: "数据库 DBA，专注 OceanBase / Oracle / MySQL 等数据库的运维、调优与排障。公众号「勇敢DBA不怕困难」分享真实生产案例。",
	signature: "不积跬步，无以至千里。",
	visitors: { today: 36, total: 20245 },
	bgm: { src: "/assets/bgm.mp3", title: "城里的月光" },
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github", // Visit https://icones.js.org/ for icon codes
			url: "https://github.com/649082922",
		},
		{
			name: "Email",
			icon: "fa6-solid:envelope",
			url: "mailto:649082922@qq.com",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
