import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@/hooks/useWallet';
import { useRole } from '@/hooks/useRole';
import { useAllContracts } from '@/hooks/useContract';
import { formatAddress } from '@/utils/formatters';
import { 
  TrophyIcon, 
  ShieldIcon,
  UsersIcon,
  BarChart3Icon,
  SettingsIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
  EyeIcon
} from 'lucide-react';

function SimpleAdminDashboard() {
  const { address, isConnected, chainId } = useWallet();
  const roleState = useRole();
  const contracts = useAllContracts();

  return (
    <>
      <Head>
        <title>Admin Dashboard - MintMark</title>
        <meta name="description" content="System administration and management" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="container-base">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                  <TrophyIcon className="w-8 h-8 text-primary-600" />
                  <span className="text-xl font-bold text-gray-900">MintMark</span>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">Admin (Simple)</span>
              </div>
              
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/organizer" className="text-gray-600 hover:text-gray-900">
                  Organizer
                </Link>
                <ConnectButton />
              </div>
            </div>
          </div>
        </nav>

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container-base py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Admin Dashboard (Simple)
                </h1>
                <p className="text-gray-600">
                  System administration for {address ? formatAddress(address) : 'Unknown'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Link href="/debug" className="btn btn-outline">
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Debug Info
                </Link>
                <Link href="/admin" className="btn btn-outline">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Full Admin
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container-base py-8">
          {/* Connection Status */}
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Connection Status</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Wallet Status</h3>
                  <div className="space-y-2">
                    <p><strong>Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Address:</strong> {address || 'Not connected'}</p>
                    <p><strong>Chain ID:</strong> {chainId || 'Unknown'}</p>
                    <p><strong>Expected Chain:</strong> 31337 (Hardhat Local)</p>
                    <p><strong>Network Match:</strong> {chainId === 31337 ? '✅ Correct' : '❌ Wrong Network'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Role Status</h3>
                  <div className="space-y-2">
                    <p><strong>Loading:</strong> {roleState.isLoading ? '⏳ Yes' : '✅ No'}</p>
                    <p><strong>Is Admin:</strong> {roleState.isAdmin ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Is Organizer:</strong> {roleState.isOrganizer ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Is Verifier:</strong> {roleState.isVerifier ? '✅ Yes' : '❌ No'}</p>
                    {roleState.error && (
                      <p><strong>Error:</strong> <span className="text-red-600">{roleState.error}</span></p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Status */}
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Contract Status</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Contract Instances</h3>
                  <div className="space-y-2">
                    <p><strong>Access Control:</strong> {contracts.accessControl ? '✅ Available' : '❌ Not Available'}</p>
                    <p><strong>Event Manager:</strong> {contracts.eventManager ? '✅ Available' : '❌ Not Available'}</p>
                    <p><strong>Badge NFT:</strong> {contracts.badgeNFT ? '✅ Available' : '❌ Not Available'}</p>
                    <p><strong>Attendance:</strong> {contracts.attendance ? '✅ Available' : '❌ Not Available'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Contract Addresses</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Access Control:</strong> <code className="bg-gray-100 px-1 rounded">0x5FbDB2315678afecb367f032d93F642f64180aa3</code></p>
                    <p><strong>Event Manager:</strong> <code className="bg-gray-100 px-1 rounded">0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512</code></p>
                    <p><strong>Badge NFT:</strong> <code className="bg-gray-100 px-1 rounded">0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0</code></p>
                    <p><strong>Attendance:</strong> <code className="bg-gray-100 px-1 rounded">0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9</code></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Connection Instructions</h2>
            </div>
            <div className="card-body">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">To Connect to Admin Dashboard:</h3>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Make sure Hardhat node is running (✅ Running)</li>
                  <li>Add Hardhat Local network to MetaMask:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Network Name: Hardhat Local</li>
                      <li>RPC URL: http://localhost:8545</li>
                      <li>Chain ID: 31337</li>
                      <li>Currency Symbol: ETH</li>
                    </ul>
                  </li>
                  <li>Import admin account with private key: <code className="bg-blue-100 px-1 rounded">ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80</code></li>
                  <li>Click "Connect Wallet" button above</li>
                  <li>Switch to Hardhat Local network in MetaMask</li>
                  <li>Refresh this page to see updated status</li>
                </ol>
              </div>
              
              <div className="flex gap-3">
                <Link href="/debug" className="btn btn-primary">
                  <EyeIcon className="w-4 h-4 mr-2" />
                  View Debug Info
                </Link>
                <Link href="/admin" className="btn btn-outline">
                  <ShieldIcon className="w-4 h-4 mr-2" />
                  Try Full Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SimpleAdminDashboard;
