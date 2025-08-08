# 🔐 Admin Access Setup Guide

This guide explains how to set up and manage admin access in your AnyCademy platform.

## 🏗️ Initial Setup

### 1. Run the Database Migration

First, run the SQL migration to add user roles:

```bash
# In your Supabase SQL editor, run:
psql -f database_add_user_roles.sql
```

Or copy and paste the contents of `database_add_user_roles.sql` into your Supabase SQL editor.

### 2. Create Your First Admin User

After running the migration, you need to manually set at least one user as an admin:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';
```

If you don't know your user ID, you can find it in the auth.users table:

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then update the profile
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = 'your-user-id-here';
```

## 👥 User Roles Explained

### Role Hierarchy

1. **Super Admin** (`super_admin`)
   - Can manage all user roles
   - Access to user management page (`/admin/users`)
   - Access to all admin functions
   - Highest level of access

2. **Admin** (`admin`)
   - Access to admin payouts page (`/admin/payouts`)
   - Can manage financial operations
   - Cannot change user roles

3. **Instructor** (`instructor`)
   - Can create and manage courses
   - Access to instructor earnings page
   - Can only see their own courses and earnings

4. **Student** (`student`)
   - Default role for new users
   - Can enroll in courses
   - Access to enrolled course content

## 🛠️ Managing User Roles

### Via User Management Interface

1. Log in as a Super Admin
2. Navigate to `/admin/users`
3. Search for users by email or name
4. Change roles using the dropdown menu

### Via SQL (Direct Database)

```sql
-- Make a user an instructor
UPDATE profiles SET role = 'instructor' WHERE email = 'instructor@example.com';

-- Make a user an admin
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- Make a user a super admin (be careful!)
UPDATE profiles SET role = 'super_admin' WHERE email = 'superadmin@example.com';

-- Reset a user to student
UPDATE profiles SET role = 'student' WHERE email = 'user@example.com';
```

## 🔒 Access Control

### What Each Role Can Access

**Students:**
- Browse and enroll in courses
- Access enrolled course content
- View their own dashboard

**Instructors:**
- Everything students can do
- Create and edit courses
- View instructor earnings
- Manage their own course content

**Admins:**
- Everything instructors can do
- Access admin payout management (`/admin/payouts`)
- View platform financial data
- Process instructor payments

**Super Admins:**
- Everything admins can do
- Access user management (`/admin/users`)
- Change user roles
- Full platform control

### Protected Routes

- `/admin/payouts` - Requires `admin` or `super_admin` role
- `/admin/users` - Requires `super_admin` role only

## 🚨 Security Best Practices

### 1. Limit Super Admin Access

Only give super admin access to users who absolutely need it. Most admin functions can be handled with the regular `admin` role.

### 2. Regular Access Reviews

Periodically review user roles to ensure they still match user responsibilities:

```sql
-- Get overview of all user roles
SELECT 
  role,
  COUNT(*) as count
FROM profiles 
GROUP BY role 
ORDER BY count DESC;

-- List all admins and super admins
SELECT 
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY role, created_at;
```

### 3. Monitor Role Changes

Consider adding audit logging for role changes in the future.

## 🔧 How It Works Technically

### Database Structure

- **profiles table**: Stores user information including the `role` column
- **user_role enum**: Defines allowed roles (`student`, `instructor`, `admin`, `super_admin`)
- **RLS policies**: Enforce access control at the database level

### Frontend Components

- **useUserRole hook**: Manages user role state and provides helper functions
- **AdminRoute component**: Protects admin routes
- **Navbar**: Shows/hides admin menu based on role

### Helper Functions

```typescript
const { isAdmin, isSuperAdmin, isInstructor } = useUserRole();

// Check if user can access admin features
if (isAdmin()) {
  // Show admin features
}

// Check if user can manage other users
if (isSuperAdmin()) {
  // Show user management features
}
```

## 🐛 Troubleshooting

### User Can't Access Admin Features

1. Check their role in the database:
   ```sql
   SELECT email, role FROM profiles WHERE email = 'user@example.com';
   ```

2. If role is correct but still no access, check browser console for errors

3. Ensure the user has logged out and back in after role change

### Admin Menu Not Showing

1. The admin menu only shows for users with `admin` or `super_admin` roles
2. The user must be logged in
3. Check the browser console for any JavaScript errors

### Can't Change User Roles

1. Only super admins can change user roles
2. Ensure you're logged in as a super admin
3. Check the browser network tab for API errors

## 📝 Next Steps

1. Run the database migration
2. Set yourself as a super admin
3. Test the admin access
4. Create additional admin users as needed
5. Set up instructors and test their access
6. Document your admin procedures for your team

## 🔄 Future Enhancements

Consider adding:
- Audit logging for role changes
- Bulk role assignment
- Role-based permissions for specific features
- Time-limited admin access
- Multi-factor authentication for admin users
