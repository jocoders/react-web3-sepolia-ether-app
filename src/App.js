import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'

import './App.css'
import { sepoliaContract } from './ethereum/sepolia'
import metamaskLogo from './images/metamask-fox.png'

const { Web3Provider } = ethers.providers

function App() {
  const [amountSent, setAmountSent] = useState(0)
  const [amountWithdraw, setAmountWithdraw] = useState(0)
  const [balance, setBalance] = useState(null)
  const [contract, setContract] = useState(null)
  const [contractOwner, setContractOwner] = useState(null)
  const [contractBalance, setContractBalance] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [network, setNetwork] = useState(null)
  const [signer, setSigner] = useState(null)
  const [walletAddress, setWalletAddress] = useState(null)

  useEffect(() => {
    const handleChainChanged = async (chainId) => {
      if (signer) {
        try {
          const provider = new Web3Provider(window.ethereum)
          const network = await provider.getNetwork()
          const balance = await provider.getBalance(walletAddress)
          setBalance(ethers.utils.formatEther(balance))
          setNetwork(network)
        } catch (err) {
          console.error('LOG: Error getting network', err)
        }
      }
    }

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged)
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [signer, walletAddress])

  const onChangeAmountInEth = (e) => {
    setAmountSent(e.target.value)
  }

  const onChangeWithdrawAmount = (e) => {
    setAmountWithdraw(e.target.value)
  }

  const connectWallet = async () => {
    if (typeof window != 'undefined' && typeof window.ethereum != 'undefined') {
      try {
        const provider = new Web3Provider(window.ethereum)
        const accounts = await provider.send('eth_requestAccounts', [])
        const network = await provider.getNetwork(accounts[0])
        setNetwork(network)

        const signer = provider.getSigner()
        setSigner(provider.getSigner())

        const address = await signer.getAddress()
        setWalletAddress(accounts[0])

        const balance = await provider.getBalance(address)
        setBalance(ethers.utils.formatEther(balance))
        setContract(sepoliaContract(signer))
      } catch (err) {
        console.error(err.message)
      }
    } else {
      console.log('LOG: Please install MetaMask')
    }
  }

  const disconnectWallet = () => {
    setSigner(null)
    setContract(null)
    setWalletAddress(null)
    console.log('LOG: Disconnected from wallet')
  }

  const checkBalance = async () => {
    try {
      const contractBalance = await contract.getBalance()
      setContractBalance(ethers.utils.formatEther(contractBalance))
    } catch (err) {
      console.error('LOG: Error getting contract balance', err)
    }
  }

  const checkIsOwner = async () => {
    try {
      const isOwner = await contract.isOwner(walletAddress)
      setIsOwner(isOwner)
    } catch (err) {
      console.error('LOG: Error getting is owner', err)
    }
  }

  const sendMoneyToContract = async () => {
    if (signer && contract) {
      try {
        const tx = await signer.sendTransaction({
          to: contract.address,
          value: ethers.utils.parseEther(amountSent)
        })
        await tx.wait()

        const provider = new Web3Provider(window.ethereum)
        const balance = await provider.getBalance(walletAddress)
        setBalance(ethers.utils.formatEther(balance))

        const contractBalance = await contract.getBalance()
        setContractBalance(ethers.utils.formatEther(contractBalance))
        setAmountSent(0)
      } catch (err) {
        console.error('LOG: Error sending money to contract:', err)
      }
    }
  }

  const withdrawMoneyFromContract = async (amount) => {
    if (signer && contract) {
      try {
        const tx = await contract.withdraw(walletAddress, ethers.utils.parseEther(amountWithdraw))
        await tx.wait()
        const provider = new Web3Provider(window.ethereum)

        const balance = await provider.getBalance(walletAddress)
        setBalance(ethers.utils.formatEther(balance))

        const contractBalance = await contract.getBalance()
        setContractBalance(ethers.utils.formatEther(contractBalance))
        setAmountWithdraw(0)
      } catch (err) {
        console.error('LOG: Error withdrawing money from contract:', err)
      }
    }
  }

  const checkContractOwner = async () => {
    try {
      const ownerAddress = await contract.owner()
      setContractOwner(ownerAddress)
    } catch (err) {
      console.error('LOG: Error fetching owner address:', err)
    }
  }

  const switchNetwork = () => {}

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <div className="titleContainer">
            <img src={metamaskLogo} alt="MetaMask Fox" className="metamask-logo" />
            <h1 className="navbar-item is-size-4">{'MetaMask:'}</h1>
          </div>

          <div id="navbarMenu" className="navbar-menu">
            <div className="row">
              <div className="navbar-end is-align-items-center">
                <button className="button is-white connect-wallet button-container" onClick={connectWallet}>
                  <span className="is-link has-text-weight-bold">
                    {walletAddress && walletAddress.length > 0
                      ? `Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`
                      : 'Connect Wallet'}
                  </span>
                </button>
              </div>
              {!!balance && (
                <div className="balance-box">
                  <span className="is-link has-text-weight-bold">{`Balance: ${balance}`}</span>
                </div>
              )}
            </div>
            {!!network?.name && (
              <div className="navbar-end is-align-items-center mt-10">
                <button className="button is-white connect-wallet button-container" onClick={switchNetwork}>
                  <span className="is-link has-text-weight-bold">{`Network: ${network?.name}`}</span>
                </button>
              </div>
            )}
          </div>

          {walletAddress && (
            <button className="button is-white connect-wallet mt-10 button-container" onClick={disconnectWallet}>
              <span className="is-link has-text-weight-bold">{'Disconnect'}</span>
            </button>
          )}
        </div>
      </nav>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-brand">
            <h1 className="navbar-item is-size-4">{'Test Sepolia contract:'}</h1>
          </div>
        </div>

        <div className="row">
          <div className="navbar-end is-align-items-center">
            <button className="button is-white connect-wallet button-container" onClick={checkBalance}>
              <span className="is-link has-text-weight-bold">{'Check Balance'}</span>
            </button>
          </div>
          {!!contractBalance && (
            <div className="balance-box">
              <span className="is-link has-text-weight-bold">{`Balance: ${contractBalance}`}</span>
            </div>
          )}
        </div>

        <div className="row mt-5">
          <div className="navbar-end is-align-items-center">
            <button className="button is-white connect-wallet button-container" onClick={checkIsOwner}>
              <span className="is-link has-text-weight-bold">{'Check Is Owner'}</span>
            </button>
          </div>
          <div className="balance-box">
            <span className="is-link has-text-weight-bold">{`isOwner: ${isOwner}`}</span>
          </div>
        </div>

        <div className="row mt-5">
          <div className="navbar-end is-align-items-center">
            <button className="button is-white connect-wallet button-container" onClick={checkContractOwner}>
              <span className="is-link has-text-weight-bold">{'Check Contract Owner'}</span>
            </button>
          </div>
          <div className="balance-box">
            <span className="is-link has-text-weight-bold">{`Contract owner: ${contractOwner ?? ''}`}</span>
          </div>
        </div>

        <div className="mt-5">
          <button className="button is-white connect-wallet button-container" onClick={sendMoneyToContract}>
            <span className="is-link has-text-weight-bold">{'Send Money to Contract'}</span>
          </button>
          <input value={amountSent} onChange={onChangeAmountInEth} type="text" id="amount" />
        </div>

        <div className="mt-5">
          <button className="button is-white connect-wallet button-container" onClick={withdrawMoneyFromContract}>
            <span className="is-link has-text-weight-bold">{'Withdraw Money from Contract'}</span>
          </button>
          <input value={amountWithdraw} onChange={onChangeWithdrawAmount} type="text" id="withdrawAmount" />
        </div>
      </nav>
    </div>
  )
}

export default App
