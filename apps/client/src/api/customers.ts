import { api } from './client';
import { Customer, CustomerFilters, CustomerPage } from '@/types/customer';

export async function fetchCustomers(filters: CustomerFilters): Promise<CustomerPage> {
  const response = await api.get<CustomerPage>('/customers', { params: filters });
  return response.data;
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const response = await api.get<Customer>(`/customers/${encodeURIComponent(id)}`);
  return response.data;
}

export async function fetchCustomerByLead(leadId: string): Promise<Customer | null> {
  const response = await api.get<{ customer: Customer | null }>(
    `/customers/by-lead/${encodeURIComponent(leadId)}`,
  );
  return response.data.customer;
}

export async function convertLeadRequest(leadId: string, version: number): Promise<Customer> {
  const response = await api.post<Customer>(
    `/customers/from-lead/${encodeURIComponent(leadId)}`,
    { version },
  );
  return response.data;
}
