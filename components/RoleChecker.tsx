import React, { useState } from 'react';
import { useRole } from '@/hooks/useRole';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/utils/formatters';
import { 
  ShieldIcon, 
  UserIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon
} from 'lucide-react';

export function RoleChecker() {
  const { address, isConnected } = useWallet();
  const roleState = useRole();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await roleState.refreshRoles();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldIcon className="w-5 h-5" />
            Role Checker
          </h3>
        </div>
        <div className="card-body text-center">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please connect your wallet to check your roles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldIcon className="w-5 h-5" />
            Your Roles
          </h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || roleState.isLoading}
            className="btn btn-sm btn-outline"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Wallet Address:</p>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded">
            {address ? formatAddress(address) : 'Unknown'}
          </p>
        </div>

        {roleState.isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-lg mx-auto mb-2"></div>
            <p className="text-gray-600">Checking roles...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Admin Role */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  roleState.isAdmin ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {roleState.isAdmin ? (
                    <CheckCircleIcon className="w-5 h-5 text-red-600" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Admin</p>
                  <p className="text-sm text-gray-600">Full system access</p>
                </div>
              </div>
              <span className={`badge ${roleState.isAdmin ? 'badge-error' : 'badge-secondary'}`}>
                {roleState.isAdmin ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Organizer Role */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  roleState.isOrganizer ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {roleState.isOrganizer ? (
                    <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Organizer</p>
                  <p className="text-sm text-gray-600">Create and manage events</p>
                </div>
              </div>
              <span className={`badge ${roleState.isOrganizer ? 'badge-primary' : 'badge-secondary'}`}>
                {roleState.isOrganizer ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Verifier Role */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  roleState.isVerifier ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {roleState.isVerifier ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Verifier</p>
                  <p className="text-sm text-gray-600">Verify attendance and mint badges</p>
                </div>
              </div>
              <span className={`badge ${roleState.isVerifier ? 'badge-success' : 'badge-secondary'}`}>
                {roleState.isVerifier ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {roleState.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error Loading Roles</p>
                <p className="text-sm text-red-700 mt-1">{roleState.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Access Information */}
        {!roleState.isLoading && !roleState.error && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Access Information</h4>
            <div className="space-y-2 text-sm text-blue-700">
              {roleState.isAdmin && (
                <p>✅ You have admin access - you can manage all system features</p>
              )}
              {roleState.isOrganizer && (
                <p>✅ You have organizer access - you can create and manage events</p>
              )}
              {roleState.isVerifier && (
                <p>✅ You have verifier access - you can verify attendance</p>
              )}
              {!roleState.isAdmin && !roleState.isOrganizer && !roleState.isVerifier && (
                <div>
                  <p>❌ You don't have any special roles</p>
                  <p className="mt-2">
                    To access organizer features, you need to be granted the organizer role by an admin.
                    Contact the system administrator to request access.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
