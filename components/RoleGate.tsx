import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useRole } from '@/hooks/useRole';
import { useWallet } from '@/hooks/useWallet';
import { formatError } from '@/utils/formatters';

interface RoleGateProps {
  children: ReactNode;
  requiredRoles: ('admin' | 'organizer' | 'verifier')[];
  fallback?: ReactNode;
  redirectTo?: string;
  showFallback?: boolean;
}

/**
 * Component that restricts access based on user roles
 * Redirects unauthorized users or shows fallback content
 */
export function RoleGate({
  children,
  requiredRoles,
  fallback,
  redirectTo,
  showFallback = true,
}: RoleGateProps) {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const roleState = useRole();
  const [isChecking, setIsChecking] = useState(true);

  // Check if user has any of the required roles
  const hasRequiredRole = requiredRoles.some(role => {
    switch (role) {
      case 'admin':
        return roleState.isAdmin;
      case 'organizer':
        return roleState.isOrganizer;
      case 'verifier':
        return roleState.isVerifier;
      default:
        return false;
    }
  });

  useEffect(() => {
    if (!roleState.isLoading && isConnected) {
      setIsChecking(false);
      
      if (!hasRequiredRole && redirectTo) {
        router.push(redirectTo);
      }
    } else if (!isConnected) {
      setIsChecking(false);
    }
  }, [roleState.isLoading, isConnected, hasRequiredRole, redirectTo, router]);

  // Show loading state while checking wallet and roles
  if (isChecking || roleState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="spinner-lg mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return showFallback ? (
      fallback || (
        <div className="text-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Wallet Connection Required
            </h3>
            <p className="text-gray-600 mb-4">
              Please connect your wallet to access this page.
            </p>
            <button
              onClick={() => router.push('/')}
              className="btn btn-primary"
            >
              Go to Home
            </button>
          </div>
        </div>
      )
    ) : null;
  }

  // Show access denied if user doesn't have required role
  if (!hasRequiredRole) {
    return showFallback ? (
      fallback || (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 mb-2">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Required roles: {requiredRoles.join(', ')}
            </p>
            {roleState.error && (
              <p className="text-sm text-red-600 mb-4">
                {formatError(roleState.error)}
              </p>
            )}
            <div className="space-x-2">
              <button
                onClick={() => router.push('/')}
                className="btn btn-outline"
              >
                Go to Home
              </button>
              <button
                onClick={() => roleState.refreshRoles()}
                className="btn btn-primary"
                disabled={roleState.isLoading}
              >
                {roleState.isLoading ? 'Refreshing...' : 'Refresh Roles'}
              </button>
            </div>
          </div>
        </div>
      )
    ) : null;
  }

  // Show error state if there's an error
  if (roleState.error) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Permissions
          </h3>
          <p className="text-gray-600 mb-4">
            {formatError(roleState.error)}
          </p>
          <button
            onClick={() => roleState.refreshRoles()}
            className="btn btn-primary"
            disabled={roleState.isLoading}
          >
            {roleState.isLoading ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // User has required role, show protected content
  return <>{children}</>;
}

/**
 * Higher-order component for role-based protection
 */
export function withRoleGate<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: ('admin' | 'organizer' | 'verifier')[],
  options?: {
    fallback?: ReactNode;
    redirectTo?: string;
    showFallback?: boolean;
  }
) {
  const WrappedComponent = (props: P) => (
    <RoleGate
      requiredRoles={requiredRoles}
      fallback={options?.fallback}
      redirectTo={options?.redirectTo}
      showFallback={options?.showFallback}
    >
      <Component {...props} />
    </RoleGate>
  );

  WrappedComponent.displayName = `withRoleGate(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Component for showing role-specific content inline
 */
interface RoleConditionalProps {
  children: ReactNode;
  requiredRoles: ('admin' | 'organizer' | 'verifier')[];
  fallback?: ReactNode;
}

export function RoleConditional({ children, requiredRoles, fallback }: RoleConditionalProps) {
  const roleState = useRole();

  const hasRequiredRole = requiredRoles.some(role => {
    switch (role) {
      case 'admin':
        return roleState.isAdmin;
      case 'organizer':
        return roleState.isOrganizer;
      case 'verifier':
        return roleState.isVerifier;
      default:
        return false;
    }
  });

  if (roleState.isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>;
  }

  return hasRequiredRole ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component for displaying user roles as badges
 */
export function RoleBadges() {
  const roleState = useRole();

  if (roleState.isLoading) {
    return <div className="animate-pulse bg-gray-200 h-6 w-20 rounded-full"></div>;
  }

  const roles = [];
  if (roleState.isAdmin) roles.push({ name: 'Admin', color: 'badge-error' });
  if (roleState.isOrganizer) roles.push({ name: 'Organizer', color: 'badge-primary' });
  if (roleState.isVerifier) roles.push({ name: 'Verifier', color: 'badge-success' });

  if (roles.length === 0) {
    return <span className="badge badge-secondary">User</span>;
  }

  return (
    <div className="flex gap-1">
      {roles.map((role) => (
        <span key={role.name} className={`badge ${role.color}`}>
          {role.name}
        </span>
      ))}
    </div>
  );
}
