import {
	createClient,
	type SupabaseClient,
	type User,
} from "@supabase/supabase-js";

export const GAME_SAVES = {
	farm: { label: "种菜", storageKey: "warm_farm_save_v2" },
	xiuxian: { label: "放置修仙", storageKey: "xiuxian_save_v2" },
	parking: { label: "抢车位", storageKey: "parking_neon_v1" },
} as const;

export type GameId = keyof typeof GAME_SAVES;

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isCloudConfigured = Boolean(supabaseUrl && supabaseKey);

function createCloudClient(): SupabaseClient | null {
	if (!supabaseUrl || !supabaseKey) return null;
	return createClient(supabaseUrl, supabaseKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true,
		},
	});
}

export const supabase = createCloudClient();

/**
 * 本地恢复登录用户；token 已过期或 30 秒内临期时，同步等待一次续期再返回。
 * 否则首屏会拿着过期 token 去查云端数据（首次失败、刷新后才正常）。
 * 续期失败（网络断/refresh token 失效）时保留本地会话，交给后续查询的错误处理兜底。
 */
export async function getFreshUser(
	client: SupabaseClient,
): Promise<User | null> {
	const { data } = await client.auth.getSession();
	const session = data.session;
	if (!session) return null;
	const expiresAt = (session.expires_at ?? 0) * 1000;
	if (expiresAt > Date.now() + 30_000) return session.user;
	const refreshed = await client.auth.refreshSession().catch(() => null);
	return refreshed?.data.session?.user ?? session.user;
}

export function collectLocalSaves(): Record<string, unknown> {
	const payload: Record<string, unknown> = {};
	for (const [gameId, game] of Object.entries(GAME_SAVES)) {
		const raw = localStorage.getItem(game.storageKey);
		if (!raw) continue;
		try {
			payload[gameId] = JSON.parse(raw);
		} catch {
			payload[gameId] = raw;
		}
	}
	return payload;
}

export function restoreLocalSaves(payload: Record<string, unknown>): number {
	let restored = 0;
	for (const [gameId, game] of Object.entries(GAME_SAVES)) {
		if (!(gameId in payload)) continue;
		localStorage.setItem(game.storageKey, JSON.stringify(payload[gameId]));
		restored += 1;
	}
	return restored;
}

export async function writeAudit(
	user: User,
	eventType: "login" | "logout" | "save_upload" | "save_restore",
	metadata: Record<string, unknown> = {},
) {
	if (!supabase) return;
	await supabase.from("site_audit_logs").insert({
		user_id: user.id,
		event_type: eventType,
		page_path: window.location.pathname,
		metadata: {
			...metadata,
			provider: user.app_metadata.provider ?? null,
		},
	});
}

export async function uploadCloudSave(user: User) {
	if (!supabase) throw new Error("云存档尚未配置");
	const saves = collectLocalSaves();
	const { error } = await supabase.from("game_saves").upsert({
		user_id: user.id,
		payload: saves,
		updated_at: new Date().toISOString(),
	});
	if (error) throw error;
	await writeAudit(user, "save_upload", { games: Object.keys(saves) });
	return Object.keys(saves).length;
}

export async function restoreCloudSave(user: User) {
	if (!supabase) throw new Error("云存档尚未配置");
	const { data, error } = await supabase
		.from("game_saves")
		.select("payload, updated_at")
		.eq("user_id", user.id)
		.maybeSingle();
	if (error) throw error;
	if (!data) return { restored: 0, updatedAt: null };
	const restored = restoreLocalSaves(data.payload as Record<string, unknown>);
	await writeAudit(user, "save_restore", { games: restored });
	return { restored, updatedAt: data.updated_at as string };
}
