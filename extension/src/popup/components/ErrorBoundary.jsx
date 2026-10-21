import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[AvtoGaraža] Render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 200,
        padding: '24px',
        gap: '12px',
        color: '#e2e8f0',
        textAlign: 'center',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <strong style={{ fontSize: 15 }}>Napaka pri prikazu</strong>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
          Prišlo je do nepričakovane napake. Poskusite znova odpreti razširitev.
        </p>
        {this.state.error && (
          <code style={{ fontSize: 11, color: '#475569', wordBreak: 'break-all' }}>
            {this.state.error.message}
          </code>
        )}
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          style={{
            marginTop: 8,
            padding: '6px 16px',
            borderRadius: 8,
            border: '1px solid #334155',
            background: '#1c2130',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Poskusi znova
        </button>
      </div>
    );
  }
}
