import { supabase } from "./supabase";
import type { User } from "@shared/schema";

export interface SessionUser {
  id: string;
  email: string;
  nome: string;
  role: string;
  vendedor_id: number | null;
}

// Login: verificar credenciais no Supabase
export async function login(email: string, password: string): Promise<SessionUser | null> {
  try {
    // Usar Supabase Auth para autenticação
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('[AUTH] Erro ao autenticar:', authError?.message);
      return null;
    }

    // Buscar dados adicionais do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      console.error('[AUTH] Usuário não encontrado na tabela users:', userError?.message);
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      nome: userData.nome,
      role: userData.role,
      vendedor_id: userData.vendedor_id,
    };
  } catch (error: any) {
    console.error('[AUTH] Erro no login:', error);
    return null;
  }
}

// Buscar usuário por ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[AUTH] Erro ao buscar usuário:', error);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('[AUTH] Erro ao buscar usuário:', error);
    return null;
  }
}

// Criar novo usuário (apenas admin)
export async function createUser(email: string, password: string, nome: string, role: string, vendedor_id?: number): Promise<User | null> {
  try {
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('[AUTH] Erro ao criar usuário no Auth:', authError?.message);
      return null;
    }

    // Inserir na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        nome,
        role,
        vendedor_id: vendedor_id || null,
      })
      .select()
      .single();

    if (userError) {
      console.error('[AUTH] Erro ao inserir usuário na tabela:', userError);
      return null;
    }

    return userData;
  } catch (error: any) {
    console.error('[AUTH] Erro ao criar usuário:', error);
    return null;
  }
}
