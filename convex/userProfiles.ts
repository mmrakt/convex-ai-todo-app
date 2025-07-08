import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ユーザープロフィールの取得
export const getUserProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .first();

    return profile;
  },
});

// ユーザープロフィールの作成/更新
export const upsertUserProfile = mutation({
  args: {
    name: v.string(),
    skills: v.optional(v.array(v.string())),
    preferences: v.optional(
      v.object({
        theme: v.string(),
        notifications: v.boolean(),
        language: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('認証が必要です');
    }

    const existingProfile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .first();

    const profileData = {
      userId,
      name: args.name,
      skills: args.skills || [],
      preferences: args.preferences || {
        theme: 'light',
        notifications: true,
        language: 'ja',
      },
      createdAt: existingProfile?.createdAt || Date.now(),
    };

    if (existingProfile) {
      return await ctx.db.patch(existingProfile._id, profileData);
    } else {
      return await ctx.db.insert('userProfiles', profileData);
    }
  },
});

// スキルの更新
export const updateUserSkills = mutation({
  args: {
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
      skills: args.skills,
    });
  },
});

// 設定の更新
export const updateUserPreferences = mutation({
  args: {
    preferences: v.object({
      theme: v.string(),
      notifications: v.boolean(),
      language: v.string(),
    }),
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
      preferences: args.preferences,
    });
  },
});
