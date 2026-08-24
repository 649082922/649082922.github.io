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
	updated_at: string;
}): QuizBankMeta {
	return {
		id: row.id,
		name: row.name,
		ownerName: row.owner_name ?? "",
		isPublic: Boolean(row.is_public),
		updatedAt: row.updated_at,
	};
}

/** 登录者自己的全部题库（按更新时间倒序）。 */
export async function listMyQuizBanks(user: User): Promise<QuizBankMeta[]> {
	const client = requireClient();
	const { data, error } = await client
		.from("quiz_banks")
		.select("id, name, owner_name, is_public, updated_at")
		.eq("user_id", user.id)
		.order("updated_at", { ascending: false });
	if (error) throw toCloudError(error);
	return (data ?? []).map(toMeta);
}

/** 公开题库（任何人可见，未登录 anon 也可读），按更新时间倒序。 */
export async function listPublicQuizBanks(): Promise<QuizBankMeta[]> {
	const client = requireClient();
	const { data, error } = await client
		.from("quiz_banks")
		.select("id, name, owner_name, is_public, updated_at")
		.eq("is_public", true)
		.order("updated_at", { ascending: false })
		.limit(60);
	if (error) throw toCloudError(error);
	return (data ?? []).map(toMeta);
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
	let id = input.id;
	if (id) {
		const { data, error } = await client
			.from("quiz_banks")
			.update(row)
			.eq("id", id)
			.eq("user_id", user.id)
			.select("id")
			.single();
		if (error) throw toCloudError(error);
		id = data.id;
	} else {
		const { data, error } = await client
			.from("quiz_banks")
			.insert(row)
			.select("id")
			.single();
		if (error) throw toCloudError(error);
		id = data.id;
	}
	return id;
}

/** 仅切换公开/私有（不动题库内容）。 */
export async function setQuizBankPublic(
	user: User,
	id: string,
	isPublic: boolean,
): Promise<void> {
	const client = requireClient();
	const { error } = await client
		.from("quiz_banks")
		.update({ is_public: isPublic, updated_at: new Date().toISOString() })
		.eq("id", id)
		.eq("user_id", user.id);
	if (error) throw toCloudError(error);
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
