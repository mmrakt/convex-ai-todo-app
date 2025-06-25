# ESLint+Prettier → Biome Migration

## Task

既存プロジェクトのESLint+PrettierをBiomeに置き換える

## Steps

### 1. 古い設定を削除

```bash
# 設定ファイル削除
rm -f .eslintrc* .prettierrc* .eslintignore .prettierignore

# package.jsonからeslint, prettier関連の依存関係を削除
```

### 2. Biomeをインストール

```bash
npm install --save-dev @biomejs/biome
npx @biomejs/biome init
```

### 3. biome.json設定

```json
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentWidth": 2,
    "lineWidth": 100,
    "quoteStyle": "single"
  },
  "files": {
    "ignore": ["node_modules/**", ".next/**", "dist/**"]
  }
}
```

### 4. package.jsonスクリプト更新

```json
{
  "scripts": {
    "lint": "biome check ./src",
    "lint:fix": "biome check --apply ./src",
    "format": "biome format --write ./src"
  }
}
```

### 5. 実行

```bash
npm install
npm run lint:fix
```

## 完了確認

- [ ] ESLint/Prettier関連ファイルが削除されている
- [ ] biome.jsonが作成されている
- [ ] `pnpm lint`が動作する
