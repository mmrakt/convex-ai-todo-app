## Development Guidelines

### General

- Do not write code comments as much as possible. When writing code comments, write about "why" rather than "what"
- All code comments and messages are written in Japanese
- If searching web, use `gemini` instead of `Web_Search`(/gemini-search command)

### File Structure

- separate modules by features and follow the single responsibility principle
- barrel exports (re-exports from index.ts) are strictly prohibited
  - Reason: tree-shaking blocking, circular reference risk, bloated build size
- Each module is imported directly and explicit dependencies are maintained
- Absolute paths are prioritized over relative paths

#### Naming Rules

- Directory and file names should use kebab-case
- Variable names
  - Use camelCase for "dynamic values (determined at runtime)" and UPPER_SNAKE_CASE for "static values (determined before execution and immutable)"
  - Avoid abstract names such as `data` or `value` that make it difficult to infer the stored values; use specific and not overly verbose names
- Test files should be named `**.test.ts`

#### Type Definitions

- Function and method return types should generally not be explicitly declared; rely on type inference
- Do not use `any` or type casting with `as`; provide accurate types
- Utilize generics appropriately to enhance type reusability
- Use `type` instead of `interface`
- Apply `as const` to objects that are static variables as mentioned above

#### Asynchronous Processing

- Prioritize async/await over Promise chains
- Use `Promise.all()` or `Promise.allSettled()` for parallel processing
- Always implement error handling
- Explicitly define return types for asynchronous functions
- Consider implementing timeout handling

#### Other Guidelines

- For import statements, do not use absolute paths; always use import aliases starting with `@/`
- Determine the package management tool being used from the following and use appropriate commands:
  - If `package-lock.json` exists in the root -> use `npm`
  - If `yarn.lock` exists in the root -> use `yarn`
  - If `pnpm-lock.(yaml/yml)` exists in the root -> use `pnpm`
  - If the project is workspace-configured, navigate back to the root directory under git management and check for lock files

### GitHub Usage Rules

- Commit messages must use one of the following prefixes: chore, fix, feat, docs
- Commit messages should be written in Japanese describing what was changed and why
- Make commits frequently with very small granularity
- Since Lint, test, and typecheck are basically verified in CI, confirm local success before pushing
- PRs will never be merged as long as there are CI errors
- Branches should start with prefixes like feat, fix, docs, chore, etc., and clearly indicate the issue number. Example: fix/issue-1
- When creating PRs, start with prefixes like feat, fix, docs, chore, etc., and include the issue number and summary in the title. Example: fix: issue-1 Resolve server error occurring in development environment
- In PR comments, associate the Issue and write so that it will be closed upon merge
