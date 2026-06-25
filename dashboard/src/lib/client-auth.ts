import api from './api';

export interface ClientSession {
  token: string;
  client: {
    id: number;
    company_name: string;
    contact_person: string;
    email: string;
    status: string;
    has_signed: boolean;
    avatar_url?: string;
  };
}

export async function clientLogin(email: string, password: string): Promise<ClientSession> {
  localStorage.removeItem('client_token');
  localStorage.removeItem('client');
  const { data } = await api.post('/auth/client/login', { email: email.trim(), password });
  localStorage.setItem('client_token', data.token);
  localStorage.setItem('client', JSON.stringify(data.client));
  return data;
}

export function clientLogout(): void {
  localStorage.removeItem('client_token');
  localStorage.removeItem('client');
  window.location.href = '/client-login';
}

export function getClient(): ClientSession['client'] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('client');
  return raw ? JSON.parse(raw) : null;
}

export function isClientAuthenticated(): boolean {
  return !!localStorage.getItem('client_token');
}
