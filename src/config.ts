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
		hue: 18, // 克制的暖红，接近纸张批注和 DBA 告警色
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
		{
			name: "实战笔记",
			url: "/archive/",
		},
		{
			name: "软件&脚本",
			url: "/scripts/", // 精选脚本
		},
		{
			name: "小游戏",
			url: "/games/", // 种菜等小游戏
		},
		{
			name: "题库",
			url: "/quiz-library/", // 先选题库，再进入答题
		},
		LinkPreset.About,
		{
			name: "GitHub",
			url: "https://github.com/649082922",
			external: true,
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/demo-avatar.jpg", // AI 超分高清头像
	name: "勇敢DBA不怕困难",
	bio: "一线数据库运维、调优与排障记录。主攻 OceanBase / Oracle / MySQL。",
	signature: "先定位，再动手。",
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
