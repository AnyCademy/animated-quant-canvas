-- Step 1: Create user role enum type
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin', 'super_admin');

-- Step 2: Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN role user_role DEFAULT 'student' NOT NULL;

-- Step 3: Create index for role
CREATE INDEX idx_profiles_role ON profiles(role);

-- Step 4: Create RLS policies (ensure tables exist first)
CREATE POLICY "admin_payments_access" 
ON payments 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "instructor_course_management" 
ON courses 
FOR ALL 
TO authenticated 
USING (
  instructor_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Optional: Comments
COMMENT ON COLUMN profiles.role IS 'User role: student (default), instructor, admin, super_admin';
COMMENT ON TYPE user_role IS 'Enum for user roles in the platform';