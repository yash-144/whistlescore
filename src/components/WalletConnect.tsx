import React, { useState } from 'react';
import { Wallet, LogOut, CheckCircle2, AlertTriangle, Copy, ExternalLink, Shield } from 'lucide-react';
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

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {wallet.isConnected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Network Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '12px',
              fontWeight: 600,
              color: '#34d399',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            Preprod / Preview
          </div>

          {/* Connected Address Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Shield size={15} color="#818cf8" />
            <span className="mono" style={{ fontSize: '13px', color: '#e2e8f0' }}>
              {truncateAddress(wallet.address || '')}
            </span>
            <button
              onClick={copyAddress}
              title="Copy Address"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: copied ? '#34d399' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            </button>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={onDisconnect}
            className="btn-danger"
            title="Disconnect Wallet"
          >
            <LogOut size={14} />
            <span>Disconnect</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onConnect}
            disabled={wallet.isConnecting}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            <Wallet size={16} />
            <span>{wallet.isConnecting ? 'Connecting...' : 'Connect Lace Wallet'}</span>
          </button>
        </div>
      )}

      {/* Error notification if connection failed */}
      {wallet.error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontSize: '12px',
            marginTop: '4px',
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Wallet Notice:</strong> {wallet.error}
            <div style={{ marginTop: '4px', color: '#fda4af' }}>
              Tip: Ensure the Midnight Lace browser extension is unlocked and configured for the Midnight testnet.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
