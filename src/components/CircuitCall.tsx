import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Flame,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';
import type { CircuitCallState, WalletState } from '../hooks/useMidnight';

interface CircuitCallProps {
  wallet: WalletState;
  counter: bigint;
  circuitState: CircuitCallState;
  contractAddress: string;
  onIncrement: (step: number) => Promise<void>;
}

export const CircuitCall: React.FC<CircuitCallProps> = ({
  wallet,
  counter,
  circuitState,
  contractAddress,
  onIncrement,
}) => {
  const [selectedStep, setSelectedStep] = useState<number>(1);

  const handleExecute = () => {
    if (!wallet.isConnected) return;
    onIncrement(selectedStep);
  };

  return (
    <div className="glass-panel" style={{ padding: '32px' }}>
      {/* Title & Privacy Label */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
            Submit Workplace Hazard Point
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Execute the <code style={{ color: '#818cf8' }}>increment</code> circuit with zero-knowledge authorization.
          </p>
        </div>

        {/* Mandatory Requirement: 'Proved without revealing your input' */}
        <div className="privacy-badge">
          <EyeOff size={15} />
          <span>Proved without revealing your input</span>
        </div>
      </div>

      {/* Incident Severity Selection */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: '#cbd5e1',
            marginBottom: '10px',
          }}
        >
          Disclosed Incident Severity (Step Increment):
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}
        >
          {[
            { step: 1, label: 'Minor Hazard (+1)', desc: 'Near-miss or ergonomics' },
            { step: 3, label: 'Moderate Concern (+3)', desc: 'Safety standard lapse' },
            { step: 5, label: 'Critical Violation (+5)', desc: 'Severe breach or danger' },
          ].map((item) => {
            const isSelected = selectedStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setSelectedStep(item.step)}
                disabled={circuitState.isCalling}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.15))'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected
                    ? '1px solid rgba(99, 102, 241, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px 12px',
                  textAlign: 'left',
                  cursor: circuitState.isCalling ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(99, 102, 241, 0.2)' : 'none',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: isSelected ? '#ffffff' : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Flame size={15} color={isSelected ? '#38bdf8' : '#64748b'} />
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: isSelected ? '#a5b4fc' : '#64748b',
                    marginTop: '4px',
                  }}
                >
                  {item.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Privacy Guarantee Explanation (Explicitly stating private input is hidden) */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 600 }}>
          <Fingerprint size={16} />
          <span>Zero-Knowledge Proof Guarantee</span>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
          Your authorization witness (<code style={{ color: '#818cf8' }}>secret_token</code>) is held entirely in private memory and evaluated inside the local circuit. It is <strong>never displayed in the UI</strong> and <strong>never transmitted to the network</strong>. Only the proof of validity and disclosed severity step (<code style={{ color: '#34d399' }}>+{selectedStep}</code>) are published on-chain.
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleExecute}
        disabled={!wallet.isConnected || circuitState.isCalling}
        className="btn-primary"
        style={{ width: '100%', padding: '14px 20px', fontSize: '15px' }}
      >
        {circuitState.isCalling ? (
          <>
            <Loader2 size={18} className="spin" />
            <span>
              {circuitState.status === 'generating-proof' && 'Generating ZK Proof in Browser...'}
              {circuitState.status === 'balancing-tx' && 'Balancing with Lace Wallet...'}
              {circuitState.status === 'submitting' && 'Submitting to Midnight Preprod...'}
            </span>
          </>
        ) : !wallet.isConnected ? (
          <>
            <Lock size={16} />
            <span>Connect Lace Wallet to Call Circuit</span>
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            <span>Generate Proof & Call Circuit (+{selectedStep})</span>
          </>
        )}
      </button>

      {/* Step-by-Step Progress Feedback */}
      {circuitState.isCalling && (
        <div className="progress-stepper">
          <div
            className={`step-item ${
              circuitState.status === 'generating-proof'
                ? 'active'
                : ['balancing-tx', 'submitting', 'confirmed'].includes(circuitState.status)
                ? 'done'
                : ''
            }`}
          >
            {circuitState.status === 'generating-proof' ? (
              <Loader2 size={16} className="spin" color="#818cf8" />
            ) : (
              <CheckCircle size={16} color="#10b981" />
            )}
            <div>
              <strong>1. Local ZK Prover:</strong> Synthesizing proof for secret voucher witness locally in browser
            </div>
          </div>

          <div
            className={`step-item ${
              circuitState.status === 'balancing-tx'
                ? 'active'
                : ['submitting', 'confirmed'].includes(circuitState.status)
                ? 'done'
                : ''
            }`}
          >
            {circuitState.status === 'balancing-tx' ? (
              <Loader2 size={16} className="spin" color="#818cf8" />
            ) : ['submitting', 'confirmed'].includes(circuitState.status) ? (
              <CheckCircle size={16} color="#10b981" />
            ) : (
              <div style={{ width: '16px' }} />
            )}
            <div>
              <strong>2. Wallet Balancing:</strong> Attaching DUST fees and signing transaction envelope via Lace
            </div>
          </div>

          <div
            className={`step-item ${
              circuitState.status === 'submitting'
                ? 'active'
                : circuitState.status === 'confirmed'
                ? 'done'
                : ''
            }`}
          >
            {circuitState.status === 'submitting' ? (
              <Loader2 size={16} className="spin" color="#818cf8" />
            ) : circuitState.status === 'confirmed' ? (
              <CheckCircle size={16} color="#10b981" />
            ) : (
              <div style={{ width: '16px' }} />
            )}
            <div>
              <strong>3. On-Chain Settlement:</strong> Broadcasting finalized proof to Midnight Preprod ledger
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Result Display */}
      {circuitState.status === 'confirmed' && (
        <div
          style={{
            marginTop: '20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.05))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <CheckCircle size={20} color="#34d399" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#34d399' }}>
              Circuit Successfully Executed On-Chain!
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <strong>Added to Public Counter:</strong>{' '}
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>+{circuitState.disclosedStep} Severity Points</span>
            </div>
            <div>
              <strong>Transaction ID:</strong>{' '}
              <span className="mono" style={{ color: '#94a3b8' }}>{circuitState.lastTxId}</span>
            </div>
            <div>
              <strong>Contract:</strong>{' '}
              <span className="mono" style={{ color: '#94a3b8' }}>{contractAddress.slice(0, 16)}...</span>
            </div>
            <div>
              <strong>Confirmed Time:</strong>{' '}
              <span style={{ color: '#94a3b8' }}>{circuitState.timestamp}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {circuitState.status === 'failed' && (
        <div
          style={{
            marginTop: '20px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            color: '#fb7185',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px' }}>
            <strong>Execution Error:</strong> {circuitState.error}
          </div>
        </div>
      )}
    </div>
  );
};
