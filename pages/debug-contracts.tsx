import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@/hooks/useWallet';
import { useAllContracts } from '@/hooks/useContract';
import { usePublicClient, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/utils/constants';

function ContractDebugPage() {
  const { address, isConnected, chainId } = useWallet();
  const contracts = useAllContracts();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      wallet: {
        address,
        isConnected,
        chainId,
      },
      clients: {
        publicClient: !!publicClient,
        walletClient: !!walletClient,
        walletClientData: !!walletClient.data,
      },
      contractAddresses: {
        ACCESS_CONTROL: CONTRACT_ADDRESSES.ACCESS_CONTROL,
        EVENT_MANAGER: CONTRACT_ADDRESSES.EVENT_MANAGER,
        BADGE_NFT: CONTRACT_ADDRESSES.BADGE_NFT,
        ATTENDANCE: CONTRACT_ADDRESSES.ATTENDANCE,
      },
      contracts: {
        accessControl: contracts.accessControl,
        eventManager: contracts.eventManager,
        badgeNFT: contracts.badgeNFT,
        attendance: contracts.attendance,
      },
      contractChecks: {
        accessControlAddressExists: !!CONTRACT_ADDRESSES.ACCESS_CONTROL,
        publicClientExists: !!publicClient,
        walletClientExists: !!walletClient,
        walletClientDataExists: !!walletClient.data,
        accessControlShouldExist: !!(CONTRACT_ADDRESSES.ACCESS_CONTROL && publicClient && walletClient.data),
      },
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
  }, [address, isConnected, chainId, contracts, publicClient, walletClient]);

  return (
    <>
      <Head>
        <title>Contract Debug - MintMark</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Contract Debug Information</h1>
          
          {/* Wallet Connection */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Wallet Connection</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>Address:</strong> {address || 'Not connected'}</p>
                  <p><strong>Chain ID:</strong> {chainId || 'Unknown'}</p>
                </div>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              </div>
            </div>
          </div>

          {/* Client Status */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Client Status</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Public Client</h3>
                  <p><strong>Available:</strong> {publicClient ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Wallet Client</h3>
                  <p><strong>Available:</strong> {walletClient ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Wallet Client Data</h3>
                  <p><strong>Available:</strong> {walletClient.data ? '✅ Yes' : '❌ No'}</p>
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
                <p><strong>Access Control:</strong> <code className="bg-gray-100 px-1 rounded">{CONTRACT_ADDRESSES.ACCESS_CONTROL || 'NOT SET'}</code></p>
                <p><strong>Event Manager:</strong> <code className="bg-gray-100 px-1 rounded">{CONTRACT_ADDRESSES.EVENT_MANAGER || 'NOT SET'}</code></p>
                <p><strong>Badge NFT:</strong> <code className="bg-gray-100 px-1 rounded">{CONTRACT_ADDRESSES.BADGE_NFT || 'NOT SET'}</code></p>
                <p><strong>Attendance:</strong> <code className="bg-gray-100 px-1 rounded">{CONTRACT_ADDRESSES.ATTENDANCE || 'NOT SET'}</code></p>
              </div>
            </div>
          </div>

          {/* Contract Instances */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Contract Instances</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Contract Availability</h3>
                  <div className="space-y-2">
                    <p><strong>Access Control:</strong> {contracts.accessControl ? '✅ Available' : '❌ Not Available'}</p>
                    <p><strong>Event Manager:</strong> {contracts.eventManager ? '✅ Available' : '❌ Not Available'}</p>
                    <p><strong>Badge NFT:</strong> {contracts.badgeNFT ? '✅ Available' : '❌ Not Available'}</p>
                    <p><strong>Attendance:</strong> {contracts.attendance ? '✅ Available' : '❌ Not Available'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Contract Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Access Control Address:</strong> {contracts.accessControl?.address || 'null'}</p>
                    <p><strong>Access Control ABI:</strong> {contracts.accessControl?.abi ? `${contracts.accessControl.abi.length} functions` : 'null'}</p>
                    <p><strong>Event Manager Address:</strong> {contracts.eventManager?.address || 'null'}</p>
                    <p><strong>Event Manager ABI:</strong> {contracts.eventManager?.abi ? `${contracts.eventManager.abi.length} functions` : 'null'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Creation Logic */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Contract Creation Logic</h2>
            </div>
            <div className="card-body">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">AccessControl Contract Creation:</h3>
                <div className="space-y-1 text-sm text-yellow-800">
                  <p><strong>CONTRACT_ADDRESSES.ACCESS_CONTROL exists:</strong> {!!CONTRACT_ADDRESSES.ACCESS_CONTROL ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>publicClient exists:</strong> {!!publicClient ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>walletClient exists:</strong> {!!walletClient ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>walletClient.data exists:</strong> {!!walletClient.data ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>All conditions met:</strong> {!!(CONTRACT_ADDRESSES.ACCESS_CONTROL && publicClient && walletClient.data) ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Debug Data */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Raw Debug Data</h2>
            </div>
            <div className="card-body">
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>

          {/* Manual Test */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Manual Test</h2>
            </div>
            <div className="card-body">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">Expected Values:</h3>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>All clients should be available: <code>true</code></li>
                  <li>All contract addresses should be set</li>
                  <li>All contract instances should be available</li>
                  <li>AccessControl contract should have address and ABI</li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-primary"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ContractDebugPage;
