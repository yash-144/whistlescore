import React, { useState } from 'react';
import { Copy, Check, LogOut } from 'lucide-react';
import type { WalletState } from '../hooks/useMidnight';

interface WalletConnectProps {
  wallet: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  wallet,
  onConnect,
  onDisconnect,
}) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  if (wallet.isConnected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={copyAddress}
          className="btn-glass-pill connected"
          title="Click to copy connected address"
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              boxShadow: '0 0 8px #16a34a',
            }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.5px' }}>
            {truncateAddress(wallet.address || '')}
          </span>
          {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} color="rgba(41,76,35,0.5)" />}
        </button>

        <button
          onClick={onDisconnect}
          className="btn-glass-pill"
          style={{ padding: '8px 12px' }}
          title="Disconnect wallet"
        >
          <LogOut size={12} color="#294c23" />
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={onConnect}
        disabled={wallet.isConnecting}
        className="btn-glass-pill"
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#294c23',
            boxShadow: '0 0 8px #294c23',
          }}
        />
        <span>{wallet.isConnecting ? 'Connecting...' : 'Connect Lace'}</span>
      </button>

      {wallet.error && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-pixel)',
            fontSize: '11px',
            fontWeight: 600,
            color: '#b91c1c',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1.5px solid rgba(239, 68, 68, 0.6)',
            padding: '5px 12px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(185, 28, 28, 0.12)',
            zIndex: 50,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {wallet.error}
        </div>
      )}
    </div>
  );
};
