/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai_config from "../ai/config.js";
import type * as ai_ollamaProvider from "../ai/ollamaProvider.js";
import type * as ai_researchAgent from "../ai/researchAgent.js";
import type * as ai_taskDecomposer from "../ai/taskDecomposer.js";
import type * as ai_taskSupportAgent from "../ai/taskSupportAgent.js";
import type * as ai from "../ai.js";
import type * as aiContents from "../aiContents.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as myFunctions from "../myFunctions.js";
import type * as subtasks from "../subtasks.js";
import type * as tasks from "../tasks.js";
import type * as userProfiles from "../userProfiles.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "ai/config": typeof ai_config;
  "ai/ollamaProvider": typeof ai_ollamaProvider;
  "ai/researchAgent": typeof ai_researchAgent;
  "ai/taskDecomposer": typeof ai_taskDecomposer;
  "ai/taskSupportAgent": typeof ai_taskSupportAgent;
  ai: typeof ai;
  aiContents: typeof aiContents;
  auth: typeof auth;
  http: typeof http;
  myFunctions: typeof myFunctions;
  subtasks: typeof subtasks;
  tasks: typeof tasks;
  userProfiles: typeof userProfiles;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
