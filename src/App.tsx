import React, { useState, useEffect } from 'react';
import { HelpCircle, X, ExternalLink, ShieldCheck, Lock, Eye } from 'lucide-react';
import { useMidnight, PREPROD_CONTRACT_ADDRESS } from './hooks/useMidnight';
import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';

const DREAMY_SCENES = [
  { id: 'crescent', name: 'Crescent Dawn', path: '/images/dream_beacon.jpg', label: 'THE FIRST THREAD OF LIGHT' },
  { id: 'hills', name: 'Rolling Pastures', path: '/images/dream_crescent_2.jpg', label: 'PEACEFUL HORIZON' },
  { id: 'mound', name: 'Wildflower Mound', path: '/images/meadow_clean.jpg', label: 'PASTORAL DIORAMA' },
];

export const App: React.FC = () => {
  const [activeScene, setActiveScene] = useState(DREAMY_SCENES[0]);
  const [isAutoCycle, setIsAutoCycle] = useState<boolean>(true);
  const [showInfo, setShowInfo] = useState(false);

  const {
    wallet,
    counter,
    circuitState,
    contractAddress,
    connect,
    disconnect,
    callIncrement,
    resetCounter,
  } = useMidnight();

  // Smooth Auto-Cycle Timer
  useEffect(() => {
    if (!isAutoCycle) return;
    const interval = setInterval(() => {
      setActiveScene((current) => {
        const nextIdx = (DREAMY_SCENES.findIndex((s) => s.id === current.id) + 1) % DREAMY_SCENES.length;
        return DREAMY_SCENES[nextIdx];
      });
    }, 6500);

    return () => clearInterval(interval);
  }, [isAutoCycle]);

  return (
    <div className="pastoral-stage">
      {/* Smooth Crossfade Background Image Layers */}
      <div className="pastoral-bg-container">
        {DREAMY_SCENES.map((scene) => (
          <div
            key={scene.id}
            className={`pastoral-bg-layer ${activeScene.id === scene.id ? 'active' : ''}`}
            style={{ backgroundImage: `url(${scene.path})` }}
          />
        ))}
      </div>

      {/* Soft Daylight Backdrop Glow */}
      <div className="pastoral-vignette" />

      {/* Top Header */}
      <header className="stage-header">
        <div className="brand-wrapper">
          <div className="brand-title-pixel">
            <span className="pixel-dot" />
            <span>WHISTLESCORE</span>
          </div>
          {/* High-visibility thread pill in pixel font */}
          <div className="thread-light-badge-daylight">
            THE FIRST THREAD OF LIGHT • CYCLE 02
          </div>
        </div>

        <div className="header-actions">
          {/* Info '?' Button */}
          <button
            onClick={() => setShowInfo(true)}
            className="btn-info-circle-daylight"
            title="About WhistleScore & The Privacy Model"
          >
            ?
          </button>

          {/* Wallet Connect Pill */}
          <WalletConnect
            wallet={wallet}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
      </header>

      {/* Center Editorial Focus with Pixel Typography */}
      <main className="stage-center">
        <div className="hero-text-block">
          <h1 className="pixel-headline">
            <span>WHISTLE</span>
            <span>SCORE</span>
          </h1>

          <p className="pixel-sub">
            Workplace safety verified on the Midnight blockchain. The public ledger records the score; zero-knowledge proofs protect the whistleblower.
          </p>
        </div>

        {/* Daylight Frosted Capsule Dock */}
        <CircuitCall
          wallet={wallet}
          counter={counter}
          circuitState={circuitState}
          contractAddress={contractAddress}
          onIncrement={callIncrement}
          onResetCounter={resetCounter}
        />
      </main>

      {/* Bottom Technical Stamps */}
      <footer className="stage-footer">
        <div className="footer-stamp-box-daylight">
          <span>CONTRACT // <span className="stamp-accent">{PREPROD_CONTRACT_ADDRESS.slice(0, 16)}...</span></span>
          <span style={{ fontSize: '10px', opacity: 0.8 }}>
            PUBLIC: counter, step • WITNESS: secret_token
          </span>
        </div>

        <div className="atmosphere-stamp-card">
          {/* Top Row: Scene Name & Cute Cycle Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', opacity: 0.7, letterSpacing: '1px' }}>ATMOSPHERE //</span>
              <span className="stamp-accent" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                {activeScene.name.toUpperCase()}
              </span>
            </div>

            {/* Cute Cycle Auto / Manual Toggle Button */}
            <button
              type="button"
              onClick={() => setIsAutoCycle((prev) => !prev)}
              className="btn-cycle-toggle"
              title={isAutoCycle ? 'Click to switch to Manual cycling' : 'Click to switch to Auto cycling'}
            >
              <span className={`toggle-track ${isAutoCycle ? 'active' : ''}`}>
                <span className="toggle-thumb" />
              </span>
              <span className="cycle-text-label">CYCLE: {isAutoCycle ? 'AUTO' : 'MANUAL'}</span>
            </button>
          </div>

          {/* Bottom Row: Narrative Label & Switcher Dots */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.5px', color: 'var(--meadow-green)' }}>
              {activeScene.label}
            </span>

            <div className="scene-switcher">
              {DREAMY_SCENES.map((scene) => (
                <span
                  key={scene.id}
                  onClick={() => {
                    setActiveScene(scene);
                  }}
                  title={scene.name}
                  className={`scene-dot-daylight ${activeScene.id === scene.id ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Information / Privacy Model Modal */}
      {showInfo && (
        <div className="info-modal-backdrop" onClick={() => setShowInfo(false)}>
          <div className="info-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">About WhistleScore</div>
              <button
                onClick={() => setShowInfo(false)}
                className="modal-close-btn"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-section">
              <div className="modal-section-title">What is WhistleScore?</div>
              <p className="modal-section-body">
                WhistleScore is a privacy-first workplace safety auditing dApp. In high-risk industries, employees often hesitate to report violations out of fear of retaliation. WhistleScore allows workers to increment an immutable public hazard score using zero-knowledge proofs without exposing their identity or credentials.
              </p>
            </div>

            <div className="modal-section">
              <div className="modal-section-title">The Midnight Privacy Model</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={14} color="#38bdf8" />
                  <span><strong>PUBLIC:</strong> The cumulative <code>counter</code> and the disclosed increment <code>step</code> (+1, +3, +5).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={14} color="#fde68a" />
                  <span><strong>PRIVATE WITNESS:</strong> The <code>secret_token</code> (must equal 42). Stays strictly on your machine.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={14} color="#34d399" />
                  <span><strong>PROVED:</strong> You mathematically prove knowledge of the valid authorization token without revealing it.</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <div className="modal-section-title">Preprod Contract Telemetry</div>
              <div className="modal-telemetry-box">
                {PREPROD_CONTRACT_ADDRESS}
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                Target Network: Midnight Preprod / Preview • Circuit: increment(step, secret_token)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
