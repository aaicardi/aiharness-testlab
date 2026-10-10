# aiharness-testlab

Una librería TypeScript para convertir temperaturas entre Celsius, Fahrenheit y Kelvin.

## Requisitos

- **Node.js >= 24**
- npm (incluido con Node.js)

## Instalación y desarrollo

### Clonar e instalar dependencias

```bash
git clone <repositorio>
cd aiharness-testlab
npm install
```

### Compilar el proyecto

```bash
npm run build
```

Esto genera el código JavaScript compilado en la carpeta `dist/`.

### Ejecutar los tests

```bash
npm test
```

## Uso

Después de ejecutar `npm run build`, puedes importar la función `convert` y la clase de error `AbsoluteZeroError` desde el código compilado:

```typescript
import { convert, AbsoluteZeroError } from "./dist/index.js";

// Convierte 100 °C a Fahrenheit
const fahrenheit = convert(100, "C", "F");
console.log(fahrenheit); // 212

// Convierte 0 Kelvin a Celsius
const celsius = convert(0, "K", "C");
console.log(celsius); // -273.15

// Manejo de errores: temperaturas por debajo del cero absoluto
try {
  convert(-500, "C", "K");
} catch (error) {
  if (error instanceof AbsoluteZeroError) {
    console.error(error.message); 
    // "Resulting temperature is below absolute zero (0 K)."
  }
}
```

### Unidades soportadas

- `"C"` — Celsius
- `"F"` — Fahrenheit
- `"K"` — Kelvin

La función `convert(value, from, to)` retorna el resultado redondeado a 2 decimales.

## Validación de cero absoluto

Si la temperatura resultante es menor que 0 K (cero absoluto, aproximadamente -273.15 °C), la función lanza una instancia de `AbsoluteZeroError` (subclase de `RangeError`). Esto te permite hacer `catch` específico para este error de validación física:

```typescript
try {
  convert(-274, "C", "K");
} catch (error) {
  if (error instanceof AbsoluteZeroError) {
    // Manejo de temperatura por debajo del cero absoluto
  } else {
    // Otros errores
  }
}
```