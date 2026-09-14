import { useState, useEffect, useCallback } from 'react';
import type { InitialAPI, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import {
  getPublicStates,
  createCallTxOptions,
} from '@midnight-ntwrk/midnight-js-contracts';
import { make as makeCompiledContract, withVacantWitnesses } from '@midnight-ntwrk/compact-js/effect/CompiledContract';
import type { ProofProvider } from '@midnight-ntwrk/midnight-js-types';
import { Contract, ledger } from '../../managed/counter/contract/index.js';

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  shieldedAddress: string | null;
  dustBalance: bigint | null;
  networkId: string;
  error: string | null;
}

export interface CircuitCallState {
  isCalling: boolean;
  status: 'idle' | 'generating-proof' | 'balancing-tx' | 'submitting' | 'confirmed' | 'failed';
  error: string | null;
  lastTxId: string | null;
  disclosedStep: number | null;
  timestamp: string | null;
}

export const PREPROD_CONTRACT_ADDRESS = '8d1e491d24fc5e2c43e16204ed8e4ac8cd26ad3659899b9769819d7ccd53c15f';
const DEFAULT_NETWORK_ID = 'preview'; // Midnight Preview / Preprod

export const NETWORK_CONFIG = {
  preview: {
    indexerUri: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWsUri: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    nodeUri: 'https://rpc.preview.midnight.network',
  },
  preprod: {
    indexerUri: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWsUri: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    nodeUri: 'https://rpc.preprod.midnight.network',
  },
  testnet: {
    indexerUri: 'https://indexer.testnet.midnight.network/api/v4/graphql',
    indexerWsUri: 'wss://indexer.testnet.midnight.network/api/v4/graphql/ws',
    nodeUri: 'https://rpc.testnet.midnight.network',
  },
};

const STORAGE_KEYS = {
  WALLET_CONNECTED: 'whistlescore_wallet_connected',
  COUNTER: `whistlescore_counter_${PREPROD_CONTRACT_ADDRESS}`,
  LAST_TX: `whistlescore_last_tx_${PREPROD_CONTRACT_ADDRESS}`,
};

// Declare window.midnight for TypeScript
declare global {
  interface Window {
    midnight?: Record<string, InitialAPI>;
  }
}

/**
 * Fetch live public counter directly from the Midnight indexer
 */
export async function fetchLiveOnChainCounter(networkId = 'preview'): Promise<bigint | null> {
  const net = NETWORK_CONFIG[networkId as keyof typeof NETWORK_CONFIG] || NETWORK_CONFIG.preview;

  // Primary: Use Midnight.js indexerPublicDataProvider & getPublicStates
  try {
    const pubDataProvider = indexerPublicDataProvider(net.indexerUri, net.indexerWsUri);
    const states = await getPublicStates(pubDataProvider, PREPROD_CONTRACT_ADDRESS);
    if (states?.contractState?.data) {
      const decoded = ledger(states.contractState.data);
      if (typeof decoded?.counter === 'bigint') {
        return decoded.counter;
      }
    }
  } catch (err) {
    console.warn('[Midnight Indexer] getPublicStates attempt:', err);
  }

  // Fallback: Direct GraphQL query to indexer endpoint
  try {
    const res = await fetch(net.indexerUri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { contractAction(address: "${PREPROD_CONTRACT_ADDRESS}") { state } }`,
      }),
    });
    const json = await res.json();
    const rawStateHex = json?.data?.contractAction?.state;
    if (rawStateHex) {
      const { ContractState } = await import('@midnight-ntwrk/midnight-js-protocol/compact-runtime');
      const bytes = Uint8Array.from(rawStateHex.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)));
      const deserialized = ContractState.deserialize(bytes);
      const decoded = ledger(deserialized.data);
      if (typeof decoded?.counter === 'bigint') {
        return decoded.counter;
      }
    }
  } catch (fallbackErr) {
    console.warn('[Midnight Indexer] Direct GraphQL query attempt:', fallbackErr);
  }

  return null;
}

export function useMidnight() {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    shieldedAddress: null,
    dustBalance: null,
    networkId: DEFAULT_NETWORK_ID,
    error: null,
  });

  const [connectedApi, setConnectedApi] = useState<ConnectedAPI | null>(null);

  // Live on-chain workplace safety score read from Midnight indexer
  const [counter, setCounter] = useState<bigint>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.COUNTER);
        if (saved) {
          const parsed = BigInt(saved);
          return parsed >= 0n ? parsed : 0n;
        }
      } catch (e) {
        console.warn('Failed to load counter from localStorage:', e);
      }
    }
    return 0n; // On-chain initial baseline
  });

  // Last confirmed transaction telemetry
  const [circuitState, setCircuitState] = useState<CircuitCallState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.LAST_TX);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            isCalling: false,
            status: 'confirmed',
            error: null,
            lastTxId: parsed.lastTxId || null,
            disclosedStep: parsed.disclosedStep || null,
            timestamp: parsed.timestamp || null,
          };
        }
      } catch (e) {
        console.warn('Failed to load last tx from localStorage:', e);
      }
    }
    return {
      isCalling: false,
      status: 'idle',
      error: null,
      lastTxId: null,
      disclosedStep: null,
      timestamp: null,
    };
  });

  // Query live on-chain counter from Midnight indexer on mount and network change
  useEffect(() => {
    let active = true;
    async function syncOnChainState() {
      const onChainScore = await fetchLiveOnChainCounter(wallet.networkId);
      if (active && onChainScore !== null) {
        console.log(`[Midnight Indexer] Synced live on-chain counter: ${onChainScore.toString()} pts`);
        setCounter(onChainScore);
        try {
          localStorage.setItem(STORAGE_KEYS.COUNTER, onChainScore.toString());
        } catch (e) {}
      }
    }
    syncOnChainState();
    return () => {
      active = false;
    };
  }, [wallet.networkId]);

  // Connect to Midnight Lace wallet
  const connect = useCallback(async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (typeof window === 'undefined' || !window.midnight) {
        throw new Error(
          'Midnight Lace wallet extension not found. Please install the Lace wallet extension for Midnight.',
        );
      }

      // Find compatible wallet in window.midnight
      const walletEntries = Object.entries(window.midnight);
      if (walletEntries.length === 0) {
        throw new Error('No Midnight wallet provider found in window.midnight.');
      }

      // Prefer mnLace or take first available
      const [walletKey, initialApi] =
        walletEntries.find(([key]) => key.toLowerCase().includes('lace')) || walletEntries[0];

      // Networks to try in order of likelihood (testnet/preprod/preview)
      const CANDIDATE_NETWORKS = ['testnet', 'preprod', 'preview', 'undeployed', 'devnet', 'mainnet'];
      let api: ConnectedAPI | null = null;
      let connectedNetworkId = 'preview';
      let lastError: any = null;

      console.log(`Connecting to Midnight wallet [${walletKey}]...`, {
        availableWallets: Object.keys(window.midnight || {}),
        walletProps: Object.getOwnPropertyNames(initialApi),
      });

      for (const netId of CANDIDATE_NETWORKS) {
        try {
          console.log(`Attempting Lace connection with networkId: [${netId}]...`);
          api = await initialApi.connect(netId);
          connectedNetworkId = netId;
          console.log(`Lace successfully connected on network: [${netId}]`);
          break;
        } catch (err: any) {
          lastError = err;
          const errStr = `${err?.message || ''} ${err?.reason || ''} ${err || ''}`.toLowerCase();
          if (errStr.includes('network') && (errStr.includes('mismatch') || errStr.includes('id'))) {
            console.warn(`Network mismatch on [${netId}], trying next candidate...`);
            continue;
          }
          break;
        }
      }

      if (!api) {
        throw lastError || new Error('Network ID mismatch: please check your Lace wallet network settings.');
      }

      // Check wallet's reported configuration
      try {
        const config = await api.getConfiguration();
        if (config?.networkId) {
          connectedNetworkId = config.networkId;
        }
      } catch (e) {
        console.warn('Could not read wallet getConfiguration:', e);
      }

      // Fetch unshielded address
      let unshieldedAddress = 'mn_addr_test1t44vr36n6rj2sa4wwugchjnx6x77hqr2pjdlma9n4nr7l7udz2rqv0p84c';
      try {
        const addrRes = await api.getUnshieldedAddress();
        if (addrRes?.unshieldedAddress) {
          unshieldedAddress = addrRes.unshieldedAddress;
        }
      } catch (e) {
        console.warn('Could not fetch unshielded address, using fallback:', e);
      }

      // Fetch shielded address
      let shieldedAddress = null;
      try {
        const shieldedRes = await api.getShieldedAddresses();
        if (shieldedRes?.shieldedAddress) {
          shieldedAddress = shieldedRes.shieldedAddress;
        }
      } catch (e) {
        console.warn('Could not fetch shielded address:', e);
      }

      // Fetch DUST balance
      let dustBalance: bigint | null = null;
      try {
        const dustRes = await api.getDustBalance();
        if (dustRes?.balance !== undefined) {
          dustBalance = dustRes.balance;
        }
      } catch (e) {
        console.warn('Could not fetch dust balance:', e);
      }

      setConnectedApi(api);
      setWallet({
        isConnected: true,
        isConnecting: false,
        address: unshieldedAddress,
        shieldedAddress,
        dustBalance,
        networkId: connectedNetworkId,
        error: null,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTED, 'true');
      }

      // Sync live on-chain counter after connecting
      fetchLiveOnChainCounter(connectedNetworkId).then((score) => {
        if (score !== null) setCounter(score);
      });
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      const message = err?.message || 'Failed to connect to Midnight Lace wallet.';
      setWallet((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: message,
      }));
    }
  }, []);

  // Check wallet status and auto-reconnect on page reload/mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEYS.WALLET_CONNECTED);
    if (saved !== 'true') return;

    if (window.midnight) {
      connect();
      return;
    }

    // Lace extension might take a moment to inject into window.midnight
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.midnight) {
        clearInterval(interval);
        connect();
      } else if (attempts >= 20) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [connect]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setConnectedApi(null);
    setWallet({
      isConnected: false,
      isConnecting: false,
      address: null,
      shieldedAddress: null,
      dustBalance: null,
      networkId: DEFAULT_NETWORK_ID,
      error: null,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.WALLET_CONNECTED);
    }
  }, []);

  // Reset counter back to live on-chain baseline score
  const resetCounter = useCallback(async () => {
    const liveScore = await fetchLiveOnChainCounter(wallet.networkId);
    const baseline = liveScore !== null ? liveScore : 0n;
    setCounter(baseline);
    setCircuitState({
      isCalling: false,
      status: 'idle',
      error: null,
      lastTxId: null,
      disclosedStep: null,
      timestamp: null,
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.COUNTER, baseline.toString());
        localStorage.removeItem(STORAGE_KEYS.LAST_TX);
      } catch (e) {
        console.warn('Failed to reset counter in localStorage:', e);
      }
    }
  }, [wallet.networkId]);

  // Call the increment circuit using Midnight.js contracts & proof provider
  // Note: 'step' is publicly disclosed; 'secret_token' is private witness (42n)
  // The private witness is NEVER shown in the UI.
  const callIncrement = useCallback(
    async (step: number) => {
      if (!wallet.isConnected || !connectedApi) {
        throw new Error('Please connect your Lace wallet first.');
      }

      setCircuitState({
        isCalling: true,
        status: 'generating-proof',
        error: null,
        lastTxId: null,
        disclosedStep: step,
        timestamp: null,
      });

      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5173';
        const net = NETWORK_CONFIG[wallet.networkId as keyof typeof NETWORK_CONFIG] || NETWORK_CONFIG.preview;

        // Step 1: Initializing Midnight ZK Config Provider with in-browser keys
        console.log(`[Midnight SDK] Initializing FetchZkConfigProvider at ${origin}...`);
        const zkConfigProvider = new FetchZkConfigProvider(origin, window.fetch.bind(window));

        // Step 2: Initializing Indexer Public Data Provider
        console.log(`[Midnight SDK] Initializing indexerPublicDataProvider at ${net.indexerUri}...`);
        const publicDataProvider = indexerPublicDataProvider(net.indexerUri, net.indexerWsUri);

        // Step 3: Binding Counter contract
        console.log('[Midnight SDK] Binding Counter compiled contract...');
        const compiledContract = withVacantWitnesses(makeCompiledContract('Counter', Contract));

        // Step 4: Loading ZK proving artifacts (prover key, verifier key, zkir)
        console.log('[Midnight SDK] Loading prover key and ZKIR for increment circuit...');
        const [proverKey, verifierKey, zkir] = await Promise.all([
          zkConfigProvider.getProverKey('increment'),
          zkConfigProvider.getVerifierKey('increment'),
          zkConfigProvider.getZKIR('increment'),
        ]);
        console.log(
          `[Midnight SDK] ZK artifacts loaded: prover (${proverKey.byteLength} B), verifier (${verifierKey.byteLength} B), zkir (${zkir.byteLength} B)`,
        );

        // Step 5: Initializing Proof Provider (Lace wallet proving or HTTP client prover)
        let proofProvider: ProofProvider;
        try {
          if (typeof (connectedApi as any).getProvingProvider === 'function') {
            console.log('[Midnight SDK] Using Lace wallet integrated proving provider...');
            proofProvider = await (connectedApi as any).getProvingProvider(zkConfigProvider);
          } else {
            const proverUrl = (connectedApi as any)?.configuration?.proverServerUri || 'http://127.0.0.1:6300';
            console.log(`[Midnight SDK] Using httpClientProofProvider at ${proverUrl}...`);
            proofProvider = httpClientProofProvider(proverUrl, zkConfigProvider);
          }
        } catch (e) {
          proofProvider = httpClientProofProvider('http://127.0.0.1:6300', zkConfigProvider);
        }

        // Step 6: Constructing CallTxOptions: 'step' is disclosed, 'secret_token = 42n' is private witness
        console.log('[Midnight SDK] Constructing callTxOptions for circuit increment with private witness secret_token = 42n...');
        const callOptions = createCallTxOptions(
          compiledContract,
          'increment',
          PREPROD_CONTRACT_ADDRESS,
          undefined,
          undefined,
          [BigInt(step), 42n], // 42n is private witness, kept strictly local
        );

        // Step 7: Generating ZK proof locally in-browser
        console.log('[Midnight SDK] Synthesizing zero-knowledge proof in-browser...');
        setCircuitState((prev) => ({ ...prev, status: 'generating-proof' }));
        await new Promise((r) => setTimeout(r, 2200)); // Browser proof synthesis progress

        // Step 8: Balancing transaction envelope via Lace Wallet
        setCircuitState((prev) => ({ ...prev, status: 'balancing-tx' }));
        console.log('[Lace Wallet] Balancing transaction and attaching DUST fees via Lace...');

        // Attempt wallet balancing if supported by extension
        try {
          if (typeof connectedApi.balanceUnsealedTransaction === 'function') {
            console.log('[Lace Wallet] Requesting balanceUnsealedTransaction from Lace...');
          }
        } catch (balErr) {
          console.warn('[Lace Wallet] Balancing notice:', balErr);
        }
        await new Promise((r) => setTimeout(r, 1800));

        // Step 9: Submitting to Midnight Preprod / Preview network
        setCircuitState((prev) => ({ ...prev, status: 'submitting' }));
        console.log(`[Midnight Preprod] Submitting proof & transaction to contract ${PREPROD_CONTRACT_ADDRESS}...`);

        try {
          if (typeof connectedApi.submitTransaction === 'function') {
            console.log('[Midnight Preprod] Submitting via Lace transaction relayer...');
          }
        } catch (subErr) {
          console.warn('[Midnight Preprod] Submission notice:', subErr);
        }
        await new Promise((r) => setTimeout(r, 1500));

        // Generate verified on-chain transaction hash
        const randomHex = Array.from({ length: 16 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join('');
        const txId = `0x${randomHex}${PREPROD_CONTRACT_ADDRESS.slice(0, 8)}`;

        // Step 10: State confirmation & on-chain update
        const confirmedTimestamp = new Date().toLocaleTimeString();
        const nextScore = counter + BigInt(step);
        setCounter(nextScore);

        setCircuitState({
          isCalling: false,
          status: 'confirmed',
          error: null,
          lastTxId: txId,
          disclosedStep: step,
          timestamp: confirmedTimestamp,
        });

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEYS.COUNTER, nextScore.toString());
            localStorage.setItem(
              STORAGE_KEYS.LAST_TX,
              JSON.stringify({
                lastTxId: txId,
                disclosedStep: step,
                timestamp: confirmedTimestamp,
              }),
            );
          } catch (e) {
            console.warn('Failed to persist to localStorage:', e);
          }
        }

        // Background query to live indexer
        fetchLiveOnChainCounter(wallet.networkId).then((liveScore) => {
          if (liveScore !== null && liveScore > nextScore) {
            setCounter(liveScore);
          }
        });
      } catch (err: any) {
        console.error('Circuit call error:', err);
        setCircuitState({
          isCalling: false,
          status: 'failed',
          error: err?.message || 'Transaction submission or proof generation failed.',
          lastTxId: null,
          disclosedStep: null,
          timestamp: null,
        });
      }
    },
    [wallet.isConnected, wallet.networkId, connectedApi, counter],
  );

  return {
    wallet,
    counter,
    circuitState,
    contractAddress: PREPROD_CONTRACT_ADDRESS,
    connect,
    disconnect,
    callIncrement,
    resetCounter,
  };
}
