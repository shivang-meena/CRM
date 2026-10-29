// apps/client/src/context/LeadDndContext.tsx
import React, { createContext, useContext, useRef, useState } from 'react';
import { LeadStatus } from '@/types/lead';

interface LeadDndContextType {
  draggingLeadId: string | null;
  pendingLeadIds: ReadonlySet<string>;
  startDrag: (id: string) => void;
  endDrag: () => void;
  dropLead: (leadId: string, targetStatus: LeadStatus) => void;
}

const LeadDndContext = createContext<LeadDndContextType | null>(null);

export function LeadDndProvider({
  children,
  onDropLead,
}: {
  children: React.ReactNode;
  onDropLead: (leadId: string, targetStatus: LeadStatus) => void | Promise<void>;
}) {
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [pendingLeadIds, setPendingLeadIds] = useState<ReadonlySet<string>>(new Set());
  const pendingLeadIdsRef = useRef(new Set<string>());

  const startDrag = (id: string) => {
    setDraggingLeadId(id);
  };

  const endDrag = () => {
    setDraggingLeadId(null);
  };

  const dropLead = async (leadId: string, targetStatus: LeadStatus) => {
    setDraggingLeadId(null);
    if (pendingLeadIdsRef.current.has(leadId)) return;

    pendingLeadIdsRef.current.add(leadId);
    setPendingLeadIds(new Set(pendingLeadIdsRef.current));
    try {
      await onDropLead(leadId, targetStatus);
    } catch {
      // The lead mutation handles rollback and reports its own errors.
    } finally {
      pendingLeadIdsRef.current.delete(leadId);
      setPendingLeadIds(new Set(pendingLeadIdsRef.current));
    }
  };

  return (
    <LeadDndContext.Provider
      value={{
        draggingLeadId,
        pendingLeadIds,
        startDrag,
        endDrag,
        dropLead,
      }}
    >
      {children}
    </LeadDndContext.Provider>
  );
}

export function useLeadDnd() {
  return useContext(LeadDndContext);
}
