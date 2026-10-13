export class AbsoluteZeroError extends RangeError {
  constructor(message: string = "Resulting temperature is below absolute zero (0 K).") {
    super(message);
    this.name = "AbsoluteZeroError";
  }
}
