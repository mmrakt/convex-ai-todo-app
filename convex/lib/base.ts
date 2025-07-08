import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from '../_generated/server';

// Base error types for better error handling
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(message, 'UNAUTHENTICATED', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '権限がありません') {
    super(message, 'UNAUTHORIZED', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}が見つかりません`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

// Context types with authentication
export type AuthenticatedQueryCtx = QueryCtx & { userId: string };
export type AuthenticatedMutationCtx = MutationCtx & { userId: string };

// Base service class for common functionality
export abstract class BaseService {
  // Authenticate query context
  protected async authenticateQuery(ctx: QueryCtx): Promise<AuthenticatedQueryCtx> {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AuthenticationError();
    }
    return { ...ctx, userId };
  }

  // Authenticate mutation context
  protected async authenticateMutation(ctx: MutationCtx): Promise<AuthenticatedMutationCtx> {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AuthenticationError();
    }
    return { ...ctx, userId };
  }

  // Verify resource ownership
  protected async verifyOwnership<T extends { userId: string }>(
    resource: T | null,
    userId: string,
    resourceName: string = 'リソース',
  ): Promise<T> {
    if (!resource) {
      throw new NotFoundError(resourceName);
    }
    if (resource.userId !== userId) {
      throw new AuthorizationError();
    }
    return resource;
  }
}

// Higher-order function for authenticated queries
export function authenticatedQuery<Args, Output>(
  handler: (ctx: AuthenticatedQueryCtx, args: Args) => Promise<Output>,
) {
  return async (ctx: QueryCtx, args: Args): Promise<Output> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AuthenticationError();
    }
    return handler({ ...ctx, userId }, args);
  };
}

// Higher-order function for authenticated mutations
export function authenticatedMutation<Args, Output>(
  handler: (ctx: AuthenticatedMutationCtx, args: Args) => Promise<Output>,
) {
  return async (ctx: MutationCtx, args: Args): Promise<Output> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AuthenticationError();
    }
    return handler({ ...ctx, userId }, args);
  };
}

// Utility for safe error handling
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ConvexError) {
    return new AppError(error.message, 'CONVEX_ERROR', 400);
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'INTERNAL_ERROR', 500);
  }

  return new AppError('不明なエラーが発生しました', 'UNKNOWN_ERROR', 500);
}
