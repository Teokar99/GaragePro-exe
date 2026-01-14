import { useAuth } from './useAuth';

/**
 * Enum of user roles in the auto shop management system
 * admin: Full system access and management capabilities
 * mechanic: Can view and work with services, customers, and vehicles
 * secretary: Can view data and manage customer information
 */
export type UserRole = 'admin' | 'mechanic' | 'secretary';

/**
 * Permissions Object
 * Defines access control for various features based on user role
 */
export interface Permissions {
  canViewDashboard: boolean;
  canViewCustomers: boolean;
  canViewServices: boolean;
  canViewFinancials: boolean;
  canManageUsers: boolean;
  canEditCustomers: boolean;
  canEditServices: boolean;
  role: UserRole | null;
}

/**
 * usePermissions Hook
 * Determines user permissions based on their role
 * Used throughout the app to enable/disable features and UI elements
 *
 * Permissions by role:
 * - admin: Full access to all features including financials and user management
 * - mechanic: Can view, create, and edit services, customers, and vehicles (no financials or user management)
 * - secretary: Can view, create, and edit services, customers, and vehicles (no financials or user management)
 */
export function usePermissions(): Permissions {
  const { userProfile } = useAuth();
  const role = userProfile?.role as UserRole | null;

  /**
   * Dashboard and core view permissions
   * All roles can view dashboard and customer/service data
   */
  const canViewDashboard = role === 'admin' || role === 'mechanic' || role === 'secretary';
  const canViewCustomers = role === 'admin' || role === 'mechanic' || role === 'secretary';
  const canViewServices = role === 'admin' || role === 'mechanic' || role === 'secretary';

  /**
   * Admin-only permissions
   * Only admins can view financial data and manage users
   */
  const canViewFinancials = role === 'admin';
  const canManageUsers = role === 'admin';

  /**
   * Edit permissions
   * Admins, mechanics, and secretaries can edit customers and services
   */
  const canEditCustomers = role === 'admin' || role === 'mechanic' || role === 'secretary';
  const canEditServices = role === 'admin' || role === 'mechanic' || role === 'secretary';

  return {
    canViewDashboard,
    canViewCustomers,
    canViewServices,
    canViewFinancials,
    canManageUsers,
    canEditCustomers,
    canEditServices,
    role,
  };
}
