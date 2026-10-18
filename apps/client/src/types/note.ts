export type Note = {
  id: string;
  content: string;
  type: 'Note';
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
};

export type NoteFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type NotePage = {
  items: Note[];
  total: number;
  page: number;
  pageSize: number;
};
