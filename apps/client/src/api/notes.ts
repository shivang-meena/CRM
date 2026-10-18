import { api } from './client';
import { Note, NoteFilters, NotePage } from '@/types/note';

export async function fetchNotes(filters: NoteFilters) { return (await api.get<NotePage>('/notes', { params: filters })).data; }
export async function fetchNote(id: string) { return (await api.get<Note>(`/notes/${id}`)).data; }
export async function createNote(data: { content: string; requestKey: string }) { return (await api.post<Note>('/notes', data)).data; }
export async function updateNote(id: string, data: { content: string; version: number }) { return (await api.patch<Note>(`/notes/${id}`, data)).data; }
export async function deleteNote(id: string, version: number) { return (await api.delete(`/notes/${id}`, { data: { version } })).data; }
