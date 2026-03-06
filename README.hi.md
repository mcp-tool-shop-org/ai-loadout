<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a> | <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  <img src="logo.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT लाइसेंस"></a>
</p>

AI एजेंटों के लिए संदर्भ-जागरूक ज्ञान राउटर।

`ai-loadout` एक डिस्पैच टेबल फॉर्मैट और मैचिंग इंजन है जो AI एजेंटों को कार्य के अनुसार सही ज्ञान लोड करने देता है। सब कुछ संदर्भ में डालने के बजाय, आप एक छोटा इंडेक्स रखते हैं और आवश्यकतानुसार पेलोड लोड करते हैं।

इसे एक वीडियो गेम लोडआउट की तरह समझें — आप हर मिशन से पहले एजेंट को ठीक उतना ज्ञान देते हैं जितना उसे चाहिए।

## इंस्टॉलेशन

```bash
npm install @mcptoolshop/ai-loadout
```

## मूल अवधारणाएं

### डिस्पैच टेबल

एक `LoadoutIndex` ज्ञान पेलोड का एक संरचित इंडेक्स है:

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

### प्राथमिकता स्तर

| स्तर | व्यवहार | उदाहरण |
|------|---------|--------|
| `core` | हमेशा लोड | "CI पास करने के लिए कभी टेस्ट न छोड़ें" |
| `domain` | कार्य के कीवर्ड मैच होने पर लोड | workflows संपादित करते समय CI नियम |
| `manual` | कभी स्वचालित लोड नहीं, केवल स्पष्ट लुकअप | अस्पष्ट प्लेटफॉर्म समस्याएं |

### पेलोड Frontmatter

प्रत्येक पेलोड फ़ाइल अपने स्वयं के राउटिंग मेटाडेटा रखती है:

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

Frontmatter सत्य का स्रोत है। इंडेक्स इससे व्युत्पन्न होता है।

## API

### `matchLoadout(task, index)`

एक कार्य विवरण को loadout इंडेक्स से मिलाता है। वे प्रविष्टियां लौटाता है जो लोड होनी चाहिए, मैच शक्ति के अनुसार क्रमबद्ध।

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- Core प्रविष्टियां हमेशा शामिल (स्कोर 1.0)
- Manual प्रविष्टियां कभी स्वचालित रूप से शामिल नहीं
- Domain प्रविष्टियां कीवर्ड ओवरलैप + पैटर्न बोनस द्वारा स्कोर
- परिणाम स्कोर के अनुसार अवरोही क्रम में

### `lookupEntry(id, index)`

ID द्वारा एक विशिष्ट प्रविष्टि खोजता है। मैनुअल प्रविष्टियों या स्पष्ट पहुंच के लिए।

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

एक पेलोड फ़ाइल से YAML-जैसा frontmatter पार्स करता है।

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

एक `Frontmatter` ऑब्जेक्ट को वापस स्ट्रिंग में सीरियलाइज़ करता है।

### `validateIndex(index)`

एक `LoadoutIndex` की संरचनात्मक अखंडता की जांच करता है। समस्याओं की एक सूची लौटाता है।

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

जांचता है: आवश्यक फ़ील्ड, अद्वितीय ID, kebab-case प्रारूप, सारांश सीमाएं, domain प्रविष्टियों के लिए कीवर्ड उपस्थिति, मान्य प्राथमिकताएं, गैर-नकारात्मक बजट।

### `estimateTokens(text)`

टेक्स्ट से टोकन गणना का अनुमान लगाता है। अक्षर/4 ह्यूरिस्टिक का उपयोग करता है।

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## टाइप्स

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

## उपभोक्ता

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Claude Code के लिए CLAUDE.md ऑप्टिमाइज़र। डिस्पैच टेबल और मैचिंग के लिए ai-loadout का उपयोग करता है।

## सुरक्षा

यह पैकेज एक शुद्ध डेटा लाइब्रेरी है। यह फ़ाइल सिस्टम तक नहीं पहुंचता, नेटवर्क अनुरोध नहीं करता और टेलीमेट्री एकत्र नहीं करता। सभी I/O उपभोक्ता की जिम्मेदारी है।

### खतरा मॉडल

| खतरा | शमन |
|------|------|
| विकृत frontmatter इनपुट | `parseFrontmatter()` अमान्य इनपुट पर `null` लौटाता है — कोई अपवाद नहीं, कोई eval नहीं |
| प्रोटोटाइप प्रदूषण | मैनुअल पार्सर सादे ऑब्जेक्ट लिटरल का उपयोग करता है, अविश्वसनीय नेस्टेड संरचनाओं का `JSON.parse` नहीं |
| खराब डेटा वाला इंडेक्स | `validateIndex()` संरचनात्मक समस्याओं को फैलने से पहले पकड़ता है |
| Regex DoS | कोई उपयोगकर्ता-प्रदत्त regex नहीं — पैटर्न सादे स्ट्रिंग लुकअप के रूप में मिलाए जाते हैं |

पूर्ण सुरक्षा नीति के लिए [SECURITY.md](SECURITY.md) देखें।

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/) द्वारा निर्मित
