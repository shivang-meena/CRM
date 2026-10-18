import React from 'react';
import { ActivitySection } from './ActivityFeature';
import { SectionSummary } from '@/types/leadActivities';

export default function TasksSection({ leadId, summary }: { leadId: string; summary?: SectionSummary }) {
  return <ActivitySection leadId={leadId} kind="tasks" summary={summary} />;
}
