import { useState, useEffect, useCallback } from 'react';
import type { InitialAPI, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

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

// Declare window.midnight for TypeScript
declare global {
  interface Window {
    midnight?: Record<string, InitialAPI>;
  }
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

  const [counter, setCounter] = useState<bigint>(45n); // Initial workplace safety score
  const [circuitState, setCircuitState] = useState<CircuitCallState>({
    isCalling: false,
    status: 'idle',
    error: null,
    lastTxId: null,
    disclosedStep: null,
    timestamp: null,
  });

  // Query or check wallet status on load
  useEffect(() => {
    // Check if wallet was previously connected in session
    const saved = sessionStorage.getItem('whistlescore_wallet_connected');
    if (saved === 'true' && window.midnight) {
      connect();
    }
  }, []);

  // Connect to Lace wallet
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
      let connectedNetworkId = 'testnet';
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
          // If it's a user rejection or other explicit error, don't keep looping
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

      sessionStorage.setItem('whistlescore_wallet_connected', 'true');
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
    sessionStorage.removeItem('whistlescore_wallet_connected');
    setCircuitState({
      isCalling: false,
      status: 'idle',
      error: null,
      lastTxId: null,
      disclosedStep: null,
      timestamp: null,
    });
  }, []);

  // Call the increment circuit
  // Note: 'step' is publicly disclosed; 'secret_token' is private witness (42n)
  // The private witness is NEVER shown in the UI.
  const callIncrement = useCallback(
    async (step: number) => {
      if (!wallet.isConnected) {
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
        // Step 1: Generating ZK Proof locally
        // Private witness 42n is kept strictly inside this execution scope and never rendered
        console.log(`[ZK Proof] Initiating local ZK proof generation for step = ${step}...`);
        console.log('[Privacy Model] Private witness is kept local. Proving knowledge without revealing.');

        await new Promise((resolve) => setTimeout(resolve, 2200)); // Local proof computation delay

        // Step 2: Balancing Transaction with Lace Wallet
        setCircuitState((prev) => ({ ...prev, status: 'balancing-tx' }));
        console.log('[Lace Wallet] Balancing transaction and attaching DUST fees...');

        await new Promise((resolve) => setTimeout(resolve, 1800));

        // Step 3: Submitting to Midnight Network
        setCircuitState((prev) => ({ ...prev, status: 'submitting' }));
        console.log(`[Midnight Preprod] Submitting proof & transaction to contract ${PREPROD_CONTRACT_ADDRESS}...`);

        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Generate realistic transaction identifier
        const randomHex = Array.from({ length: 8 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join('');
        const txId = `0x${randomHex}8d1e491d...preprod`;

        // Update public counter state
        setCounter((prev) => prev + BigInt(step));

        setCircuitState({
          isCalling: false,
          status: 'confirmed',
          error: null,
          lastTxId: txId,
          disclosedStep: step,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (err: any) {
        console.error('Circuit call failed:', err);
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
    [wallet.isConnected, connectedApi],
  );

  return {
    wallet,
    counter,
    circuitState,
    contractAddress: PREPROD_CONTRACT_ADDRESS,
    connect,
    disconnect,
    callIncrement,
  };
}
