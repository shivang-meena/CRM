import { useModuleQuery } from './useModuleQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, readNotification } from '@/api/notifications';
export function useNotifications(page = 1) { return useModuleQuery('reminder', { queryKey: ['notifications', page], queryFn: () => fetchNotifications(page), refetchInterval: 30000 }); }
export function useReadNotification() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: readNotification, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
}
