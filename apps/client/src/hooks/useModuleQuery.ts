import { skipToken, useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { usePermissions } from './usePermissions';
import type { ModulePermission } from './usePermissions';

type ModuleQueryOptions<TQueryFnData, TData> =
  Omit<UseQueryOptions<TQueryFnData, Error, TData>, 'enabled'> & { enabled?: boolean };

// Apply the same permissions to automatic fetching, polling, invalidation and manual refresh.
export function useModuleQuery<TQueryFnData, TData = TQueryFnData>(
  module: ModulePermission,
  options: ModuleQueryOptions<TQueryFnData, TData>,
) {
  const { canAccess } = usePermissions();
  const allowed = canAccess(module);
  const query = useQuery<TQueryFnData, Error, TData>({
    ...options,
    queryFn: allowed ? options.queryFn : skipToken,
    enabled: allowed && (options.enabled ?? true),
    retry: options.retry ?? ((failureCount, error) => {
      if (isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) return false;
      return failureCount < 3;
    }),
  });
  const refetch: typeof query.refetch = (refetchOptions) =>
    allowed ? query.refetch(refetchOptions) : Promise.resolve(query);

  // Disabled queries can retain cached data; do not expose it after access is removed.
  return { ...query, data: allowed ? query.data : undefined, refetch };
}
