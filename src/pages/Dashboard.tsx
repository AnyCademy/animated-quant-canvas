
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Plus,
  Users,
  Eye,
  DollarSign
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface DashboardData {
  total_courses_enrolled: number;
  courses_completed: number;
  current_streak: number;
  last_activity_date: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
}

interface Enrollment {
  id: string;
  course: Course;
  enrolled_at: string;
}

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch dashboard data
      const { data: dashData } = await supabase
        .from('user_dashboard_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setDashboardData(dashData);

      // Fetch enrolled courses
      const { data: enrollData, error: enrollError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses (*)
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (enrollError) throw enrollError;
      setEnrollments(enrollData || []);

      // Fetch courses created by user
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      setCreatedCourses(coursesData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-quant-blue-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-t-quant-teal border-quant-blue rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quant-blue-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Welcome back, {user?.email}!
          </h1>
          <p className="text-quant-white/70">
            Track your learning progress and manage your courses
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-quant-white">
                Enrolled Courses
              </CardTitle>
              <BookOpen className="h-4 w-4 text-quant-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-quant-white">
                {dashboardData?.total_courses_enrolled || enrollments.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-quant-white">
                Completed
              </CardTitle>
              <Trophy className="h-4 w-4 text-quant-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-quant-white">
                {dashboardData?.courses_completed || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-quant-white">
                Current Streak
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-quant-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-quant-white">
                {dashboardData?.current_streak || 0} days
              </div>
            </CardContent>
          </Card>

          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-quant-white">
                Created Courses
              </CardTitle>
              <Users className="h-4 w-4 text-quant-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-quant-white">
                {createdCourses.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Courses */}
          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-quant-white">My Courses</CardTitle>
                <CardDescription className="text-quant-white/70">
                  Courses you're enrolled in
                </CardDescription>
              </div>
              <Button
                onClick={() => navigate('/courses')}
                variant="outline"
                size="sm"
                className="border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark"
              >
                <Eye className="w-4 h-4 mr-2" />
                Browse All
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollments.length > 0 ? (
                enrollments.slice(0, 3).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 bg-quant-blue/10 rounded-lg cursor-pointer hover:bg-quant-blue/20 transition-colors"
                    onClick={() => navigate(`/course/${enrollment.course.id}`)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-quant-white">
                        {enrollment.course.title}
                      </h4>
                      <p className="text-sm text-quant-white/60">
                        Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Progress value={Math.random() * 100} className="w-20 mb-2" />
                      <p className="text-xs text-quant-white/60">
                        {Math.floor(Math.random() * 100)}% complete
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-quant-white/40 mx-auto mb-4" />
                  <p className="text-quant-white/60">No courses enrolled yet</p>
                  <Button
                    onClick={() => navigate('/courses')}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark"
                  >
                    Browse Courses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Created Courses */}
          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-quant-white">My Created Courses</CardTitle>
                <CardDescription className="text-quant-white/70">
                  Courses you've created
                </CardDescription>
              </div>
              <Button
                onClick={() => navigate('/create-course')}
                variant="outline"
                size="sm"
                className="border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {createdCourses.length > 0 ? (
                createdCourses.slice(0, 3).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 bg-quant-blue/10 rounded-lg cursor-pointer hover:bg-quant-blue/20 transition-colors"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-quant-white">{course.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={course.status === 'published' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {course.status}
                        </Badge>
                        <span className="text-sm text-quant-white/60">
                          {formatPrice(course.price)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <DollarSign className="w-5 h-5 text-quant-teal" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Plus className="w-12 h-12 text-quant-white/40 mx-auto mb-4" />
                  <p className="text-quant-white/60">No courses created yet</p>
                  <Button
                    onClick={() => navigate('/create-course')}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark"
                  >
                    Create Your First Course
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-quant-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/courses')}
              variant="outline"
              className="h-16 border-quant-blue text-quant-white hover:bg-quant-blue/20"
            >
              <div className="text-center">
                <BookOpen className="w-6 h-6 mx-auto mb-1" />
                <span>Browse Courses</span>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/create-course')}
              variant="outline"
              className="h-16 border-quant-blue text-quant-white hover:bg-quant-blue/20"
            >
              <div className="text-center">
                <Plus className="w-6 h-6 mx-auto mb-1" />
                <span>Create Course</span>
              </div>
            </Button>

            <Button
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Analytics dashboard will be available soon",
                });
              }}
              variant="outline"
              className="h-16 border-quant-blue text-quant-white hover:bg-quant-blue/20"
            >
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-1" />
                <span>View Analytics</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
