import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/game-cloud";

export type QuizType = "single" | "multiple" | "judge";
export type QuizQuestion = { q: string; options: string[]; answer: string };
export type QuizBank = Record<QuizType, QuizQuestion[]>;

export type CloudQuizBank = {
	id: string;
	name: string;
	ownerName: string;
	isPublic: boolean;
	bank: QuizBank;
	updatedAt: string;
};

export type QuizBankMeta = {
	id: string;
	name: string;
	ownerName: string;
	isPublic: boolean;
	hasPassword: boolean;
	updatedAt: string;
};

// Supabase 的 PostgrestError/AuthError 是普通对象而非 Error 实例，
// 直接 throw 会让调用方的 error instanceof Error 判断失效、真实信息被吞成“未知错误”。
// 统一包装成 Error，并保留 code / hint 供上层识别会话失效等场景。
function toCloudError(error: unknown): Error {
	if (error instanceof Error) return error;
	const detail = error as {
		message?: string;
		code?: string;
		hint?: string | null;
		details?: string | null;
	};
	const parts = [detail?.message, detail?.code, detail?.hint].filter(Boolean);
	const enriched = new Error(parts.join(" / ") || "未知错误") as Error & {
		code?: string;
		hint?: string | null;
	};
	enriched.code = detail?.code;
	enriched.hint = detail?.hint ?? null;
	return enriched;
}

function requireClient() {
	if (!supabase) throw new Error("云同步尚未配置");
	return supabase;
}

function toMeta(row: {
	id: string;
	name: string;
	owner_name: string | null;
	is_public: boolean | null;
	password_hash?: string | null;
	updated_at: string;
}): QuizBankMeta {
	return {
		id: row.id,
		name: row.name,
		ownerName: row.owner_name ?? "",
		isPublic: Boolean(row.is_public),
		hasPassword: row.password_hash != null,
		updatedAt: row.updated_at,
	};
}

/** 迁移 20261120120000 未执行时，查询带密码列/视图会报错，按旧 schema 回退。 */
function isMissingPasswordSchema(error: unknown): boolean {
	const code = (error as { code?: string })?.code;
	return code === "42703" /* undefined_column */ || code === "PGRST205"; /* schemaCacheMiss */
}

/** 登录者自己的全部题库（按更新时间倒序）。 */
export async function listMyQuizBanks(user: User): Promise<QuizBankMeta[]> {
	const client = requireClient();
	const { data, error } = await client
		.from("quiz_banks")
		.select("id, name, owner_name, is_public, password_hash, updated_at")
		.eq("user_id", user.id)
		.order("updated_at", { ascending: false });
	if (error && isMissingPasswordSchema(error)) {
		// 云端还没跑密码迁移：退回无密码列的查询，hasPassword 全部为 false
		const fallback = await client
			.from("quiz_banks")
			.select("id, name, owner_name, is_public, updated_at")
			.eq("user_id", user.id)
			.order("updated_at", { ascending: false });
		if (fallback.error) throw toCloudError(fallback.error);
		return (fallback.data ?? []).map(toMeta);
	}
	if (error) throw toCloudError(error);
	return (data ?? []).map(toMeta);
}

/** 公开题库（任何人可见，未登录 anon 也可读），按更新时间倒序。 */
export async function listPublicQuizBanks(): Promise<QuizBankMeta[]> {
	const client = requireClient();
	// 优先读元数据视图：有密码的公开题库只暴露名字/作者/🔒，不暴露题目内容
	const { data, error } = await client
		.from("quiz_bank_meta")
		.select("id, name, owner_name, has_password, updated_at")
		.order("updated_at", { ascending: false })
		.limit(60);
	if (error && isMissingPasswordSchema(error)) {
		// 云端还没跑密码迁移：按旧 schema 直查表（此时全部公开题库无密码）
		const fallback = await client
			.from("quiz_banks")
			.select("id, name, owner_name, is_public, updated_at")
			.eq("is_public", true)
			.order("updated_at", { ascending: false })
			.limit(60);
		if (fallback.error) throw toCloudError(fallback.error);
		return (fallback.data ?? []).map(toMeta);
	}
	if (error) throw toCloudError(error);
	return (data ?? []).map((row: { id: string; name: string; owner_name: string | null; has_password: boolean | null; updated_at: string }) => ({
		id: row.id,
		name: row.name,
		ownerName: row.owner_name ?? "",
		isPublic: true,
		hasPassword: Boolean(row.has_password),
		updatedAt: row.updated_at,
	}));
}

/** 按 id 取题库全文。RLS 保证只能拿到公开的或自己的；查不到返回 null。 */
export async function fetchQuizBank(id: string): Promise<CloudQuizBank | null> {
	const client = requireClient();
	const { data, error } = await client
		.from("quiz_banks")
		.select("id, name, owner_name, is_public, bank, updated_at")
		.eq("id", id)
		.maybeSingle();
	if (error) throw toCloudError(error);
	if (!data) return null;
	return {
		id: data.id,
		name: data.name,
		ownerName: data.owner_name ?? "",
		isPublic: Boolean(data.is_public),
		bank: data.bank as QuizBank,
		updatedAt: data.updated_at,
	};
}

/** 新建或更新题库。不传 id 时新建；返回行 id。 */
export async function saveQuizBank(
	user: User,
	input: { id?: string; name: string; bank: QuizBank; isPublic?: boolean },
	updatedAt = new Date().toISOString(),
): Promise<string> {
	const client = requireClient();
	const ownerName =
		(user.user_metadata?.user_name as string | undefined) ??
		(user.user_metadata?.preferred_username as string | undefined) ??
		user.email ??
		"";
	const row = {
		user_id: user.id,
		owner_name: ownerName,
		name: input.name,
		bank: input.bank,
		...(input.isPublic === undefined ? {} : { is_public: input.isPublic }),
		updated_at: updatedAt,
	};
	if (input.id) {
		const { data, error } = await client
			.from("quiz_banks")
			.update(row)
			.eq("id", input.id)
			.eq("user_id", user.id)
			.select("id")
			.maybeSingle();
		if (error) throw toCloudError(error);
		// 零行更新（RLS 拒绝/属主不符）不能当成功，否则旧数据被当作已保存
		if (!data) throw new Error("题库不存在或不属于当前账号，未能保存");
		return input.id;
	}
	const { data, error } = await client
		.from("quiz_banks")
		.insert(row)
		.select("id")
		.single();
	if (error || !data) throw toCloudError(error);
	return data.id;
}

/** 仅切换公开/私有（不动题库内容）。 */
export async function setQuizBankPublic(
	user: User,
	id: string,
	isPublic: boolean,
): Promise<void> {
	const client = requireClient();
	// RLS 拒绝时 UPDATE 是"零行受影响 + 无错误"的静默跳过，必须取回行确认真的更新了
	const { data, error } = await client
		.from("quiz_banks")
		.update({ is_public: isPublic, updated_at: new Date().toISOString() })
		.eq("id", id)
		.eq("user_id", user.id)
		.select("id")
		.maybeSingle();
	if (error) throw toCloudError(error);
	if (!data) throw new Error("题库不存在或不属于当前账号，未能更新公开状态");
}

/** 删除自己的一份题库。 */
export async function deleteQuizBank(user: User, id: string): Promise<void> {
	const client = requireClient();
	const { error } = await client
		.from("quiz_banks")
		.delete()
		.eq("id", id)
		.eq("user_id", user.id);
	if (error) throw toCloudError(error);
}

/** 云端密码迁移未执行时统一给出的提示。 */
export const QUIZ_PASSWORD_NOT_READY = "云端尚未启用题库密码：请先在 Supabase 执行 20261120120000_quiz_bank_password.sql 迁移";

/** 凭密码打开（有密码的）公开题库；属主在 RPC 内自动放行。密码错误返回 null。 */
export async function openQuizBankWithPassword(
	id: string,
	password: string,
): Promise<QuizBank | null> {
	const client = requireClient();
	const { data, error } = await client.rpc("open_quiz_bank", {
		p_id: id,
		p_password: password,
	});
	if (error) {
		if ((error as { code?: string }).code === "PGRST202") throw new Error(QUIZ_PASSWORD_NOT_READY);
		throw toCloudError(error);
	}
	const rows = (data ?? []) as { bank?: QuizBank }[];
	return rows[0]?.bank ?? null;
}

/** 属主设置/清除题库密码（password 传空字符串 = 清除）。RPC 内部校验属主。 */
export async function setQuizBankPassword(
	id: string,
	password: string,
): Promise<void> {
	const client = requireClient();
	const { data, error } = await client.rpc("set_quiz_bank_password", {
		p_id: id,
		p_password: password,
	});
	if (error) {
		if ((error as { code?: string }).code === "PGRST202") throw new Error(QUIZ_PASSWORD_NOT_READY);
		throw toCloudError(error);
	}
	if (data !== true) throw new Error("题库不存在或不属于当前账号，未能设置密码");
}
