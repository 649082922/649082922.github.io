import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/game-cloud";

export type QuizType = "single" | "multiple" | "judge";
export type QuizQuestion = { q: string; options: string[]; answer: string };
export type QuizBank = Record<QuizType, QuizQuestion[]>;

export type CloudQuizBank = {
	name: string;
	bank: QuizBank;
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

export async function uploadQuizBank(
	user: User,
	name: string,
	bank: QuizBank,
	updatedAt = new Date().toISOString(),
) {
	if (!supabase) throw new Error("云同步尚未配置");
	const { error } = await supabase.from("quiz_banks").upsert({
		user_id: user.id,
		name,
		bank,
		updated_at: updatedAt,
	});
	if (error) throw toCloudError(error);
	return updatedAt;
}

export async function downloadQuizBank(
	user: User,
): Promise<CloudQuizBank | null> {
	if (!supabase) throw new Error("云同步尚未配置");
	const { data, error } = await supabase
		.from("quiz_banks")
		.select("name, bank, updated_at")
		.eq("user_id", user.id)
		.maybeSingle();
	if (error) throw toCloudError(error);
	if (!data) return null;
	return {
		name: data.name as string,
		bank: data.bank as QuizBank,
		updatedAt: data.updated_at as string,
	};
}

export async function deleteQuizBank(user: User) {
	if (!supabase) throw new Error("云同步尚未配置");
	const { error } = await supabase
		.from("quiz_banks")
		.delete()
		.eq("user_id", user.id);
	if (error) throw toCloudError(error);
}
