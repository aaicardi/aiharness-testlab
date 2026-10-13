# Implementation Plan: feat: Librería de conversión de temperaturas

## Approach
Repositorio greenfield: no existe código, `package.json` ni estructura previa, así que este plan
establece la arquitectura inicial completa del repo (ver ADR 0001) además del diseño de la
funcionalidad. Se crea un único paquete npm en la raíz (TypeScript + Node >=24 + Vitest) con `src/`
para el código de producción y `tests/` para los tests. La función `convert` se implementa con
**Celsius como unidad intermedia**: toda conversión pasa primero por `toCelsius(value, from)` y
después por `fromCelsius(celsius, to)`, evitando una matriz de 9 fórmulas (C→C, C→F, C→K, F→C, ...)
y reduciendo el riesgo de error a solo 4 fórmulas (ida y vuelta C↔F, C↔K). La validación de cero
absoluto se calcula sobre el valor intermedio sin redondear (`celsius + 273.15`, equivalente en
Kelvin), antes de redondear el resultado final a 2 decimales — así el redondeo de presentación nunca
enmascara ni provoca una validación física incorrecta.

## Changes
| Archivo | Cambio | RF |
|---|---|---|
| `package.json` | Nuevo. Paquete raíz: `"type": "module"`, `"engines": {"node": ">=24"}`, scripts `build` (`tsc -p tsconfig.json`) y `test` (`vitest run`), devDependencies `typescript`, `vitest`, `@types/node` (últimas versiones estables compatibles con Node 24). | RF-01, RF-08 |
| `tsconfig.json` | Nuevo. `strict: true`, `target: "ES2022"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`, `rootDir: "src"`, `outDir: "dist"`, `declaration: true`, `include: ["src"]`. | RF-01 |
| `vitest.config.ts` | Nuevo. `test.environment: "node"`, `test.include: ["tests/**/*.test.ts"]`, `globals: false` (imports explícitos de `vitest` en cada test). | RF-01 |
| `.gitignore` | Nuevo. Ignora `node_modules/`, `dist/`, `coverage/`. | RF-01 |
| `src/errors.ts` | Nuevo. Clase `AbsoluteZeroError extends RangeError` con `name = "AbsoluteZeroError"` y mensaje por defecto `"Resulting temperature is below absolute zero (0 K)."`. | RF-03 |
| `src/convert.ts` | Nuevo. Tipo `Unit = "C" \| "F" \| "K"`; funciones privadas `toCelsius`, `fromCelsius`, `roundTo2`; función pública `convert(value: number, from: Unit, to: Unit): number`. | RF-02, RF-03, RF-04 |
| `src/index.ts` | Nuevo. Punto de entrada público: `export { convert } from "./convert.js"; export type { Unit } from "./convert.js"; export { AbsoluteZeroError } from "./errors.js";`. | RF-02 |
| `tests/convert.test.ts` | Nuevo. Casos de RF-05, RF-06, RF-07, más caso de redondeo (RF-04) y caso límite (0 K exacto no lanza error). | RF-04, RF-05, RF-06, RF-07 |
| `docs/decisions/0001-typescript-node-vitest-arquitectura-inicial.md` | Nuevo (ya creado por architect). ADR de la arquitectura inicial. | — |
| `README.md` | Modificar (opcional, agente `documentation`): documentar instalación, `npm test` y ejemplo de uso de `convert`. No bloqueante para RF-01..08. | — |

No se crean workflows de CI: el repo no tiene ninguno hoy y `CLAUDE.md` solo exige el Quality Gate
`npm test` ejecutable desde la raíz, no un pipeline. Si se requiere CI, debe plantearse como una
spec/ADR separada (fuera de alcance de 001).

## Diseño detallado de `convert`

```ts
// src/convert.ts
export type Unit = "C" | "F" | "K";

import { AbsoluteZeroError } from "./errors.js";

function toCelsius(value: number, from: Unit): number {
  switch (from) {
    case "C": return value;
    case "F": return (value - 32) * (5 / 9);
    case "K": return value - 273.15;
  }
}

function fromCelsius(celsius: number, to: Unit): number {
  switch (to) {
    case "C": return celsius;
    case "F": return celsius * (9 / 5) + 32;
    case "K": return celsius + 273.15;
  }
}

function roundTo2(value: number): number {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function convert(value: number, from: Unit, to: Unit): number {
  const celsius = toCelsius(value, from);
  const kelvinEquivalent = celsius + 273.15;

  if (kelvinEquivalent < 0) {
    throw new AbsoluteZeroError();
  }

  return roundTo2(fromCelsius(celsius, to));
}
```

Decisiones de diseño que el developer **no** debe re-abrir:
- La validación de cero absoluto se hace sobre `kelvinEquivalent` **sin redondear** y con comparación
  estricta `< 0` (0 K exacto es válido, no lanza error — ver RF-06, que convierte desde 0 K).
- El redondeo (RF-04) se aplica **solo** al valor de retorno final, nunca al valor intermedio usado
  para la validación.
- El error lanzado es siempre `AbsoluteZeroError` (subclase de `RangeError`, definida en
  `src/errors.ts`), nunca un `Error` genérico ni un `string` lanzado directamente, para que los
  consumidores puedan hacer `catch` específico.
- Los imports relativos dentro de `src/` usan extensión `.js` (p. ej. `from "./errors.js"`) aunque el
  archivo sea `errors.ts`, por ser requisito de `moduleResolution: "NodeNext"` con ESM puro (ver ADR
  0001). Si se omite, `tsc`/Vitest fallarán en tiempo de build/ejecución.
- No se valida en runtime que `from`/`to` sean distintos de los literales `"C"|"F"|"K"` (el `switch`
  exhaustivo de TypeScript ya cubre los 3 casos a nivel de tipos); no se añade validación de
  `Number.isFinite(value)` porque no está en el alcance de RF-01..08 — si el developer lo considera
  necesario como defensa adicional, debe ser un `if` explícito que lance un `TypeError` con mensaje
  claro, y añadir el test correspondiente, pero no es requerido para el Definition of Done de esta
  spec.

## Tasks
1. **developer:** Crear `package.json`, `tsconfig.json`, `vitest.config.ts` y `.gitignore` según la
   tabla de *Changes*; ejecutar `npm install` para generar `package-lock.json`. Verificar que
   `npm run build` compila sin errores con `strict: true`.
2. **developer:** Implementar `src/errors.ts` (clase `AbsoluteZeroError`) y `src/convert.ts`
   (funciones `toCelsius`, `fromCelsius`, `roundTo2`, `convert`) exactamente como se especifica en
   *Diseño detallado*. Implementar `src/index.ts` re-exportando `convert`, `Unit`, `AbsoluteZeroError`.
3. **tester:** Crear `tests/convert.test.ts` con, como mínimo, los casos de la tabla de *Test
   Strategy* (RF-04 a RF-07), usando `describe("convert", ...)` / `it(...)` con nombres en lenguaje
   natural, importando explícitamente `describe`, `it`, `expect` de `"vitest"`.
4. **tester:** Ejecutar `npm test` desde la raíz y confirmar que toda la suite pasa en verde
   (RF-08); reportar cualquier fallo al developer antes de marcar la tarea como completa.
5. **documentation (opcional, no bloqueante):** Actualizar `README.md` con instrucciones de
   instalación, `npm test`, y un ejemplo de uso de `convert` (import, llamada, manejo de
   `AbsoluteZeroError`).

## Test Strategy
| Criterio de aceptación | Tipo de test | Caso(s) |
|---|---|---|
| RF-05 / "Dado 100 C, cuando convierto a F, entonces obtengo 212" | Unitario (Vitest) | `expect(convert(100, "C", "F")).toBe(212)` |
| RF-06 / "Dado 0 K, cuando convierto a C, entonces obtengo -273.15" | Unitario (Vitest) | `expect(convert(0, "K", "C")).toBe(-273.15)` |
| RF-07 / "Dado -500 C, cuando convierto a K, entonces se lanza un error" | Unitario (Vitest) | `expect(() => convert(-500, "C", "K")).toThrow(AbsoluteZeroError)` |
| RF-04 / "Resultados redondeados a 2 decimales" | Unitario (Vitest) | `expect(convert(10, "F", "C")).toBeCloseTo(-12.22, 2)` (o `toBe(-12.22)`); `(10-32)*5/9 = -12.222...` verifica que se recorta a 2 decimales, no que coincida por casualidad |
| Límite de cero absoluto (0 K exacto es válido, no lanza) | Unitario (Vitest), caso borde complementario a RF-07 | `expect(convert(-273.15, "C", "K")).toBe(0)` (no debe lanzar) |
| RF-01 / "Proyecto TypeScript (Node 24) con tests en Vitest y script `npm test`" | Infraestructura | Ejecutar `npm install && npm test` desde una copia limpia del repo; debe correr sin configuración manual adicional |
| RF-08 / "`npm test` pasa" | Suite completa | Ejecutar `npm test`; todos los `it` en verde, exit code 0 |
| "El proyecto compila" (Acceptance Criteria genérico de la spec) | Build | `npm run build` sin errores de `tsc` |
| "Cada RF cubierto por al menos un test" (Acceptance Criteria genérico) | Revisión cruzada | El tester verifica, al cerrar la tarea, que cada fila de esta tabla tiene un `it` correspondiente en `tests/convert.test.ts` |

## Risks
- **Precisión de punto flotante en el redondeo** (p. ej. `0.1 + 0.2 !== 0.3` en IEEE 754) podría hacer
  que `roundTo2` devuelva `212.00000000000003` en vez de `212` → Mitigación: usar
  `Math.round((value + Number.EPSILON) * 100) / 100` (ya especificado arriba) y cubrir explícitamente
  con el caso de RF-04 (`10 F → C`, que tiene decimal periódico) en los tests.
- **Ambigüedad sobre si el redondeo ocurre antes o después de la validación de cero absoluto**
  (dos resultados distintos posibles) → Resuelto en este plan: la validación usa el valor Kelvin
  equivalente **sin redondear**; esta decisión está documentada en *Diseño detallado* para que
  developer no tenga que decidirlo ni el tester lo cuestione como bug.
- **Convención de imports ESM con `moduleResolution: "NodeNext"`** (extensión `.js` obligatoria en
  imports relativos de archivos `.ts`) es un error común que rompe el build silenciosamente para
  quien no conoce la convención → Mitigación: documentado en el ADR 0001 y repetido en este plan;
  `npm run build` como paso de verificación en la tarea 1 del developer detecta el error temprano.
- **No hay pipeline de CI configurado en el repo**, aunque la spec menciona genéricamente "el
  pipeline de CI sigue pasando en verde" en sus Acceptance Criteria → Mitigación: fuera de alcance de
  esta spec/plan (ningún RF-XX lo pide explícitamente y `CLAUDE.md` solo exige el Quality Gate local
  `npm test`); si se necesita CI, debe solicitarse como spec separada antes de que `devops` actúe,
  dado que crear infraestructura no solicitada excede el alcance de este plan.
