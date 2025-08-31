import React from 'react';
import Head from 'next/head';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@/hooks/useWallet';
import { useRole } from '@/hooks/useRole';
import { useAllContracts } from '@/hooks/useContract';
import { CONTRACT_ADDRESSES } from '@/utils/constants';

function DebugPage() {
  const { address, isConnected, chainId } = useWallet();
  const roleState = useRole();
  const contracts = useAllContracts();

  return (
    <>
      <Head>
        <title>Debug - MintMark</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Debug Information</h1>
          
          {/* Wallet Connection */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Wallet Connection</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
                  <p><strong>Address:</strong> {address || 'Not connected'}</p>
                  <p><strong>Chain ID:</strong> {chainId || 'Unknown'}</p>
                </div>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              </div>
            </div>
          </div>

          {/* Contract Addresses */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Contract Addresses</h2>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                <p><strong>Access Control:</strong> {CONTRACT_ADDRESSES.ACCESS_CONTROL}</p>
                <p><strong>Event Manager:</strong> {CONTRACT_ADDRESSES.EVENT_MANAGER}</p>
                <p><strong>Badge NFT:</strong> {CONTRACT_ADDRESSES.BADGE_NFT}</p>
                <p><strong>Attendance:</strong> {CONTRACT_ADDRESSES.ATTENDANCE}</p>
              </div>
            </div>
          </div>

          {/* Contract Instances */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Contract Instances</h2>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                <p><strong>Access Control Contract:</strong> {contracts.accessControl ? 'Available' : 'Not Available'}</p>
                <p><strong>Event Manager Contract:</strong> {contracts.eventManager ? 'Available' : 'Not Available'}</p>
                <p><strong>Badge NFT Contract:</strong> {contracts.badgeNFT ? 'Available' : 'Not Available'}</p>
                <p><strong>Attendance Contract:</strong> {contracts.attendance ? 'Available' : 'Not Available'}</p>
              </div>
            </div>
          </div>

          {/* Role Information */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Role Information</h2>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                <p><strong>Loading:</strong> {roleState.isLoading ? 'Yes' : 'No'}</p>
                <p><strong>Is Admin:</strong> {roleState.isAdmin ? 'Yes' : 'No'}</p>
                <p><strong>Is Organizer:</strong> {roleState.isOrganizer ? 'Yes' : 'No'}</p>
                <p><strong>Is Verifier:</strong> {roleState.isVerifier ? 'Yes' : 'No'}</p>
                {roleState.error && (
                  <p><strong>Error:</strong> <span className="text-red-600">{roleState.error}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Network Information */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Network Information</h2>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                <p><strong>Expected Chain ID:</strong> 31337 (Hardhat Local)</p>
                <p><strong>Current Chain ID:</strong> {chainId}</p>
                <p><strong>Network Match:</strong> {chainId === 31337 ? '✅ Correct' : '❌ Wrong Network'}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Troubleshooting Steps</h2>
            </div>
            <div className="card-body">
              <ol className="list-decimal list-inside space-y-2">
                <li>Make sure Hardhat node is running: <code>npx hardhat node</code></li>
                <li>Add Hardhat Local network to MetaMask:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Network Name: Hardhat Local</li>
                    <li>RPC URL: http://localhost:8545</li>
                    <li>Chain ID: 31337</li>
                    <li>Currency Symbol: ETH</li>
                  </ul>
                </li>
                <li>Import admin account with private key: <code>ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80</code></li>
                <li>Connect wallet using the ConnectButton above</li>
                <li>Switch to Hardhat Local network in MetaMask</li>
                <li>Refresh this page to see updated status</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DebugPage;
