import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole, UserRole } from '@/hooks/use-user-role';
import { toast } from '@/hooks/use-toast';
import { Users, Search, Crown, GraduationCap, UserCheck, Shield, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string | null;
  updated_at: string | null;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const { updateUserRole, isSuperAdmin } = useUserRole();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isSuperAdmin()) {
      toast({
        title: "Error",
        description: "Only super admins can change user roles",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(userId);
      await updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole, updated_at: new Date().toISOString() }
          : user
      ));

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-red-400" />;
      case 'instructor':
        return <GraduationCap className="w-4 h-4 text-blue-400" />;
      case 'student':
        return <UserCheck className="w-4 h-4 text-green-400" />;
      default:
        return <UserCheck className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'secondary';
      case 'instructor':
        return 'default';
      case 'student':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const roleStats = {
    total: users.length,
    super_admin: users.filter(u => u.role === 'super_admin').length,
    admin: users.filter(u => u.role === 'admin').length,
    instructor: users.filter(u => u.role === 'instructor').length,
    student: users.filter(u => u.role === 'student').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-quant-blue-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <div className="text-center text-quant-white">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quant-blue-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-quant-white mb-2">User Management</h1>
          <p className="text-quant-white/60">Manage user roles and permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-quant-white/60">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-quant-white">{roleStats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-quant-white/60">Super Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{roleStats.super_admin}</div>
            </CardContent>
          </Card>

          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-quant-white/60">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{roleStats.admin}</div>
            </CardContent>
          </Card>

          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-quant-white/60">Instructors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{roleStats.instructor}</div>
            </CardContent>
          </Card>

          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-quant-white/60">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{roleStats.student}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-quant-blue/20 border-quant-blue mb-6">
          <CardHeader>
            <CardTitle className="text-quant-white">Filter Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-quant-white/40" />
                  <Input
                    placeholder="Search by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-quant-blue/20 border-quant-blue text-quant-white"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                <SelectTrigger className="w-full md:w-[200px] bg-quant-blue/20 border-quant-blue text-quant-white">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="instructor">Instructors</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="super_admin">Super Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {!isSuperAdmin() && (
          <Alert className="mb-6 bg-yellow-900 border-yellow-700">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              You have read-only access. Only super admins can modify user roles.
            </AlertDescription>
          </Alert>
        )}

        {/* Users List */}
        <Card className="bg-quant-blue/20 border-quant-blue">
          <CardHeader>
            <CardTitle className="text-quant-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({filteredUsers.length})
            </CardTitle>
            <CardDescription className="text-quant-white/60">
              Manage user roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-quant-blue/10 rounded-lg border border-quant-blue/20">
                  <div className="flex items-center gap-4">
                    {getRoleIcon(user.role)}
                    <div>
                      <div className="font-medium text-quant-white">
                        {user.full_name || 'No name'}
                      </div>
                      <div className="text-sm text-quant-white/60">{user.email}</div>
                      <div className="text-xs text-quant-white/40">
                        Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                      {user.role.replace('_', ' ')}
                    </Badge>
                    
                    {isSuperAdmin() && (
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole as UserRole)}
                        disabled={updating === user.id}
                      >
                        <SelectTrigger className="w-[140px] bg-quant-blue/20 border-quant-blue text-quant-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="instructor">Instructor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-quant-white/60">
                  No users found matching your criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
