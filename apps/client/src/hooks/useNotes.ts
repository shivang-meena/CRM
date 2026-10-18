import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createNote, deleteNote, fetchNote, fetchNotes, updateNote } from '@/api/notes';
import { NoteFilters } from '@/types/note';

export function useNotes(filters: NoteFilters) {
  return useQuery({ queryKey: ['notes', filters], queryFn: () => fetchNotes(filters), placeholderData: keepPreviousData });
}

export function useNote(id: string | null) {
  return useQuery({ queryKey: ['note', id], queryFn: () => fetchNote(id!), enabled: !!id });
}

export function useNoteActions() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notes'] });
    void queryClient.invalidateQueries({ queryKey: ['note'] });
  };
  return {
    create: useMutation({ mutationFn: createNote, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, data }: { id: string; data: { content: string; version: number } }) => updateNote(id, data), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: ({ id, version }: { id: string; version: number }) => deleteNote(id, version), onSuccess: invalidate }),
  };
}
