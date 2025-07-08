import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';

// 新規ユーザー登録時の処理
export const createUserOnSignup = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ユーザープロフィールが既に存在するかチェック
    const existingProfile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .first();

    if (!existingProfile) {
      // 新規ユーザーのプロフィールを作成
      await ctx.db.insert('userProfiles', {
        userId: args.userId,
        name: args.name || args.email.split('@')[0], // メールアドレスの@より前を初期名前とする
        skills: [],
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'ja',
        },
        createdAt: Date.now(),
      });
    }

    return args.userId;
  },
});

// 現在のユーザー情報を取得
export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Convex Authのユーザー情報を取得
    const user = await ctx.db.get(userId);

    // ユーザープロフィールを取得
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .first();

    return {
      id: userId,
      email: user?.email,
      profile,
    };
  },
});

// ユーザーの初期設定完了処理
export const completeUserSetup = mutation({
  args: {
    name: v.string(),
    skills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('認証が必要です');
    }

    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .first();

    if (!profile) {
      throw new Error('ユーザープロフィールが見つかりません');
    }

    return await ctx.db.patch(profile._id, {
      name: args.name,
      skills: args.skills,
    });
  },
});
