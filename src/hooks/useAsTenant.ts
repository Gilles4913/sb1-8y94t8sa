import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useAsTenant() {
  const { profile } = useAuth();
  const [asTenantId, setAsTenantId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryTenantId = params.get('asTenant');
    const storedTenantId = localStorage.getItem('as_tenant_id');

    if (queryTenantId) {
      localStorage.setItem('as_tenant_id', queryTenantId);
      setAsTenantId(queryTenantId);
    } else if (storedTenantId) {
      setAsTenantId(storedTenantId);
    } else {
      setAsTenantId(null);
    }
  }, []);

  const setAsTenant = (tenantId: string | null) => {
    if (tenantId) {
      localStorage.setItem('as_tenant_id', tenantId);
      setAsTenantId(tenantId);
    } else {
      localStorage.removeItem('as_tenant_id');
      setAsTenantId(null);
    }
  };

  const clearAsTenant = () => {
    localStorage.removeItem('as_tenant_id');
    setAsTenantId(null);
    window.location.href = '/super';
  };

  const isMasquerading = profile?.role === 'super_admin' && !!asTenantId;

  const effectiveTenantId = asTenantId || profile?.tenant_id || null;

  return {
    asTenantId,
    isMasquerading,
    setAsTenantId: setAsTenant,
    clearAsTenant,
    effectiveTenantId,
  };
}
