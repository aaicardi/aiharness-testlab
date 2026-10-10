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
