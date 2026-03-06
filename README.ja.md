<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a> | <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  <img src="logo.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT ライセンス"></a>
</p>

AIエージェント向けのコンテキスト認識型ナレッジルーター。

`ai-loadout`は、AIエージェントがタスクに応じて適切な知識をロードできるようにするディスパッチテーブルフォーマットとマッチングエンジンです。すべてをコンテキストに詰め込む代わりに、小さなインデックスを保持し、必要に応じてペイロードをロードします。

ゲームのロードアウトのようなものです — 各ミッションの前にエージェントに必要な知識だけを装備させます。

## インストール

```bash
npm install @mcptoolshop/ai-loadout
```

## 基本概念

### ディスパッチテーブル

`LoadoutIndex`はナレッジペイロードの構造化インデックスです：

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
|--------|------|-----|
| `core` | 常にロード | 「CIを通すためにテストを省略しない」 |
| `domain` | タスクのキーワードが一致したときにロード | workflow編集時のCIルール |
| `manual` | 自動ロードなし、明示的な検索のみ | まれなプラットフォームの問題 |

### ペイロードのFrontmatter

各ペイロードファイルは独自のルーティングメタデータを持ちます：

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

Frontmatterが真実の源です。インデックスはそこから導出されます。

## API

### `matchLoadout(task, index)`

タスクの説明をloadoutインデックスと照合します。ロードすべきエントリをマッチ強度順にランク付けして返します。

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- coreエントリは常に含まれます（スコア1.0）
- manualエントリは自動的には含まれません
- domainエントリはキーワードの重複 + パターンボーナスでスコアリング
- 結果はスコアの降順でソート

### `lookupEntry(id, index)`

IDで特定のエントリを検索します。manualエントリや明示的なアクセス用。

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

ペイロードファイルからYAML形式のfrontmatterを解析します。

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

`LoadoutIndex`の構造的整合性を検証します。問題の配列を返します。

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

チェック項目：必須フィールド、一意のID、kebab-case形式、要約の文字数制限、domainエントリのキーワード存在、有効な優先度、非負のバジェット。

### `estimateTokens(text)`

テキストからトークン数を推定します。文字数/4のヒューリスティックを使用。

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## 型定義

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

## 利用プロジェクト

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Claude Code用のCLAUDE.mdオプティマイザー。ディスパッチテーブルとマッチングにai-loadoutを使用。

## セキュリティ

このパッケージは純粋なデータライブラリです。ファイルシステムへのアクセス、ネットワークリクエスト、テレメトリの収集は行いません。すべてのI/Oは利用者の責任です。

### 脅威モデル

| 脅威 | 対策 |
|------|------|
| 不正なfrontmatter入力 | `parseFrontmatter()`は無効な入力に対して`null`を返す — 例外なし、evalなし |
| プロトタイプ汚染 | 手動パーサーはプレーンオブジェクトリテラルを使用、信頼できないネスト構造の`JSON.parse`なし |
| 不正データのインデックス | `validateIndex()`が構造的問題を伝播前に検出 |
| Regex DoS | ユーザー提供のregexなし — パターンはプレーンな文字列検索として照合 |

完全なセキュリティポリシーについては[SECURITY.md](SECURITY.md)を参照してください。

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/)製
