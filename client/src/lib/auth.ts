import { apiRequest } from './queryClient';

export interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  vendedor_id?: number | null;
}

export async function login(email: string, password: string): Promise<User> {
  const response = await apiRequest('POST', '/api/auth/login', { email, password });
  const data = await response.json();
  return data.user;
}

export async function logout(): Promise<void> {
  await apiRequest('POST', '/api/auth/logout');
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}
