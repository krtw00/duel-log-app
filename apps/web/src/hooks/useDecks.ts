import type { CreateDeck, Deck, Pagination, UpdateDeck } from '@duel-log/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

type DeckListResponse = { data: Deck[]; pagination: Pagination };

export function useDecks(params?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: ['decks', params],
    queryFn: () =>
      api<DeckListResponse>('/decks', {
        params: {
          active: params?.activeOnly ? 'true' : undefined,
        },
      }),
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDeck) => api<{ data: Deck }>('/decks', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useUpdateDeck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeck }) =>
      api<{ data: Deck }>(`/decks/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useArchiveDeck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ data: Deck }>(`/decks/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useUnarchiveDeck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ data: Deck }>(`/decks/${id}/unarchive`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useArchiveAllDecks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ data: { archivedCount: number } }>('/decks/archive-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/decks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}
