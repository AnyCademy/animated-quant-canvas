import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'student' | 'instructor' | 'admin' | 'super_admin';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string | null;
  updated_at: string | null;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // If profile doesn't exist, create one with default role
      await createUserProfile();
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          role: 'student' as UserRole
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (!isAdmin()) {
      throw new Error('Only admins can update user roles');
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  // Helper functions to check roles
  const isStudent = () => profile?.role === 'student';
  const isInstructor = () => profile?.role === 'instructor';
  const isAdmin = () => profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = () => profile?.role === 'super_admin';
  const isInstructorOrAdmin = () => isInstructor() || isAdmin();

  return {
    profile,
    loading,
    isStudent,
    isInstructor,
    isAdmin,
    isSuperAdmin,
    isInstructorOrAdmin,
    updateUserRole,
    refetchProfile: fetchUserProfile
  };
};
