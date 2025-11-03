// Permission management utilities
export interface UserPermissions {
  [resource: string]: string[];
}

export interface UserData {
  userId: string;
  userName: string;
  email: string;
  fullName: string;
  roles: string[];
  token: string;
  permissions: UserPermissions;
}

export interface LoginResponse {
  data: UserData;
  statusCode: number;
  statusMessage: string;
  misc: any;
}

export type PermissionAction = 'Read' | 'Create' | 'Update' | 'Delete';

// Local storage keys
export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  TOKEN: 'token',
  PERMISSIONS: 'permissions',
} as const;

/**
 * Save user data to localStorage
 */
export const saveUserData = (userData: UserData): void => {
  try {
    if (typeof window === 'undefined') return; // SSR safety
    
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    localStorage.setItem(STORAGE_KEYS.TOKEN, userData.token);
    localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(userData.permissions));
    
    // Backward compatibility - save userName separately
    localStorage.setItem('userName', userData.userName);
  } catch (error) {
    console.error('Error saving user data to localStorage:', error);
  }
};

/**
 * Get user data from localStorage
 */
export const getUserData = (): UserData | null => {
  try {
    if (typeof window === 'undefined') return null; // SSR safety
    
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data from localStorage:', error);
    return null;
  }
};

/**
 * Get user permissions from localStorage
 */
export const getUserPermissions = (): UserPermissions => {
  try {
    if (typeof window === 'undefined') return {}; // SSR safety
    
    const permissions = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
    return permissions ? JSON.parse(permissions) : {};
  } catch (error) {
    console.error('Error getting permissions from localStorage:', error);
    return {};
  }
};

/**
 * Get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  try {
    if (typeof window === 'undefined') return null; // SSR safety
    
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting token from localStorage:', error);
    return null;
  }
};

/**
 * Clear all user data from localStorage
 */
export const clearUserData = (): void => {
  try {
    if (typeof window === 'undefined') return; // SSR safety
    
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PERMISSIONS);
    
    // Backward compatibility - clear userName
    localStorage.removeItem('userName');
  } catch (error) {
    console.error('Error clearing user data from localStorage:', error);
  }
};

/**
 * Check if user is SuperAdmin (has access to everything)
 */
export const isSuperAdmin = (permissions?: UserPermissions): boolean => {
  const userPermissions = permissions || getUserPermissions();
  return !!(userPermissions['All'] && userPermissions['All'].length > 0);
};

/**
 * Check if user has specific permission for a resource
 */
export const hasPermission = (
  resource: string,
  action: PermissionAction,
  permissions?: UserPermissions
): boolean => {
  const userPermissions = permissions || getUserPermissions();
  
  // SuperAdmin has access to everything
  if (isSuperAdmin(userPermissions)) {
    return true;
  }
  
  const resourcePermissions = userPermissions[resource];
  return resourcePermissions ? resourcePermissions.includes(action) : false;
};

/**
 * Check if user has any permission for a resource
 */
export const hasAnyPermission = (
  resource: string,
  permissions?: UserPermissions
): boolean => {
  const userPermissions = permissions || getUserPermissions();
  
  // SuperAdmin has access to everything
  if (isSuperAdmin(userPermissions)) {
    return true;
  }
  
  const resourcePermissions = userPermissions[resource];
  return resourcePermissions ? resourcePermissions.length > 0 : false;
};

/**
 * Check if user can read a resource
 */
export const canRead = (resource: string, permissions?: UserPermissions): boolean => {
  const userPermissions = permissions || getUserPermissions();
  
  // SuperAdmin has access to everything
  if (isSuperAdmin(userPermissions)) {
    return true;
  }
  
  return hasPermission(resource, 'Read', permissions);
};

/**
 * Check if user can create a resource
 */
export const canCreate = (resource: string, permissions?: UserPermissions): boolean => {
  const userPermissions = permissions || getUserPermissions();
  
  // SuperAdmin has access to everything
  if (isSuperAdmin(userPermissions)) {
    return true;
  }
  
  return hasPermission(resource, 'Create', permissions);
};

/**
 * Check if user can update a resource
 */
export const canUpdate = (resource: string, permissions?: UserPermissions): boolean => {
  const userPermissions = permissions || getUserPermissions();
  
  // SuperAdmin has access to everything
  if (isSuperAdmin(userPermissions)) {
    return true;
  }
  
  return hasPermission(resource, 'Update', permissions);
};

/**
 * Check if user can delete a resource
 */
export const canDelete = (resource: string, permissions?: UserPermissions): boolean => {
  const userPermissions = permissions || getUserPermissions();
  
  // SuperAdmin has access to everything
  if (isSuperAdmin(userPermissions)) {
    return true;
  }
  
  return hasPermission(resource, 'Delete', permissions);
};

/**
 * Get all available actions for a resource
 */
export const getResourceActions = (
  resource: string,
  permissions?: UserPermissions
): PermissionAction[] => {
  const userPermissions = permissions || getUserPermissions();
  const resourcePermissions = userPermissions[resource];
  return resourcePermissions ? resourcePermissions as PermissionAction[] : [];
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  try {
    if (typeof window === 'undefined') return false; // SSR safety
    
    const token = getAuthToken();
    const userData = getUserData();
    return !!(token && userData);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Map resource names to their corresponding routes/paths
 */
export const RESOURCE_ROUTES: { [key: string]: string } = {
  // ZMS Resources - Setup
  'Company': '/organization',
  'Branch': '/branchs',
  'BranchSetting': '/branchs/settings',
  'Warehouse': '/warehouse',
  'Address': '/address',
  
  // Employee
  'Employee': '/employee',
  'EmployeeManagement': '/employeemanagement',
  
  // ZMS Company
  'ProjectTarget': '/projecttarget',
  
  // Account - Charts of Accounts
  'Equality': '/capitalaccount',
  'Liabilities': '/liabilities',
  'Assets': '/assets',
  'Assests': '/assets', // Handle both spellings
  'Expense': '/expense',
  'Revenue': '/revenue',
  
  // Contacts - DealLink
  'Seller': '/saller',
  'Buyer': '/buyer',
  
  // Contracts
  'Contract': '/contract',
  'DispatchNote': '/dispatchnote',
  'InspectionNote': '/inspectionnote',
  'Invoice': '/invoice',
  'Payment': '/payment',
  
  // Commission
  'CommissionInvoice': '/commisioninvoice',
  
  // Booking & Orders
  'BookingOrder': '/bookingorder',
  'Consignment': '/consignment',
  'Charges': '/charges',
  'BillPaymentInvoices': '/billpaymentinvoices',
  'Receipt': '/receipt',
  'BookingOrderReport': '/ablorderreport',
  
  // Additional resources
  'Customer': '/customer',
  'Supplier': '/suppliers',
  'Department': '/department',
  'Roles': '/roles',
  'Users': '/users',
  'Transporter': '/transporter',
  'TransporterCompany': '/transportercompany',
  'Vendor': '/vendors',
  'BusinessAssociate': '/businessassociate',
  'Brooker': '/brookers',
  
  // ABL Resources
  'AblAssets': '/ablAssests',
  'AblAssests': '/ablAssests', // Handle both spellings  
  'AblExpense': '/ablExpense',
  'AblExpenses': '/ablExpense',
  'AblLiabilities': '/ablLiabilities',
  'AblRevenue': '/ablRevenue',
  'AblDashboard': '/ABLDashboardlayout',
  'PaymentABL': '/paymentABL',
  
  // Voucher Resources
  'VoucherEntry': '/entryvoucher',
  'Voucher': '/entryvoucher',
  'Schedules': '/abl/schedules',
  'Invoices': '/abl/invoices',
  
  // Voucher Reports
  'GeneralLedger': '/entryvoucher/ledger',
  'GernalLedger': '/entryvoucher/ledger', // Handle misspelling
  'TrialBalance': '/entryvoucher/trailbalance',
  'AgingReport': '/agingreport',
  'VoucherReport': '/entryvoucher/ledger', // Generic voucher report
  
  // Transport Resources are already included above as they're shared
};

/**
 * Get route for a resource
 */
export const getResourceRoute = (resource: string): string | null => {
  return RESOURCE_ROUTES[resource] || null;
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (route: string, permissions?: UserPermissions): boolean => {
  const userPermissions = permissions || getUserPermissions();
  
  // Find resource by route
  const resource = Object.keys(RESOURCE_ROUTES).find(
    key => RESOURCE_ROUTES[key] === route
  );
  
  if (!resource) {
    // If route is not mapped, allow access (for non-protected routes)
    return true;
  }
  
  // Check if user has at least read permission for the resource
  return hasAnyPermission(resource, userPermissions);
};

/**
 * Filter menu items based on permissions
 */
export const filterMenuItemsByPermissions = (
  menuItems: any[],
  permissions?: UserPermissions
): any[] => {
  const userPermissions = permissions || getUserPermissions();
  
  // SuperAdmin can see everything
  if (isSuperAdmin(userPermissions)) {
    return menuItems;
  }
  
  const filteredItems = menuItems.map(item => {
    // If item has href, check if user can access it
    if (item.href) {
      return canAccessRoute(item.href, userPermissions) ? item : null;
    }
    
    // If item has sub_menu, filter sub items and include parent if any sub items are accessible
    if (item.sub_menu && Array.isArray(item.sub_menu)) {
      const filteredSubMenu = filterMenuItemsByPermissions(item.sub_menu, userPermissions);
      if (filteredSubMenu.length > 0) {
        return {
          ...item,
          sub_menu: filteredSubMenu
        };
      }
      return null;
    }
    
    // For headings and other items without href or sub_menu, include them conditionally
    return item;
  }).filter(Boolean);

  // Filter out headings that have no visible items following them
  const result: any[] = [];
  for (let i = 0; i < filteredItems.length; i++) {
    const item = filteredItems[i];
    
    // If it's a heading, check if there are any non-heading items after it
    if (item.type === 'heading') {
      // Look ahead to see if there are any visible items after this heading
      let hasVisibleItemsAfter = false;
      for (let j = i + 1; j < filteredItems.length; j++) {
        const nextItem = filteredItems[j];
        // Stop when we hit another heading
        if (nextItem.type === 'heading') {
          break;
        }
        // If we find any non-heading item, this heading should be included
        if (nextItem.type !== 'heading') {
          hasVisibleItemsAfter = true;
          break;
        }
      }
      
      // Only include the heading if there are visible items after it
      if (hasVisibleItemsAfter) {
        result.push(item);
      }
    } else {
      // Include all non-heading items that passed the permission check
      result.push(item);
    }
  }
  
  return result;
};