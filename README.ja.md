<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ai-loadout/readme.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/ai-loadout"><img src="https://codecov.io/gh/mcp-tool-shop-org/ai-loadout/graph/badge.svg" alt="Coverage"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ai-loadout/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

AIエージェント向けのコンテキスト認識型ナレッジルーティングシステム。

`ai-loadout`は、AIエージェントがタスクに必要な知識をロードするためのディスパッチテーブル形式とマッチングエンジンです。 すべての情報をコンテキストに含める代わりに、小さなインデックスを保持し、必要なときにペイロードをロードします。

これは、ゲームのロードアウトのようなものです。エージェントは、各ミッションの前に必要な知識を正確に装備します。

## インストール

```bash
npm install @mcptoolshop/ai-loadout
```

## 主要な概念

### ディスパッチテーブル

`LoadoutIndex`は、知識ペイロードの構造化されたインデックスです。

```json
{
  "version": "1.0.0",
  "generated": "2026-03-06T12:00:00Z",
  "entries": [
    {
      "id": "github-actions",
      "path": ".rules/github-actions.md",
      "keywords": ["ci", "workflow", "runner"],
      "patterns": ["ci_pipeline"],
      "priority": "domain",
      "summary": "CI triggers, path gating, runner cost control",
      "triggers": { "task": true, "plan": true, "edit": false },
      "tokens_est": 680,
      "lines": 56
    }
  ],
  "budget": {
    "always_loaded_est": 320,
    "on_demand_total_est": 8100,
    "avg_task_load_est": 520,
    "avg_task_load_observed": null
  }
}
```

### 優先度レベル

| レベル | 動作 | 例 |
|------|----------|---------|
| `core` | 常にロードされる | "テストをスキップしてCIを成功させることは決してない" |
| `domain` | タスクのキーワードと一致した場合にロードされる | ワークフローの編集時のCIルール |
| `manual` | 自動ロードされない、明示的な参照のみ | プラットフォーム固有の問題 |

### ペイロードのフロントマター

各ペイロードファイルには、独自のルーティングメタデータが含まれています。

```markdown
---
id: github-actions
keywords: [ci, workflow, runner, dependabot]
patterns: [ci_pipeline]
priority: domain
triggers:
  task: true
  plan: true
  edit: false
---

# GitHub Actions Rules
CI minutes are finite...
```

フロントマターが真実の源です。インデックスはそれから派生します。

## API

### `matchLoadout(task, index)`

タスクの説明をロードインデックスと照合します。ロードされるべきエントリを返し、一致の強さでランク付けします。

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- コアエントリは常に含まれます（スコア1.0）
- マニュアルエントリは自動的に含まれません
- ドメインエントリは、キーワードの重複度とパターンのボーナスによってスコアが決定されます
- 結果はスコアの高い順にソートされます

### `lookupEntry(id, index)`

IDで特定の項目を検索します。マニュアルエントリまたは明示的なアクセスに使用します。

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

ペイロードファイルからYAMLのようなフロントマターを解析します。

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

`Frontmatter`オブジェクトを文字列にシリアライズします。

### `validateIndex(index)`

`LoadoutIndex`の構造的な整合性を検証します。問題の配列を返します。

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

チェック項目：必須フィールド、一意のID、ケバブケース形式、サマリーの範囲、ドメインエントリのキーワードの存在、有効な優先度、非負の予算。

### `estimateTokens(text)`

テキストからトークン数を推定します。chars/4のヒューリスティックを使用します。

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## タイプ

```typescript
import type {
  LoadoutEntry,
  LoadoutIndex,
  Frontmatter,
  MatchResult,
  ValidationIssue,
  Priority,       // "core" | "domain" | "manual"
  Triggers,       // { task, plan, edit }
  Budget,
} from "@mcptoolshop/ai-loadout";
```

## コンシューマー

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Claude Code用のCLAUDE.mdオプティマイザー。ディスパッチテーブルとマッチングにai-loadoutを使用します。

## セキュリティ

このパッケージは、純粋なデータライブラリです。ファイルシステムにアクセスしたり、ネットワークリクエストを行ったり、テレメトリを収集したりしません。すべての入出力は、コンシューマーの責任です。

### 脅威モデル

| 脅威 | 対策 |
|--------|------------|
| 不正なフロントマター入力 | `parseFrontmatter()`は、無効な入力に対して`null`を返します。例外は発生せず、`eval`も使用しません。 |
| プロトタイプ汚染 | 手動で作成されたパーサーは、プレーンなオブジェクトリテラルを使用し、信頼できないネストされた構造の`JSON.parse`は使用しません。 |
| 不正なデータを含むインデックス | `validateIndex()`は、構造的な問題を伝播する前に検出します。 |
| 正規表現DoS攻撃 | ユーザーが提供する正規表現はありません。パターンは、プレーンテキストの参照として一致されます。 |

完全なセキュリティポリシーについては、[SECURITY.md](SECURITY.md)を参照してください。

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/)によって作成されました。
