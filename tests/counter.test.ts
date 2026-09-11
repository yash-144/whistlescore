import { CounterSimulator } from "./counter-simulator.js";
import { describe, it, expect } from "vitest";

describe("Counter smart contract", () => {
  it("initializes state properly (State transitions)", () => {
    const simulator = new CounterSimulator();
    const ledgerState = simulator.getLedger();
    expect(ledgerState.counter).toEqual(0n);
  });

  it("increments the counter correctly when given the correct secret token (Circuit logic)", () => {
    const simulator = new CounterSimulator();
    // Valid secret_token is 42, step is 5
    const nextLedgerState = simulator.increment(5n, 42n);
    expect(nextLedgerState.counter).toEqual(5n);
    
    // Increment again
    const finalState = simulator.increment(10n, 42n);
    expect(finalState.counter).toEqual(15n);
  });

  it("fails to increment and keeps private inputs hidden when secret token is invalid (Private inputs)", () => {
    const simulator = new CounterSimulator();
    // Invalid secret_token 99
    expect(() => {
      simulator.increment(5n, 99n);
    }).toThrow();
    
    // Counter should not have changed
    const ledgerState = simulator.getLedger();
    expect(ledgerState.counter).toEqual(0n);
  });
});
