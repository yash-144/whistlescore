import React from 'react';
import {
  ShieldAlert,
  Radio,
  FileCode2,
  Lock,
  Eye,
  CheckCircle2,
  Activity,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useMidnight, PREPROD_CONTRACT_ADDRESS } from './hooks/useMidnight';
import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';

export const App: React.FC = () => {
  const {
    wallet,
    counter,
    circuitState,
    contractAddress,
    connect,
    disconnect,
    callIncrement,
  } = useMidnight();

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="logo-icon">
            <ShieldAlert size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="brand-title">WhistleScore</span>
              <span className="brand-tag">Level 2 • Preprod</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Privacy-Preserving Safety Auditing on Midnight
            </div>
          </div>
        </div>

        <WalletConnect
          wallet={wallet}
          onConnect={connect}
          onDisconnect={disconnect}
        />
      </header>

      {/* Hero Section */}
      <section className="glass-panel hero-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#38bdf8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Zero-Knowledge Workplace Reporting
          </span>
        </div>
        <h1 className="hero-title">
          Empowering Whistleblowers with <span>Uncompromising Privacy</span>.
        </h1>
        <p className="hero-desc">
          WhistleScore allows verified personnel to record safety violations and hazard severity directly into a public, tamper-proof company ledger. Employees prove their authorization token locally via zero-knowledge proofs without exposing their identity or credentials.
        </p>
      </section>

      {/* Main Grid */}
      <main className="main-grid">
        {/* Left Column: State & Privacy Model */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Public Counter Box */}
          <div className="glass-panel counter-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
              <Activity size={16} color="#6366f1" />
              <span>Public Cumulative Hazard Score</span>
            </div>
            <div className="counter-value">{counter.toString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
              Verified On-Chain Ledger State ({wallet.networkId})
            </div>
          </div>

          {/* Privacy Model Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Layers size={18} color="#06b6d4" />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>WhistleScore Privacy Model</h3>
            </div>

            <table className="privacy-table">
              <thead>
                <tr>
                  <th>Field / Property</th>
                  <th>Visibility</th>
                  <th>Observation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>
                    <code>counter</code>
                  </td>
                  <td>
                    <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={13} /> Public
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>Visible to auditors and regulators on-chain</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>
                    <code>step</code>
                  </td>
                  <td>
                    <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={13} /> Disclosed
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>Revealed during increment transaction</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>
                    <code>secret_token</code>
                  </td>
                  <td>
                    <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={13} /> Private Witness
                    </span>
                  </td>
                  <td style={{ color: '#34d399' }}>Never leaves browser; proven locally via ZK</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Contract Deployment Info Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <FileCode2 size={18} color="#818cf8" />
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Contract Details</h3>
            </div>
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ color: 'var(--text-subtle)', marginBottom: '2px' }}>Preprod Contract Address:</div>
                <div className="mono" style={{ color: '#e2e8f0', wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {contractAddress}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Target Network:</span>
                <strong style={{ color: '#e2e8f0' }}>Midnight Preprod / Preview</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Contract Type:</span>
                <strong style={{ color: '#e2e8f0' }}>Compact (v0.23+)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Circuit Execution */}
        <div>
          <CircuitCall
            wallet={wallet}
            counter={counter}
            circuitState={circuitState}
            contractAddress={contractAddress}
            onIncrement={callIncrement}
          />
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '24px 0',
          color: 'var(--text-subtle)',
          fontSize: '13px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          marginTop: '20px',
        }}
      >
        <p>
          WhistleScore • Midnight Builder Challenge Level 2 • Built with Compact, Midnight.js & Lace Wallet
        </p>
      </footer>
    </div>
  );
};
