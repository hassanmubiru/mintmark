import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { withRoleGate } from '@/components/RoleGate';
import { useWallet } from '@/hooks/useWallet';
import { useRoleManagement } from '@/hooks/useRole';
import { useAllContracts } from '@/hooks/useContract';
import { useTransactionToast } from '@/hooks/useToast';
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

interface RoleManagementProps {
  onAddRole: (address: string, role: 'organizer' | 'verifier') => Promise<void>;
  onRemoveRole: (address: string, role: 'organizer' | 'verifier') => Promise<void>;
  isLoading: boolean;
}

function RoleManagement({ onAddRole, onRemoveRole, isLoading }: RoleManagementProps) {
  const [newAddress, setNewAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState<'organizer' | 'verifier'>('organizer');
  const [actionType, setActionType] = useState<'add' | 'remove'>('add');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    try {
      if (actionType === 'add') {
        await onAddRole(newAddress, selectedRole);
      } else {
        await onRemoveRole(newAddress, selectedRole);
      }
      setNewAddress('');
    } catch (error) {
      console.error('Role management error:', error);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShieldIcon className="w-5 h-5" />
          Role Management
        </h3>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Action</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as 'add' | 'remove')}
                className="form-input"
              >
                <option value="add">Grant Role</option>
                <option value="remove">Revoke Role</option>
              </select>
            </div>

            <div>
              <label className="form-label">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'organizer' | 'verifier')}
                className="form-input"
              >
                <option value="organizer">Organizer</option>
                <option value="verifier">Verifier</option>
              </select>
            </div>

            <div>
              <label className="form-label">Address</label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="0x..."
                className="form-input"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !newAddress}
            className={`btn ${actionType === 'add' ? 'btn-success' : 'btn-error'} w-full`}
          >
            {isLoading ? (
              <>
                <div className="spinner-sm mr-2"></div>
                Processing...
              </>
            ) : actionType === 'add' ? (
              <>
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Grant {selectedRole} Role
              </>
            ) : (
              <>
                <UserMinusIcon className="w-4 h-4 mr-2" />
                Revoke {selectedRole} Role
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Role Management Warning</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Be careful when granting or revoking roles. Organizers can create and manage events, 
                while verifiers can verify attendance and mint badges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemStats() {
  const contracts = useAllContracts();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalBadges: 0,
    totalUsers: 0,
    systemHealth: 'good' as 'good' | 'warning' | 'error',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
  }, [contracts]);

  const loadSystemStats = async () => {
    try {
      const [totalEvents, totalBadges] = await Promise.all([
        contracts.eventManager.getTotalEvents || Promise.resolve(BigInt(0)),
        contracts.badgeNFT.getTotalBadges() || Promise.resolve(BigInt(0)),
      ]);

      setStats({
        totalEvents: Number(totalEvents),
        totalBadges: Number(totalBadges),
        totalUsers: Math.floor(Number(totalBadges) * 0.3), // Estimate
        systemHealth: 'good',
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
      setStats(prev => ({ ...prev, systemHealth: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = () => {
    switch (stats.systemHealth) {
      case 'good':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getHealthIcon = () => {
    switch (stats.systemHealth) {
      case 'good':
        return <CheckCircleIcon className={`w-6 h-6 ${getHealthColor()}`} />;
      case 'warning':
        return <AlertTriangleIcon className={`w-6 h-6 ${getHealthColor()}`} />;
      case 'error':
        return <XCircleIcon className={`w-6 h-6 ${getHealthColor()}`} />;
      default:
        return <div className="w-6 h-6 bg-gray-300 rounded-full animate-pulse"></div>;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="card-body text-center">
              <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="card text-center">
        <div className="card-body">
          <BarChart3Icon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.totalEvents}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
      </div>

      <div className="card text-center">
        <div className="card-body">
          <TrophyIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.totalBadges}</div>
          <div className="text-sm text-gray-600">Badges Minted</div>
        </div>
      </div>

      <div className="card text-center">
        <div className="card-body">
          <UsersIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
      </div>

      <div className="card text-center">
        <div className="card-body">
          {getHealthIcon()}
          <div className={`text-sm font-medium ${getHealthColor()} mt-2`}>
            System {stats.systemHealth === 'good' ? 'Healthy' : stats.systemHealth}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { address } = useWallet();
  const roleManagement = useRoleManagement();
  const toast = useTransactionToast();
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'events' | 'badges'>('overview');

  const handleAddRole = async (address: string, role: 'organizer' | 'verifier') => {
    setIsRoleLoading(true);
    try {
      let tx;
      if (role === 'organizer') {
        tx = await roleManagement.addOrganizer(address);
      } else {
        tx = await roleManagement.addVerifier(address);
      }
      
      toast.transactionPending(tx.hash);
      await tx.wait();
      toast.transactionSuccess(tx.hash, `${role} role granted successfully`);
    } catch (error) {
      console.error('Error granting role:', error);
      toast.transactionError(error, 'Role grant');
    } finally {
      setIsRoleLoading(false);
    }
  };

  const handleRemoveRole = async (address: string, role: 'organizer' | 'verifier') => {
    setIsRoleLoading(true);
    try {
      let tx;
      if (role === 'organizer') {
        tx = await roleManagement.removeOrganizer(address);
      } else {
        tx = await roleManagement.removeVerifier(address);
      }
      
      toast.transactionPending(tx.hash);
      await tx.wait();
      toast.transactionSuccess(tx.hash, `${role} role revoked successfully`);
    } catch (error) {
      console.error('Error revoking role:', error);
      toast.transactionError(error, 'Role revocation');
    } finally {
      setIsRoleLoading(false);
    }
  };

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
                <span className="text-gray-600">Admin</span>
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
                  Admin Dashboard
                </h1>
                <p className="text-gray-600">
                  System administration for {address ? formatAddress(address) : 'Unknown'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button className="btn btn-outline">
                  <EyeIcon className="w-4 h-4 mr-2" />
                  View Logs
                </button>
                <button className="btn btn-outline">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="container-base">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'roles'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Role Management
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Event Control
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'badges'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Badge Management
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="container-base py-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <SystemStats />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">Event Created</p>
                          <p className="text-sm text-gray-600">Web3 Meetup by {formatAddress('0x1234...5678')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <TrophyIcon className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Badge Minted</p>
                          <p className="text-sm text-gray-600">25 badges for DeFi Conference</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <ShieldIcon className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Role Granted</p>
                          <p className="text-sm text-gray-600">Organizer role to {formatAddress('0x9876...5432')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold">System Health</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Contract Status</span>
                        <span className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          Operational
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>IPFS Gateway</span>
                        <span className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          Connected
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Network Status</span>
                        <span className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          Base Mainnet
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Last Block</span>
                        <span className="text-sm text-gray-600">2 seconds ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-8">
              <RoleManagement
                onAddRole={handleAddRole}
                onRemoveRole={handleRemoveRole}
                isLoading={isRoleLoading}
              />

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Role Overview</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <ShieldIcon className="w-12 h-12 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">1</div>
                      <div className="text-sm text-gray-600">Admins</div>
                    </div>
                    <div className="text-center">
                      <UsersIcon className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">-</div>
                      <div className="text-sm text-gray-600">Organizers</div>
                    </div>
                    <div className="text-center">
                      <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">-</div>
                      <div className="text-sm text-gray-600">Verifiers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-8">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Event Control Panel</h3>
                </div>
                <div className="card-body">
                  <p className="text-gray-600 mb-4">
                    Advanced event management tools will be implemented here.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="btn btn-outline justify-start">
                      <AlertTriangleIcon className="w-4 h-4 mr-2" />
                      Emergency Event Stop
                    </button>
                    <button className="btn btn-outline justify-start">
                      <BarChart3Icon className="w-4 h-4 mr-2" />
                      Global Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="space-y-8">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Badge Management</h3>
                </div>
                <div className="card-body">
                  <p className="text-gray-600 mb-4">
                    Badge revocation and restoration tools will be implemented here.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="btn btn-outline justify-start">
                      <XCircleIcon className="w-4 h-4 mr-2" />
                      Revoke Badge
                    </button>
                    <button className="btn btn-outline justify-start">
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Restore Badge
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Wrap with role gate to require admin permissions
export default withRoleGate(AdminDashboard, ['admin'], {
  redirectTo: '/',
  showFallback: true,
});
