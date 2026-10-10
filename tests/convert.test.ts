import { describe, it, expect } from "vitest";
import { convert, AbsoluteZeroError } from "../src/index.js";

describe("convert", () => {
  describe("conversiones básicas (RF-02, RF-05, RF-06)", () => {
    it("convierte 100 C a F y obtiene 212 (RF-05)", () => {
      expect(convert(100, "C", "F")).toBe(212);
    });

    it("convierte 0 K a C y obtiene -273.15 (RF-06)", () => {
      expect(convert(0, "K", "C")).toBe(-273.15);
    });

    it("convierte 0 C a F y obtiene 32", () => {
      expect(convert(0, "C", "F")).toBe(32);
    });

    it("convierte 212 F a K y obtiene 373.15", () => {
      expect(convert(212, "F", "K")).toBe(373.15);
    });
  });

  describe("conversiones identidad (misma unidad de origen y destino)", () => {
    it("convierte C a C y devuelve el mismo valor", () => {
      expect(convert(25, "C", "C")).toBe(25);
    });

    it("convierte F a F y devuelve el mismo valor", () => {
      expect(convert(98.6, "F", "F")).toBe(98.6);
    });

    it("convierte K a K y devuelve el mismo valor", () => {
      expect(convert(300, "K", "K")).toBe(300);
    });
  });

  describe("ida y vuelta entre unidades (regresión)", () => {
    it("convertir C a F y volver a C recupera el valor original", () => {
      const original = 37;
      const fahrenheit = convert(original, "C", "F");
      expect(convert(fahrenheit, "F", "C")).toBe(original);
    });

    it("convertir C a K y volver a C recupera el valor original", () => {
      const original = 20;
      const kelvin = convert(original, "C", "K");
      expect(convert(kelvin, "K", "C")).toBe(original);
    });
  });

  describe("redondeo a 2 decimales (RF-04)", () => {
    it("convierte 10 F a C y redondea el decimal periódico a -12.22", () => {
      // (10 - 32) * 5 / 9 = -12.222222...
      expect(convert(10, "F", "C")).toBe(-12.22);
    });

    it("no deja el resultado sin redondear (no es -12.222222...)", () => {
      const result = convert(10, "F", "C");
      expect(result).not.toBeCloseTo(-12.222222222222221, 10);
      expect(result.toString()).toBe("-12.22");
    });

    it("convierte 98.6 F a C y redondea a 2 decimales", () => {
      // (98.6 - 32) * 5 / 9 = 37.0000000000...04 aprox
      expect(convert(98.6, "F", "C")).toBe(37);
    });
  });

  describe("validación de cero absoluto (RF-03, RF-07)", () => {
    it("lanza AbsoluteZeroError al convertir -500 C a K (RF-07)", () => {
      expect(() => convert(-500, "C", "K")).toThrow(AbsoluteZeroError);
    });

    it("el error lanzado es instancia de RangeError", () => {
      expect(() => convert(-500, "C", "K")).toThrow(RangeError);
    });

    it("el error lanzado tiene name 'AbsoluteZeroError'", () => {
      try {
        convert(-500, "C", "K");
        throw new Error("convert no lanzó el error esperado");
      } catch (error) {
        expect(error).toBeInstanceOf(AbsoluteZeroError);
        expect((error as AbsoluteZeroError).name).toBe("AbsoluteZeroError");
      }
    });

    it("lanza AbsoluteZeroError al pedir directamente una temperatura Kelvin negativa", () => {
      expect(() => convert(-1, "K", "C")).toThrow(AbsoluteZeroError);
    });

    it("lanza AbsoluteZeroError para una temperatura Fahrenheit muy por debajo del cero absoluto", () => {
      // (-500 - 32) * 5/9 = -295.56 C aprox => kelvin equivalente negativo
      expect(() => convert(-500, "F", "C")).toThrow(AbsoluteZeroError);
    });

    it("lanza AbsoluteZeroError justo por debajo del cero absoluto (-273.16 C)", () => {
      expect(() => convert(-273.16, "C", "K")).toThrow(AbsoluteZeroError);
    });
  });

  describe("límite del cero absoluto (caso borde, 0 K exacto es válido)", () => {
    it("convierte -273.15 C a K y obtiene 0 sin lanzar error", () => {
      expect(() => convert(-273.15, "C", "K")).not.toThrow();
      expect(convert(-273.15, "C", "K")).toBe(0);
    });

    it("el resultado 0 K no es -0 (normalizado a cero positivo)", () => {
      const result = convert(-273.15, "C", "K");
      expect(Object.is(result, -0)).toBe(false);
      expect(Object.is(result, 0)).toBe(true);
    });

    it("convierte 0 K a K y obtiene 0 sin lanzar error", () => {
      expect(convert(0, "K", "K")).toBe(0);
    });

    it("no lanza error justo por encima del cero absoluto (-273.14 C)", () => {
      expect(() => convert(-273.14, "C", "K")).not.toThrow();
      expect(convert(-273.14, "C", "K")).toBe(0.01);
    });
  });
});
