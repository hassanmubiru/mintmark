import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@/hooks/useWallet';
import { useRole } from '@/hooks/useRole';
import { useAllContracts } from '@/hooks/useContract';
import { useAccessControl } from '@/hooks/useContract';
import { CONTRACT_ADDRESSES } from '@/utils/constants';

function DetailedDebugPage() {
  const { address, isConnected, chainId } = useWallet();
  const roleState = useRole();
  const contracts = useAllContracts();
  const accessControl = useAccessControl();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      wallet: {
        address,
        isConnected,
        chainId,
      },
      contracts: {
        accessControlAddress: CONTRACT_ADDRESSES.ACCESS_CONTROL,
        accessControlContract: !!contracts.accessControl,
        eventManagerContract: !!contracts.eventManager,
        badgeNFTContract: !!contracts.badgeNFT,
        attendanceContract: !!contracts.attendance,
      },
      accessControlHook: {
        isAdmin: accessControl.isAdmin,
        isOrganizer: accessControl.isOrganizer,
        isVerifier: accessControl.isVerifier,
        isLoading: accessControl.isLoading,
        error: accessControl.error,
      },
      roleState: {
        isAdmin: roleState.isAdmin,
        isOrganizer: roleState.isOrganizer,
        isVerifier: roleState.isVerifier,
        isLoading: roleState.isLoading,
        error: roleState.error,
      },
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
  }, [address, isConnected, chainId, contracts, accessControl, roleState]);

  return (
    <>
      <Head>
        <title>Detailed Debug - MintMark</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Detailed Debug Information</h1>
          
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

          {/* Contract Status */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Contract Status</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Contract Addresses</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Access Control:</strong> <code className="bg-gray-100 px-1 rounded">{CONTRACT_ADDRESSES.ACCESS_CONTROL}</code></p>
                    <p><strong>Event Manager:</strong> <code className="bg-gray-100 px-1 rounded">{CONTRACT_ADDRESSES.EVENT_MANAGER}</code></p>
                    <p><strong>Badge NFT:</strong> <code className="bg-gray-100 px-1 rounded">{CONTRACT_ADDRESSES.BADGE_NFT}</code></p>
                    <p><strong>Attendance:</strong> <code className="bg-gray-100 px-1 rounded">{CONTRACT_ADDRESSES.ATTENDANCE}</code></p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Contract Instances</h3>
                  <div className="space-y-2">
                    <p><strong>Access Control:</strong> {contracts.accessControl ? '✅ Available' : '❌ Not Available'}</p>
                    <p><strong>Event Manager:</strong> {contracts.eventManager ? '✅ Available' : '❌ Not Available'}</p>
                    <p><strong>Badge NFT:</strong> {contracts.badgeNFT ? '✅ Available' : '❌ Not Available'}</p>
                    <p><strong>Attendance:</strong> {contracts.attendance ? '✅ Available' : '❌ Not Available'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AccessControl Hook Details */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">AccessControl Hook Details</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Role Status</h3>
                  <div className="space-y-2">
                    <p><strong>Is Admin:</strong> {accessControl.isAdmin ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Is Organizer:</strong> {accessControl.isOrganizer ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Is Verifier:</strong> {accessControl.isVerifier ? '✅ Yes' : '❌ No'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Loading States</h3>
                  <div className="space-y-2">
                    <p><strong>Is Loading:</strong> {accessControl.isLoading ? '⏳ Yes' : '✅ No'}</p>
                    <p><strong>Error:</strong> {accessControl.error ? accessControl.error.message : 'None'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role State Details */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Role State Details</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Role Status</h3>
                  <div className="space-y-2">
                    <p><strong>Is Admin:</strong> {roleState.isAdmin ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Is Organizer:</strong> {roleState.isOrganizer ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Is Verifier:</strong> {roleState.isVerifier ? '✅ Yes' : '❌ No'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Loading States</h3>
                  <div className="space-y-2">
                    <p><strong>Is Loading:</strong> {roleState.isLoading ? '⏳ Yes' : '✅ No'}</p>
                    <p><strong>Error:</strong> {roleState.error || 'None'}</p>
                  </div>
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
                  <li>Wallet should be connected to address: <code>0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</code></li>
                  <li>Chain ID should be: <code>31337</code></li>
                  <li>AccessControl Hook - Is Admin should be: <code>true</code></li>
                  <li>Role State - Is Admin should be: <code>true</code></li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-primary"
                >
                  Refresh Page
                </button>
                <button 
                  onClick={() => roleState.refreshRoles()} 
                  className="btn btn-outline"
                >
                  Refresh Roles
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DetailedDebugPage;
