// apps/client/src/context/LeadDndContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { LeadStatus } from '@/types/lead';

interface LeadDndContextType {
  draggingLeadId: string | null;
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
  onDropLead: (leadId: string, targetStatus: LeadStatus) => void;
}) {
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);

  const startDrag = (id: string) => {
    setDraggingLeadId(id);
  };

  const endDrag = () => {
    setDraggingLeadId(null);
  };

  const dropLead = (leadId: string, targetStatus: LeadStatus) => {
    setDraggingLeadId(null);
    onDropLead(leadId, targetStatus);
  };

  return (
    <LeadDndContext.Provider
      value={{
        draggingLeadId,
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
