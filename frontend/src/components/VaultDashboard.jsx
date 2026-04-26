import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { VAULT_ABI, getVaultAddress } from '../contracts/VaultABI'

const VaultDashboard = () => {
  const { address } = useAccount()
  const chainId = useChainId()
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const vaultAddress = getVaultAddress(chainId)

  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'getBalance',
    args: [address],
  })

  const { data: userDeposit, refetch: refetchDeposit } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'deposits',
    args: [address],
  })

  const { data: pendingReward, refetch: refetchReward } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'calculateReward',
    args: [address],
  })

  const { data: totalEthLocked } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'totalEthLocked',
  })

  const { data: rewardMultiplier } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'rewardMultiplier',
  })

  const { data: contractVersion } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'version',
  })

  const {
    writeContract: deposit,
    data: depositHash,
    isPending: isDepositPending,
    error: depositError
  } = useWriteContract()

  const {
    writeContract: withdraw,
    data: withdrawHash,
    isPending: isWithdrawPending,
    error: withdrawError
  } = useWriteContract()

  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({ hash: depositHash })
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed } = useWaitForTransactionReceipt({ hash: withdrawHash })

  useEffect(() => {
    if (isDepositConfirmed || isWithdrawConfirmed) {
      refetchBalance()
      refetchDeposit()
      refetchReward()
    }
  }, [isDepositConfirmed, isWithdrawConfirmed, refetchBalance, refetchDeposit, refetchReward])

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return
    try {
      deposit({ address: vaultAddress, abi: VAULT_ABI, functionName: 'deposit', value: parseEther(depositAmount) })
    } catch (error) {
      console.error('Deposit error:', error)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return
    try {
      const amount = withdrawAmount === 'all' ? 0n : parseEther(withdrawAmount)
      withdraw({ address: vaultAddress, abi: VAULT_ABI, functionName: 'withdraw', args: [amount] })
    } catch (error) {
      console.error('Withdraw error:', error)
    }
  }

  const getTransactionStatus = () => {
    if (isDepositPending || isDepositConfirming) return { type: 'pending', message: '> deposit transaction pending...' }
    if (isWithdrawPending || isWithdrawConfirming) return { type: 'pending', message: '> withdraw transaction pending...' }
    if (isDepositConfirmed) return { type: 'success', message: '> deposit confirmed.' }
    if (isWithdrawConfirmed) return { type: 'success', message: '> withdrawal confirmed.' }
    if (depositError) return { type: 'error', message: `> error: ${depositError.message}` }
    if (withdrawError) return { type: 'error', message: `> error: ${withdrawError.message}` }
    return null
  }

  const status = getTransactionStatus()

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case 11155111: return 'SEPOLIA'
      case 31337: return 'HARDHAT_LOCAL'
      default: return `UNKNOWN_${chainId}`
    }
  }

  const isContractDeployed = vaultAddress && vaultAddress !== '0x0000000000000000000000000000000000000000'
  const isSupportedNetwork = chainId === 11155111 || chainId === 31337

  if (!isSupportedNetwork) {
    return (
      <div className="dashboard">
        <div className="card">
          <h3>[ ERROR ] Unsupported Network</h3>
          <p style={{ opacity: 0.7, marginBottom: '1rem' }}>Current network: {getNetworkName(chainId)}</p>
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: '#00ff64', marginBottom: '0.5rem', fontSize: '0.8rem', letterSpacing: '1px' }}>SUPPORTED NETWORKS:</p>
            <ul style={{ textAlign: 'left', marginTop: '0.5rem', paddingLeft: '1.2rem', opacity: 0.7, lineHeight: 2 }}>
              <li>Sepolia Testnet — testing with free ETH</li>
              <li>Hardhat Local — local development</li>
            </ul>
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,255,100,0.04)', border: '1px solid rgba(0,255,100,0.2)', borderRadius: '2px' }}>
            <p style={{ color: '#00e5ff', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>// HOW TO SWITCH</p>
            <p style={{ opacity: 0.6, fontSize: '0.85rem', lineHeight: 1.8 }}>
              1. Open MetaMask<br />
              2. Click the network dropdown<br />
              3. Select "Sepolia test network"
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isContractDeployed) {
    return (
      <div className="dashboard">
        <div className="card">
          <h3>[ WARN ] Contract Not Deployed</h3>
          <p style={{ opacity: 0.7, marginBottom: '0.5rem' }}>No vault contract found on {getNetworkName(chainId)}.</p>
          <p style={{ opacity: 0.5, fontSize: '0.85rem', wordBreak: 'break-all' }}>
            address: {vaultAddress || 'not configured'}
          </p>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.2rem', opacity: 0.7, lineHeight: 2, fontSize: '0.9rem' }}>
            <li>Deploy the contract to this network, or</li>
            <li>Switch to Sepolia testnet</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">

      {/* Network Info */}
      <div className="card">
        <h3>// network_info</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{getNetworkName(chainId)}</div>
            <div className="stat-label">Network</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ fontSize: '0.7rem' }}>{vaultAddress}</div>
            <div className="stat-label">Contract Address</div>
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="card">
        <h3>// your_balance</h3>
        <div className="balance-display">
          {userBalance ? `${parseFloat(formatEther(userBalance)).toFixed(4)} ETH` : '0.0000 ETH'}
        </div>
        <div className="reward-display">
          pending_rewards: {pendingReward ? `${parseFloat(formatEther(pendingReward)).toFixed(6)} ETH` : '0.000000 ETH'}
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">
              {userDeposit ? `${parseFloat(formatEther(userDeposit[0] || 0n)).toFixed(4)}` : '0.0000'}
            </div>
            <div className="stat-label">Principal (ETH)</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ fontSize: '0.9rem' }}>
              {userDeposit && userDeposit[1] ? new Date(Number(userDeposit[1]) * 1000).toLocaleDateString() : 'N/A'}
            </div>
            <div className="stat-label">Deposit Date</div>
          </div>
        </div>
      </div>

      {/* Deposit */}
      <div className="card">
        <h3>// deposit_eth</h3>
        <div className="deposit-form">
          <div className="input-group">
            <label htmlFor="depositAmount">amount (ETH)</label>
            <input
              id="depositAmount"
              type="number"
              step="0.001"
              placeholder="0.0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={isDepositPending || isDepositConfirming}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleDeposit}
            disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isDepositPending || isDepositConfirming}
          >
            {isDepositPending || isDepositConfirming ? '> processing...' : '> deposit'}
          </button>
        </div>
      </div>

      {/* Withdraw */}
      <div className="card">
        <h3>// withdraw_eth</h3>
        <div className="deposit-form">
          <div className="input-group">
            <label htmlFor="withdrawAmount">amount (ETH or "all")</label>
            <input
              id="withdrawAmount"
              type="text"
              placeholder='0.0 or "all"'
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={isWithdrawPending || isWithdrawConfirming}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={handleWithdraw}
              disabled={!withdrawAmount || isWithdrawPending || isWithdrawConfirming}
            >
              {isWithdrawPending || isWithdrawConfirming ? '> processing...' : '> withdraw'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setWithdrawAmount('all')}
              disabled={isWithdrawPending || isWithdrawConfirming}
            >
              > all
            </button>
          </div>
        </div>
      </div>

      {/* Vault Stats */}
      <div className="card">
        <h3>// vault_stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">
              {totalEthLocked ? `${parseFloat(formatEther(totalEthLocked)).toFixed(2)}` : '0.00'}
            </div>
            <div className="stat-label">Total ETH Locked</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {rewardMultiplier ? `${(Number(rewardMultiplier) / 100).toFixed(2)}%` : '0.00%'}
            </div>
            <div className="stat-label">APY</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{contractVersion || 'N/A'}</div>
            <div className="stat-label">Version</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">UUPS</div>
            <div className="stat-label">Proxy Type</div>
          </div>
        </div>
      </div>

      {/* Transaction Status */}
      {status && (
        <div className="card">
          <div className={`transaction-status status-${status.type}`}>
            {status.message}
          </div>
        </div>
      )}

    </div>
  )
}

export default VaultDashboard
