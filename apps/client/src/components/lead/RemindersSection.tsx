import React from 'react';
import { ActivitySection } from './ActivityFeature';
import { SectionSummary } from '@/types/leadActivities';

export default function RemindersSection({ leadId, summary }: { leadId: string; summary?: SectionSummary }) {
  return <ActivitySection leadId={leadId} kind="reminders" summary={summary} />;
}
