## 概要

コード品質チェックと修正を実施する

以下コマンドで lint->型チェック->テスト の順に実行し、すべての問題が解決されるまで繰り返す

```
# ルートの場合
pnpm mobile lint
pnpm mobile check-types
pnpm mobile test

# apps/mobileにいる場合
pnpm lint
pnpm check-types
pnpm test

```
