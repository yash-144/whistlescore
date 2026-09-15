import React, { useState } from 'react';
import { EyeOff, Sparkles, Loader2, Check, RotateCcw, AlertCircle } from 'lucide-react';
import type { CircuitCallState, WalletState } from '../hooks/useMidnight';

interface CircuitCallProps {
  wallet: WalletState;
  counter: bigint;
  circuitState: CircuitCallState;
  contractAddress: string;
  onIncrement: (step: number) => Promise<void>;
  onResetCounter?: () => void;
}

export const CircuitCall: React.FC<CircuitCallProps> = ({
  wallet,
  counter,
  circuitState,
  contractAddress,
  onIncrement,
  onResetCounter,
}) => {
  const [selectedStep, setSelectedStep] = useState<number>(1);

  const handleExecute = () => {
    if (!wallet.isConnected) return;
    onIncrement(selectedStep);
  };

  return (
    <div className="capsule-dock-wrapper">
      {/* Floating Glowing Capsule (Direct Image 3 "Hey." Inspiration) */}
      <div className="capsule-dock">
        {/* Score Counter */}
        <div className="dock-score-col" title="Public Hazard Score (persisted on-chain)">
          <div className="dock-score-row">
            <span className="dock-score-num">{counter.toString()}</span>
            {counter > 0n && onResetCounter && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onResetCounter();
                }}
                className="btn-score-reset"
                title="Reset counter to on-chain baseline"
              >
                <RotateCcw size={10} />
              </button>
            )}
          </div>
          <span className="dock-score-tag">Points</span>
        </div>

        {/* Severity Selectors */}
        <div className="dock-step-group">
          {[1, 3, 5].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => setSelectedStep(step)}
              disabled={circuitState.isCalling}
              className={`dock-pill-btn ${selectedStep === step ? 'active' : ''}`}
            >
              +{step}
            </button>
          ))}
        </div>

        {/* Main Action Trigger */}
        <button
          onClick={handleExecute}
          disabled={!wallet.isConnected || circuitState.isCalling}
          className="dock-action-btn"
        >
          {circuitState.isCalling ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>Proving Circuit...</span>
            </>
          ) : !wallet.isConnected ? (
            <span>Connect Wallet First</span>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Prove & Record (+{selectedStep})</span>
            </>
          )}
        </button>
      </div>

      {/* Surface Reflection (Matching Reference Image 3) */}
      <div className="capsule-reflection" />

      {/* Mandatory Requirement: Proved without revealing your input with Neon Bloom */}
      <div className="mandatory-privacy-pill">
        <EyeOff size={13} />
        <span>Proved without revealing your input</span>
      </div>

      {/* Live Telemetry Progress Line */}
      {circuitState.isCalling && (
        <div className="execution-telemetry">
          <Loader2 size={13} className="spin" />
          <span>
            {circuitState.status === 'generating-proof' && 'Synthesizing ZK proof in local browser...'}
            {circuitState.status === 'balancing-tx' && 'Balancing transaction envelope via Lace...'}
            {circuitState.status === 'submitting' && 'Settling on Midnight Preprod blockchain...'}
          </span>
        </div>
      )}

      {/* Confirmed Line */}
      {circuitState.status === 'confirmed' && (
        <div
          className="execution-telemetry"
          style={{
            color: '#34d399',
            borderColor: 'rgba(52, 211, 153, 0.4)',
            boxShadow: '0 0 20px rgba(52, 211, 153, 0.25)',
          }}
        >
          <Check size={13} />
          <span>
            Confirmed on-chain (+{circuitState.disclosedStep} pts) • Tx: {circuitState.lastTxId}
          </span>
        </div>
      )}

      {/* Error Line */}
      {circuitState.error && (
        <div
          className="execution-telemetry execution-error"
          role="alert"
        >
          <AlertCircle size={13} />
          <span>{circuitState.error}</span>
        </div>
      )}
    </div>
  );
};
