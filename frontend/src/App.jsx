import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import VaultDashboard from './components/VaultDashboard'
import './App.css'

function App() {
  const { isConnected } = useAccount()

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>// ETH_VAULT &gt; dashboard</h1>
          <ConnectButton />
        </div>
      </header>

      <main className="main-content">
        {isConnected ? (
          <VaultDashboard />
        ) : (
          <div className="connect-prompt">
            <h2>ETH Vault</h2>
            <p>connect your wallet to start earning rewards on your ETH deposits</p>
            <div className="features">
              <div className="feature">
                <h3>[ SECURE ]</h3>
                <p>Upgradeable smart contracts with comprehensive auditing</p>
              </div>
              <div className="feature">
                <h3>[ EARN ]</h3>
                <p>Earn interest on your ETH deposits over time</p>
              </div>
              <div className="feature">
                <h3>[ TESTNET ]</h3>
                <p>Test safely on Sepolia with free ETH from faucets</p>
              </div>
            </div>
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'rgba(0, 255, 100, 0.03)',
              borderRadius: '4px',
              border: '1px solid rgba(0, 255, 100, 0.2)'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#00ff64', letterSpacing: '3px', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                // supported_networks
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid rgba(0,255,100,0.15)', borderRadius: '2px' }}>
                  <h4 style={{ color: '#00e5ff', marginBottom: '0.5rem', letterSpacing: '1px' }}>SEPOLIA TESTNET</h4>
                  <p style={{ fontSize: '0.85rem', opacity: '0.6' }}>Free testing with faucet ETH</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid rgba(0,255,100,0.15)', borderRadius: '2px' }}>
                  <h4 style={{ color: '#00e5ff', marginBottom: '0.5rem', letterSpacing: '1px' }}>HARDHAT LOCAL</h4>
                  <p style={{ fontSize: '0.85rem', opacity: '0.6' }}>Local development environment</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
