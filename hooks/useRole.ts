import { useCallback, useEffect, useState } from 'react';
import { useAccessControl } from './useContract';
import { useWallet } from './useWallet';
import { ROLES } from '@/utils/constants';

export interface RoleState {
  isAdmin: boolean;
  isOrganizer: boolean;
  isVerifier: boolean;
  isLoading: boolean;
  error?: string;
}

export interface UseRoleReturn extends RoleState {
  checkRole: (role: string) => Promise<boolean>;
  refreshRoles: () => Promise<void>;
  hasAnyRole: boolean;
  canManageEvents: boolean;
  canVerifyAttendance: boolean;
  canManageRoles: boolean;
  address?: string;
}

/**
 * Custom hook for managing user roles and permissions
 */
export function useRole(): UseRoleReturn {
  const { address, isConnected } = useWallet();
  const accessControl = useAccessControl();
  
  const [roleState, setRoleState] = useState<RoleState>({
    isAdmin: false,
    isOrganizer: false,
    isVerifier: false,
    isLoading: false,
  });

  const checkRole = useCallback(async (role: string): Promise<boolean> => {
    if (!address || !accessControl.contract) return false;
    
    try {
      switch (role) {
        case ROLES.DEFAULT_ADMIN_ROLE:
          return accessControl.isAdmin;
        case ROLES.ORGANIZER_ROLE:
          return accessControl.isOrganizer;
        case ROLES.VERIFIER_ROLE:
          return accessControl.isVerifier;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }, [address, accessControl]);

  const refreshRoles = useCallback(async () => {
    if (!address || !accessControl.contract || !isConnected) {
      setRoleState({
        isAdmin: false,
        isOrganizer: false,
        isVerifier: false,
        isLoading: false,
      });
      return;
    }

    setRoleState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const [isAdmin, isOrganizer, isVerifier] = [
        accessControl.isAdmin,
        accessControl.isOrganizer,
        accessControl.isVerifier
      ];

      setRoleState({
        isAdmin,
        isOrganizer,
        isVerifier,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error refreshing roles:', error);
      setRoleState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load roles',
      }));
    }
  }, [address, accessControl, isConnected]);

  // Refresh roles when wallet connects or address changes
  useEffect(() => {
    refreshRoles();
  }, [refreshRoles]);

  // Computed permissions
  const hasAnyRole = roleState.isAdmin || roleState.isOrganizer || roleState.isVerifier;
  const canManageEvents = roleState.isAdmin || roleState.isOrganizer;
  const canVerifyAttendance = roleState.isAdmin || roleState.isOrganizer || roleState.isVerifier;
  const canManageRoles = roleState.isAdmin;

  return {
    ...roleState,
    checkRole,
    refreshRoles,
    hasAnyRole,
    canManageEvents,
    canVerifyAttendance,
    canManageRoles,
    address,
  };
}

/**
 * Hook for checking specific role requirements
 * Throws error if requirements are not met
 */
export function useRequireRole(requiredRoles: ('admin' | 'organizer' | 'verifier')[]): RoleState {
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

  if (!roleState.isLoading && !hasRequiredRole) {
    throw new Error(`Access denied: requires one of the following roles: ${requiredRoles.join(', ')}`);
  }

  return roleState;
}

/**
 * Hook for admin-only operations
 */
export function useAdminRole() {
  return useRequireRole(['admin']);
}

/**
 * Hook for organizer or admin operations
 */
export function useOrganizerRole() {
  return useRequireRole(['admin', 'organizer']);
}

/**
 * Hook for verifier, organizer, or admin operations
 */
export function useVerifierRole() {
  return useRequireRole(['admin', 'organizer', 'verifier']);
}

/**
 * Hook for role management operations
 */
export function useRoleManagement() {
  const { isAdmin } = useRole();
  const accessControl = useAccessControl();

  const addOrganizer = useCallback(async (organizerAddress: string) => {
    if (!isAdmin) throw new Error('Admin role required');
    return await accessControl.addOrganizer(organizerAddress);
  }, [isAdmin, accessControl]);

  const removeOrganizer = useCallback(async (organizerAddress: string) => {
    if (!isAdmin) throw new Error('Admin role required');
    return await accessControl.removeOrganizer(organizerAddress);
  }, [isAdmin, accessControl]);

  const addVerifier = useCallback(async (verifierAddress: string) => {
    if (!isAdmin) throw new Error('Admin role required');
    return await accessControl.addVerifier(verifierAddress);
  }, [isAdmin, accessControl]);

  const removeVerifier = useCallback(async (verifierAddress: string) => {
    if (!isAdmin) throw new Error('Admin role required');
    return await accessControl.removeVerifier(verifierAddress);
  }, [isAdmin, accessControl]);

  return {
    isAdmin,
    addOrganizer,
    removeOrganizer,
    addVerifier,
    removeVerifier,
  };
}

/**
 * Hook for checking permissions for specific operations
 */
export function usePermissions() {
  const roleState = useRole();

  const canCreateEvent = roleState.isAdmin || roleState.isOrganizer;
  const canEditEvent = useCallback((eventOrganizerAddress: string) => {
    return roleState.isAdmin || 
           (roleState.isOrganizer && eventOrganizerAddress?.toLowerCase() === roleState.address?.toLowerCase());
  }, [roleState.isAdmin, roleState.isOrganizer, roleState.address]);

  const canDeleteEvent = useCallback((eventOrganizerAddress: string) => {
    return roleState.isAdmin || 
           (roleState.isOrganizer && eventOrganizerAddress?.toLowerCase() === roleState.address?.toLowerCase());
  }, [roleState.isAdmin, roleState.isOrganizer, roleState.address]);

  const canVerifyAttendance = roleState.isAdmin || roleState.isOrganizer || roleState.isVerifier;
  const canMintBadge = roleState.isAdmin || roleState.isOrganizer || roleState.isVerifier;
  const canRevokeBadge = roleState.isAdmin;
  const canManageRoles = roleState.isAdmin;
  const canViewAnalytics = roleState.isAdmin || roleState.isOrganizer;

  return {
    canCreateEvent,
    canEditEvent,
    canDeleteEvent,
    canVerifyAttendance,
    canMintBadge,
    canRevokeBadge,
    canManageRoles,
    canViewAnalytics,
  };
}

/**
 * Hook for role-based UI components
 */
export function useRoleUI() {
  const roleState = useRole();
  const permissions = usePermissions();

  const getRoleBadgeColor = (role: 'admin' | 'organizer' | 'verifier') => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      organizer: 'bg-blue-100 text-blue-800',
      verifier: 'bg-green-100 text-green-800',
    };
    return colors[role];
  };

  const getUserRoles = () => {
    const roles: string[] = [];
    if (roleState.isAdmin) roles.push('Admin');
    if (roleState.isOrganizer) roles.push('Organizer');
    if (roleState.isVerifier) roles.push('Verifier');
    return roles;
  };

  const getHighestRole = () => {
    if (roleState.isAdmin) return 'admin';
    if (roleState.isOrganizer) return 'organizer';
    if (roleState.isVerifier) return 'verifier';
    return null;
  };

  return {
    ...roleState,
    ...permissions,
    getRoleBadgeColor,
    getUserRoles,
    getHighestRole,
  };
}
