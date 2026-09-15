import { CounterSimulator } from "./counter-simulator.js";
import { describe, it, expect } from "vitest";

describe("Counter smart contract", () => {
  // Requirement A: Circuit logic — does the circuit compute correctly?
  it("computes addition correctly when authorized (Circuit logic)", () => {
    const simulator = new CounterSimulator();

    // Step 1: verify increment by 1 with valid secret_token (42)
    const state1 = simulator.increment(1n, 42n);
    expect(state1.counter).toEqual(1n);

    // Step 2: verify increment by 3
    const state2 = simulator.increment(3n, 42n);
    expect(state2.counter).toEqual(4n);

    // Step 3: verify increment by 5
    const state3 = simulator.increment(5n, 42n);
    expect(state3.counter).toEqual(9n);
  });

  // Requirement B: State transitions — does ledger state update as expected?
  it("transitions ledger state from initial 0 through successive valid updates (State transitions)", () => {
    const simulator = new CounterSimulator();

    // Initial state before any circuit calls
    const initialLedger = simulator.getLedger();
    expect(initialLedger.counter).toEqual(0n);

    // First transition
    simulator.increment(10n, 42n);
    expect(simulator.getLedger().counter).toEqual(10n);

    // Second transition
    simulator.increment(25n, 42n);
    expect(simulator.getLedger().counter).toEqual(35n);
  });

  // Requirement C: Privacy — private input is never exposed in any output
  it("never exposes private witness in ledger or output and rejects invalid proofs (Privacy)", () => {
    const simulator = new CounterSimulator();
    const privateSecretToken = 42n;

    // Execute circuit with private witness
    const updatedLedger = simulator.increment(5n, privateSecretToken);

    // 1. The public ledger must only contain public fields (counter), never secret_token
    const ledgerKeys = Object.keys(updatedLedger);
    expect(ledgerKeys).toEqual(["counter"]);
    expect((updatedLedger as any).secret_token).toBeUndefined();

    // 2. Reject unauthorized caller with wrong private witness without mutating state
    const currentCounter = simulator.getLedger().counter;
    expect(() => {
      simulator.increment(5n, 999n); // Invalid secret token
    }).toThrow();

    // Verify ledger state was NOT modified when assertion failed
    expect(simulator.getLedger().counter).toEqual(currentCounter);
  });
});

