import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'moderator' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface UserWithRole {
  user_id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  role: AppRole | null;
}

export function useUserRoles() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if current user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setUserRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setUserRole(null);
      } else {
        const role = data?.role as AppRole;
        setUserRole(role);
        setIsAdmin(role === 'admin');
      }
      setLoading(false);
    }

    checkAdminStatus();
  }, [user]);

  // Fetch all users (only for admins)
  const fetchUsers = async () => {
    if (!isAdmin) return;

    setLoading(true);
    
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    // Fetch roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Combine profiles with roles
    const usersWithRoles: UserWithRole[] = profiles.map(profile => {
      const userRoleData = roles?.find(r => r.user_id === profile.user_id);
      return {
        user_id: profile.user_id,
        email: profile.email,
        name: profile.name,
        created_at: profile.created_at,
        role: (userRoleData?.role as AppRole) || null
      };
    });

    setUsers(usersWithRoles);
    setLoading(false);
  };

  // Assign role to user
  const assignRole = async (userId: string, role: AppRole) => {
    if (!isAdmin) return { error: new Error('Não autorizado') };

    // Check if user already has a role
    const { data: existing } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing role
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) return { error };
    } else {
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) return { error };
    }

    await fetchUsers();
    return { error: null };
  };

  // Remove role from user
  const removeRole = async (userId: string) => {
    if (!isAdmin) return { error: new Error('Não autorizado') };

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) return { error };

    await fetchUsers();
    return { error: null };
  };

  return {
    isAdmin,
    userRole,
    users,
    loading,
    fetchUsers,
    assignRole,
    removeRole
  };
}
