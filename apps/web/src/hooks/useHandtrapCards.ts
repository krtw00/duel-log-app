import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { UserHandtrapCard } from '../utils/handtraps.js';

type HandtrapCardsResponse = { data: UserHandtrapCard[] };

export function useUserHandtrapCards() {
  return useQuery({
    queryKey: ['handtrap-cards'],
    queryFn: () => api<HandtrapCardsResponse>('/handtrap-cards'),
  });
}

export function useCreateHandtrapCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      api<{ data: UserHandtrapCard }>('/handtrap-cards', {
        method: 'POST',
        body: { name },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handtrap-cards'] });
    },
  });
}

export function useDeleteHandtrapCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api(`/handtrap-cards/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handtrap-cards'] });
    },
  });
}
