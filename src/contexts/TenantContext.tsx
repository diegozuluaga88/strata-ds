import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

// Auth types matching GraphQL schema
export interface RoleDetails {
  id: number;
  name: string;
  description?: string;
}

export interface TenantDetails {
  id: number;
  name: string;
  description?: string;
  url?: string;
  mfaRequired?: boolean;
}

export interface UserDetails {
  role: RoleDetails;
  tenant: TenantDetails;
}

// Aggregated tenant with all available roles
export interface TenantWithRoles {
  tenant: TenantDetails;
  roles: RoleDetails[];
}

interface TenantContextType {
  /** Current selected tenant name (for backward compatibility with navbar) */
  currentTenant: string;
  /** Array of all tenant names (for backward compatibility with navbar) */
  tenants: string[];
  /** Set current tenant by name */
  setTenant: (tenantName: string) => void;
  /** Full current tenant object with all roles */
  currentTenantDetails: TenantWithRoles | null;
  /** All tenants with their roles */
  allTenants: TenantWithRoles[];
  /** Current selected role for current tenant */
  currentRole: RoleDetails | null;
  /** Set current role by ID */
  setRole: (roleId: number) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Default mock data for storybook/dev
const DEFAULT_USER_DETAILS: UserDetails[] = [
  {
    role: { id: 1, name: 'Administrator' },
    tenant: { id: 1, name: 'Acme Corp' },
  },
  {
    role: { id: 2, name: 'Viewer' },
    tenant: { id: 1, name: 'Acme Corp' },
  },
  {
    role: { id: 1, name: 'Administrator' },
    tenant: { id: 2, name: 'Globex' },
  },
  {
    role: { id: 1, name: 'Administrator' },
    tenant: { id: 3, name: 'Initech' },
  },
];

export interface TenantProviderProps {
  children: ReactNode;
  /**
   * User details from getStrataUserDetails query.
   * Each entry contains tenant-role combination.
   * @default Mock data for storybook
   */
  userDetails?: UserDetails[];
  /**
   * Initial selected tenant ID.
   * @default First tenant in the list
   */
  defaultTenantId?: number;
  /**
   * Initial selected role ID for the default tenant.
   * @default First role for the tenant
   */
  defaultRoleId?: number;
  /**
   * Callback when tenant changes from navbar selector.
   * App should handle role selection (show dialog or auto-select single role).
   * Called with only tenantId - app decides role selection flow.
   */
  onTenantChange?: (tenantId: number) => void;
  /**
   * @deprecated Use onTenantChange instead
   * Callback when tenant or role changes.
   */
  onTenantRoleChange?: (tenantId: number, roleId: number) => void;
}

export function TenantProvider({
  children,
  userDetails = DEFAULT_USER_DETAILS,
  defaultTenantId,
  defaultRoleId,
  onTenantChange,
  onTenantRoleChange,
}: TenantProviderProps) {
  // Group user details by tenant
  const allTenants = useMemo((): TenantWithRoles[] => {
    const tenantMap = new Map<number, TenantWithRoles>();

    userDetails.forEach(({ tenant, role }) => {
      if (!tenantMap.has(tenant.id)) {
        tenantMap.set(tenant.id, {
          tenant,
          roles: [],
        });
      }
      const entry = tenantMap.get(tenant.id)!;
      // Avoid duplicate roles
      if (!entry.roles.some(r => r.id === role.id)) {
        entry.roles.push(role);
      }
    });

    return Array.from(tenantMap.values());
  }, [userDetails]);

  // Determine initial tenant
  const initialTenant = useMemo(() => {
    if (defaultTenantId) {
      const found = allTenants.find(t => t.tenant.id === defaultTenantId);
      if (found) return found;
    }
    return allTenants[0] || null;
  }, [allTenants, defaultTenantId]);

  // Determine initial role
  const initialRole = useMemo(() => {
    if (!initialTenant) return null;
    if (defaultRoleId) {
      const found = initialTenant.roles.find(r => r.id === defaultRoleId);
      if (found) return found;
    }
    return initialTenant.roles[0] || null;
  }, [initialTenant, defaultRoleId]);

  const [currentTenantDetails, setCurrentTenantDetails] = useState<TenantWithRoles | null>(initialTenant);
  const [currentRole, setCurrentRole] = useState<RoleDetails | null>(initialRole);

  // Backward compatible values (tenant names as strings)
  const currentTenant = currentTenantDetails?.tenant.name || '';
  const tenants = useMemo(() => allTenants.map(t => t.tenant.name), [allTenants]);

  const setTenant = (tenantName: string) => {
    const found = allTenants.find(t => t.tenant.name === tenantName);
    if (found) {
      // Skip if selecting same tenant
      if (currentTenantDetails?.tenant.id === found.tenant.id) {
        return;
      }

      setCurrentTenantDetails(found);

      // Call new callback (app handles role selection)
      if (onTenantChange) {
        onTenantChange(found.tenant.id);
        return; // Let app handle role selection
      }

      // Deprecated path: auto-select first role for backward compatibility
      const newRole = found.roles[0] || null;
      setCurrentRole(newRole);

      if (onTenantRoleChange && newRole) {
        onTenantRoleChange(found.tenant.id, newRole.id);
      }
    }
  };

  const setRole = (roleId: number) => {
    if (!currentTenantDetails) return;
    const found = currentTenantDetails.roles.find(r => r.id === roleId);
    if (found) {
      setCurrentRole(found);

      if (onTenantRoleChange) {
        onTenantRoleChange(currentTenantDetails.tenant.id, roleId);
      }
    }
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        tenants,
        setTenant,
        currentTenantDetails,
        allTenants,
        currentRole,
        setRole,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
