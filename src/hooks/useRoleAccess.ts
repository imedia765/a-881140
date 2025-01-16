import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { BaseUserRole, UserRole, UserRoles } from '@/types/member';

const ROLE_STALE_TIME = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const useRoleAccess = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: sessionData, error: sessionError } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        console.log('Checking session status...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          console.log('Found session for user:', session.user.id);
          const { error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
        }
        
        return session;
      } catch (error: any) {
        console.error('Session error:', error);
        await supabase.auth.signOut();
        localStorage.clear();
        throw error;
      }
    },
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
  });

  useEffect(() => {
    if (sessionError) {
      console.error('Session error:', sessionError);
      toast({
        title: "Session expired",
        description: "Please sign in again",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [sessionError, navigate, toast]);

  const { 
    data: roleData, 
    isLoading: roleLoading, 
    error: roleError 
  } = useQuery({
    queryKey: ['userRoles', sessionData?.user?.id],
    queryFn: async () => {
      if (!sessionData?.user) {
        console.log('No session found in role check');
        return { userRole: null, userRoles: null };
      }

      console.log('Fetching roles for user:', sessionData.user.id);
      
      try {
        console.log('Querying user_roles table...');
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', sessionData.user.id);

        if (roleError) {
          console.error('Error fetching roles:', roleError);
          throw roleError;
        }

        if (roleData && roleData.length > 0) {
          console.log('Found roles in database:', roleData);
          const roles = roleData.map(r => r.role as BaseUserRole);
          console.log('Mapped roles:', roles);
          
          const userRoles = roles as UserRoles;
          
          let userRole: UserRole = null;
          if (roles.includes('admin')) {
            userRole = 'admin';
          } else if (roles.includes('collector')) {
            userRole = 'collector';
          } else if (roles.includes('member')) {
            userRole = 'member';
          }
          
          return { userRole, userRoles };
        }

        return { 
          userRole: 'member' as UserRole, 
          userRoles: ['member'] as UserRoles 
        };
      } catch (error) {
        console.error('Error in role check:', error);
        throw error;
      }
    },
    enabled: !!sessionData?.user?.id,
    staleTime: ROLE_STALE_TIME,
    gcTime: ROLE_STALE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const hasRole = (role: BaseUserRole): boolean => {
    return roleData?.userRoles?.includes(role) || false;
  };

  const hasAnyRole = (roles: BaseUserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const canAccessTab = (tab: string): boolean => {
    console.log('Checking access for tab:', tab, 'User roles:', roleData?.userRoles);
    
    if (!roleData?.userRoles) return false;

    if (hasRole('admin')) {
      console.log('User has admin role, granting full access');
      return ['dashboard', 'users', 'collectors', 'audit', 'system', 'financials'].includes(tab);
    }
    
    if (hasRole('collector')) {
      console.log('User has collector role, granting collector access');
      return ['dashboard', 'users'].includes(tab);
    }
    
    if (hasRole('member')) {
      console.log('User has member role, granting basic access');
      return tab === 'dashboard';
    }

    console.log('No matching role found, denying access');
    return false;
  };

  return {
    userRole: roleData?.userRole ?? null,
    userRoles: roleData?.userRoles ?? null,
    roleLoading: roleLoading || !sessionData,
    error: roleError,
    canAccessTab,
    hasRole,
    hasAnyRole
  };
};