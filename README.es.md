<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

Enrutador de conocimiento contextual para agentes de IA.

`ai-loadout` es el formato de la tabla de distribución y el motor de coincidencia que permite a los agentes de IA cargar el conocimiento adecuado para la tarea en cuestión. En lugar de incluir todo en el contexto, se mantiene un índice pequeño y se cargan los datos según sea necesario.

Piénselo como la configuración de un juego: se equipa al agente con exactamente el conocimiento que necesita antes de cada misión.

## Instalación

```bash
npm install @mcptoolshop/ai-loadout
```

## Conceptos básicos

### La tabla de distribución

Un `LoadoutIndex` es un índice estructurado de datos de conocimiento:

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

### Niveles de prioridad

| Nivel | Comportamiento | Ejemplo |
|------|----------|---------|
| `core` | Cargado siempre | "nunca omitir pruebas para que la integración continua sea exitosa" |
| `domain` | Cargado cuando las palabras clave de la tarea coinciden | Reglas de integración continua al editar flujos de trabajo |
| `manual` | Nunca se carga automáticamente, solo búsqueda explícita | Aspectos técnicos de la plataforma que pueden ser difíciles de entender |

### Metadatos del archivo de datos

Cada archivo de datos contiene sus propios metadatos de enrutamiento:

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

El metadato es la fuente de la verdad. El índice se deriva de él.

## API

### `matchLoadout(tarea, índice)`

Compara una descripción de la tarea con un índice de configuración. Devuelve las entradas que deben cargarse, clasificadas por la fuerza de la coincidencia.

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- Las entradas principales siempre se incluyen (puntuación 1.0)
- Las entradas manuales nunca se incluyen automáticamente
- Las entradas de dominio se puntúan según la superposición de palabras clave + bonificación de patrones
- Los resultados se ordenan por puntuación descendente

### `lookupEntry(id, índice)`

Busca una entrada específica por ID. Para entradas manuales o acceso explícito.

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(contenido)`

Analiza el metadato en formato YAML de un archivo de datos.

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

Serializa un objeto `Frontmatter` de nuevo a una cadena.

### `validateIndex(índice)`

Valida la integridad estructural de un `LoadoutIndex`. Devuelve un array de problemas.

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

Comprobaciones: campos obligatorios, IDs únicos, formato kebab-case, límites del resumen, presencia de palabras clave para entradas de dominio, prioridades válidas, presupuestos no negativos.

### `estimateTokens(texto)`

Estima el número de tokens a partir de un texto. Utiliza la heurística de chars/4.

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## Tipos

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

## Consumidores

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Optimizador de CLAUDE.md para Claude Code. Utiliza ai-loadout para la tabla de distribución y la coincidencia.

## Seguridad

Este paquete es una biblioteca de datos pura. No accede al sistema de archivos, realiza solicitudes de red ni recopila datos de telemetría. Toda la entrada/salida es responsabilidad del consumidor.

### Modelo de amenazas

| Amenaza | Mitigación |
|--------|------------|
| Metadato de entrada con formato incorrecto | `parseFrontmatter()` devuelve `null` en caso de entrada no válida; no se generan excepciones ni se utiliza `eval` |
| Contaminación de prototipos | El analizador personalizado utiliza literales de objetos simples, no `JSON.parse` de estructuras anidadas no confiables. |
| Índice con datos incorrectos | `validateIndex()` detecta problemas estructurales antes de que se propaguen. |
| Ataque de denegación de servicio con expresiones regulares | No se utilizan expresiones regulares proporcionadas por el usuario; los patrones se comparan como búsquedas de cadenas simples. |

Consulte [SECURITY.md](SECURITY.md) para obtener la política de seguridad completa.

---

Creado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
