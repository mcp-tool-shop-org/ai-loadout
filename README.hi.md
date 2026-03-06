<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

संदर्भ-जागरूक ज्ञान राउटर जो एआई एजेंटों के लिए है।

`ai-loadout` एक डिस्पैच टेबल फॉर्मेट और मिलान इंजन है जो एआई एजेंटों को उस कार्य के लिए सही ज्ञान लोड करने की अनुमति देता है। संदर्भ में सब कुछ डालने के बजाय, आप एक छोटा इंडेक्स रखते हैं और आवश्यकतानुसार डेटा लोड करते हैं।

इसे एक गेम लोडआउट की तरह सोचें - आप एजेंट को प्रत्येक मिशन से पहले आवश्यक ज्ञान से लैस करते हैं।

## इंस्टॉल करें

```bash
npm install @mcptoolshop/ai-loadout
```

## मुख्य अवधारणाएं

### डिस्पैच टेबल

`LoadoutIndex` ज्ञान डेटा के एक संरचित इंडेक्स है:

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
|------|----------|---------|
| `core` | हमेशा लोड किया जाता है | "CI को हरा करने के लिए कभी भी परीक्षणों को छोड़ें नहीं" |
| `domain` | जब कार्य कीवर्ड मेल खाते हैं तो लोड किया जाता है | वर्कफ़्लो संपादित करते समय CI नियम |
| `manual` | कभी भी स्वचालित रूप से लोड नहीं किया जाता है, केवल स्पष्ट खोज | अस्पष्ट प्लेटफ़ॉर्म संबंधी समस्याएं |

### डेटा का प्रारंभिक भाग

प्रत्येक डेटा फ़ाइल में अपना रूटिंग मेटाडेटा होता है:

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

प्रारंभिक भाग सत्य का स्रोत है। इंडेक्स इससे प्राप्त होता है।

## एपीआई

### `matchLoadout(task, index)`

एक कार्य विवरण को लोडआउट इंडेक्स के खिलाफ मिलाएं। उन प्रविष्टियों को लौटाता है जिन्हें लोड किया जाना चाहिए, जो मिलान की शक्ति के आधार पर क्रमबद्ध हैं।

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- मुख्य प्रविष्टियाँ हमेशा शामिल होती हैं (स्कोर 1.0)
- मैन्युअल प्रविष्टियाँ कभी भी स्वचालित रूप से शामिल नहीं होती हैं
- डोमेन प्रविष्टियों को कीवर्ड ओवरलैप + पैटर्न बोनस से स्कोर किया जाता है
- परिणाम स्कोर के अवरोही क्रम में क्रमबद्ध होते हैं

### `lookupEntry(id, index)`

आईडी द्वारा एक विशिष्ट प्रविष्टि खोजें। मैन्युअल प्रविष्टियों या स्पष्ट पहुंच के लिए।

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

एक डेटा फ़ाइल से YAML-जैसे प्रारंभिक भाग को पार्स करें।

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

एक `Frontmatter` ऑब्जेक्ट को वापस एक स्ट्रिंग में क्रमबद्ध करें।

### `validateIndex(index)`

एक `LoadoutIndex` की संरचनात्मक अखंडता को मान्य करें। मुद्दों का एक सरणी लौटाता है।

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

जांच: आवश्यक फ़ील्ड, अद्वितीय आईडी, केबाब-केस प्रारूप, सारांश सीमाएं, डोमेन प्रविष्टियों के लिए कीवर्ड की उपस्थिति, मान्य प्राथमिकताएं, गैर-नकारात्मक बजट।

### `estimateTokens(text)`

पाठ से टोकन की संख्या का अनुमान लगाएं। chars/4 अनुमान का उपयोग करता है।

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## प्रकार

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

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — क्लाउड कोड के लिए CLAUDE.md ऑप्टिमाइज़र। डिस्पैच टेबल और मिलान के लिए ai-loadout का उपयोग करता है।

## सुरक्षा

यह पैकेज एक शुद्ध डेटा लाइब्रेरी है। यह फ़ाइल सिस्टम तक नहीं पहुंचता है, नेटवर्क अनुरोध नहीं करता है, या टेलीमेट्री एकत्र नहीं करता है। सभी इनपुट/आउटपुट उपभोक्ता की जिम्मेदारी है।

### खतरे का मॉडल

| खतरा | शमन |
|--------|------------|
| खराब प्रारूप वाला प्रारंभिक भाग इनपुट | `parseFrontmatter()` अमान्य इनपुट पर `null` लौटाता है - कोई अपवाद नहीं, कोई eval नहीं |
| प्रोटोकॉल प्रदूषण | हाथ से बनाया गया पार्सर केवल साधारण ऑब्जेक्ट लिटरल का उपयोग करता है, अविश्वसनीय नेस्टेड संरचनाओं का `JSON.parse` नहीं करता है |
| खराब डेटा वाला इंडेक्स | `validateIndex()` संरचनात्मक मुद्दों को फैलने से पहले पकड़ लेता है |
| रेगेक्स DoS | कोई उपयोगकर्ता-प्रदत्त रेगेक्स नहीं - पैटर्न को साधारण स्ट्रिंग लुकअप के रूप में मिलान किया जाता है |

पूर्ण सुरक्षा नीति के लिए [SECURITY.md](SECURITY.md) देखें।

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/) द्वारा बनाया गया
