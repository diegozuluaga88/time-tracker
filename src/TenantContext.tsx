import { createContext, useContext, useState, type ReactNode } from 'react';

export type Tenant = string;

interface TenantContextType {
    selectedTenants: Tenant[];
    tenants: Tenant[];
    toggleTenant: (tenant: Tenant) => void;
    selectAll: () => void;
    clearAll: () => void;
    /** @deprecated use selectedTenants[0] */
    currentTenant: Tenant;
}

// DE1.1 · Diego 2026-09-01 · demo template · tenants genéricos (Dealer 1..5)
// para no acoplarse a ningún cliente concreto. Cambiar aquí + en la sección
// del navbar bastan para rebrandiar el demo cuando se personalice.
const ALL_TENANTS: Tenant[] = ['Dealer 1', 'Dealer 2', 'Dealer 3', 'Dealer 4', 'Dealer 5'];

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    const [selectedTenants, setSelectedTenants] = useState<Tenant[]>(['Dealer 1']);

    const toggleTenant = (tenant: Tenant) => {
        setSelectedTenants(prev => {
            if (prev.includes(tenant)) {
                if (prev.length === 1) return prev; // keep at least 1
                return prev.filter(t => t !== tenant);
            }
            return [...prev, tenant];
        });
    };

    const selectAll = () => setSelectedTenants([...ALL_TENANTS]);
    const clearAll = () => setSelectedTenants([ALL_TENANTS[0]]);

    return (
        <TenantContext.Provider value={{
            selectedTenants,
            tenants: ALL_TENANTS,
            toggleTenant,
            selectAll,
            clearAll,
            currentTenant: selectedTenants[0],
        }}>
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
