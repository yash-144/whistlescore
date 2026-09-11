import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger
} from "../managed/counter/contract/index.js";

export class CounterSimulator {
  readonly contract: Contract<any>;
  circuitContext: CircuitContext<any>;

  constructor() {
    this.contract = new Contract<any>({}); // No witnesses required
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState
    } = this.contract.initialState(
      createConstructorContext({}, "0".repeat(64))
    );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState
    );
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public increment(step: bigint, secret_token: bigint): Ledger {
    this.circuitContext = this.contract.impureCircuits.increment(
      this.circuitContext,
      step,
      secret_token
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }
}
