import React from 'react';
import { ActivitySection } from './ActivityFeature';
import { SectionSummary } from '@/types/leadActivities';

export default function MeetingsSection({ leadId, summary }: { leadId: string; summary?: SectionSummary }) {
  return <ActivitySection leadId={leadId} kind="meetings" summary={summary} />;
}
