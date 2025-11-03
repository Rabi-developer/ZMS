'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  UserData,
  UserPermissions,
  PermissionAction,
  getUserData,
  getUserPermissions,
  saveUserData,
  clearUserData,
  hasPermission,
  hasAnyPermission,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  getResourceActions,
  isAuthenticated,
  canAccessRoute,
  isSuperAdmin,
} from '@/utils/permissions';

interface PermissionContextType {
  // User data
  userData: UserData | null;
  permissions: UserPermissions;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  
  // Permission checking functions
  hasPermission: (resource: string, action: PermissionAction) => boolean;
  hasAnyPermission: (resource: string) => boolean;
  canRead: (resource: string) => boolean;
  canCreate: (resource: string) => boolean;
  canUpdate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  getResourceActions: (resource: string) => PermissionAction[];
  
  // Authentication functions
  login: (userData: UserData) => void;
  logout: () => void;
  
  // Loading state
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize permissions from localStorage on mount
  useEffect(() => {
    try {
      const storedUserData = getUserData();
      const storedPermissions = getUserPermissions();
      
      if (storedUserData) {
        setUserData(storedUserData);
      }
      
      setPermissions(storedPermissions);
    } catch (error) {
      console.error('Error initializing permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newUserData: UserData) => {
    try {
      setUserData(newUserData);
      setPermissions(newUserData.permissions);
      saveUserData(newUserData);
      console.log('User logged in successfully:', newUserData.userName);
      console.log('User permissions:', newUserData.permissions);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    try {
      setUserData(null);
      setPermissions({});
      clearUserData();
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const contextValue: PermissionContextType = {
    // User data
    userData,
    permissions,
    isAuthenticated: !isLoading && isAuthenticated(),
    isSuperAdmin: isSuperAdmin(permissions),
    
    // Permission checking functions
    hasPermission: (resource: string, action: PermissionAction) => 
      hasPermission(resource, action, permissions),
    hasAnyPermission: (resource: string) => 
      hasAnyPermission(resource, permissions),
    canRead: (resource: string) => 
      canRead(resource, permissions),
    canCreate: (resource: string) => 
      canCreate(resource, permissions),
    canUpdate: (resource: string) => 
      canUpdate(resource, permissions),
    canDelete: (resource: string) => 
      canDelete(resource, permissions),
    canAccessRoute: (route: string) => 
      canAccessRoute(route, permissions),
    getResourceActions: (resource: string) => 
      getResourceActions(resource, permissions),
    
    // Authentication functions
    login,
    logout,
    
    // Loading state
    isLoading,
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

// Custom hook to use permissions
export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// Convenience hooks for specific permission checks
export const useCanRead = (resource: string): boolean => {
  const { canRead } = usePermissions();
  return canRead(resource);
};

export const useCanCreate = (resource: string): boolean => {
  const { canCreate } = usePermissions();
  return canCreate(resource);
};

export const useCanUpdate = (resource: string): boolean => {
  const { canUpdate } = usePermissions();
  return canUpdate(resource);
};

export const useCanDelete = (resource: string): boolean => {
  const { canDelete } = usePermissions();
  return canDelete(resource);
};

export const useCanAccess = (resource: string): boolean => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(resource);
};

export const useResourceActions = (resource: string): PermissionAction[] => {
  const { getResourceActions } = usePermissions();
  return getResourceActions(resource);
};

// Hook for checking SuperAdmin status
export const useIsSuperAdmin = (): boolean => {
  const { isSuperAdmin } = usePermissions();
  return isSuperAdmin;
};

// Higher-order component for permission-based rendering
interface WithPermissionProps {
  resource: string;
  action?: PermissionAction;
  fallback?: ReactNode;
  children: ReactNode;
}

export const WithPermission: React.FC<WithPermissionProps> = ({
  resource,
  action,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission } = usePermissions();
  
  const hasAccess = action 
    ? hasPermission(resource, action)
    : hasAnyPermission(resource);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Component for conditionally rendering based on route access
interface WithRouteAccessProps {
  route: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export const WithRouteAccess: React.FC<WithRouteAccessProps> = ({
  route,
  fallback = null,
  children,
}) => {
  const { canAccessRoute } = usePermissions();
  
  return canAccessRoute(route) ? <>{children}</> : <>{fallback}</>;
};