import type { Admin } from '@prisma/client';
import type { PermissionMap } from './permissions';

type AdminFeatureFields = Pick<
  Admin,
  'featLead' | 'featReminder' | 'featMeeting' | 'featNote' | 'featCalendar' | 'featCustomer' | 'featInvoice' | 'featStaff' | 'featLeave'
>;

/** Maps an Admin row to the 9-module feature map. */
export function adminFeatures(admin: AdminFeatureFields): PermissionMap {
  return {
    lead: admin.featLead,
    reminder: admin.featReminder,
    meeting: admin.featMeeting,
    note: admin.featNote,
    calendar: admin.featCalendar,
    customer: admin.featCustomer,
    invoice: admin.featInvoice,
    staff: admin.featStaff,
    leave: admin.featLeave,
  };
}

/** module name -> Admin column name */
export const FEATURE_COLUMN = {
  lead: 'featLead',
  reminder: 'featReminder',
  meeting: 'featMeeting',
  note: 'featNote',
  calendar: 'featCalendar',
  customer: 'featCustomer',
  invoice: 'featInvoice',
  staff: 'featStaff',
  leave: 'featLeave',
} as const;

type StaffPermissionFields = {
  permLead: boolean; permReminder: boolean; permMeeting: boolean; permNote: boolean; permCalendar: boolean;
  permCustomer: boolean; permInvoice: boolean; permStaff: boolean; permLeave: boolean;
};

/** effective staff permission = what the Admin gave the staff AND what the Super Admin enabled for the Admin */
export function staffEffectivePermissions(staff: StaffPermissionFields, features: PermissionMap): PermissionMap {
  return {
    lead: staff.permLead && features.lead,
    reminder: staff.permReminder && features.reminder,
    meeting: staff.permMeeting && features.meeting,
    note: staff.permNote && features.note,
    calendar: staff.permCalendar && features.calendar,
    customer: staff.permCustomer && features.customer,
    invoice: staff.permInvoice && features.invoice,
    staff: staff.permStaff && features.staff,
    leave: staff.permLeave && features.leave,
  };
}
