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

export async function uploadQuizBank(user: User, name: string, bank: QuizBank, updatedAt = new Date().toISOString()) {
	if (!supabase) throw new Error("云同步尚未配置");
	const { error } = await supabase.from("quiz_banks").upsert({
		user_id: user.id,
		name,
		bank,
		updated_at: updatedAt,
	});
	if (error) throw error;
	return updatedAt;
}

export async function downloadQuizBank(user: User): Promise<CloudQuizBank | null> {
	if (!supabase) throw new Error("云同步尚未配置");
	const { data, error } = await supabase
		.from("quiz_banks")
		.select("name, bank, updated_at")
		.eq("user_id", user.id)
		.maybeSingle();
	if (error) throw error;
	if (!data) return null;
	return {
		name: data.name as string,
		bank: data.bank as QuizBank,
		updatedAt: data.updated_at as string,
	};
}

export async function deleteQuizBank(user: User) {
	if (!supabase) throw new Error("云同步尚未配置");
	const { error } = await supabase.from("quiz_banks").delete().eq("user_id", user.id);
	if (error) throw error;
}
