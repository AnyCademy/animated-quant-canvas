
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Book, Target, TrendingUp, Clock, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

interface DashboardData {
  id: string;
  total_courses_enrolled: number;
  courses_completed: number;
  current_streak: number;
  last_activity_date: string;
  preferred_learning_schedule: string;
  learning_goals: string[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_dashboard_data')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        // Create initial dashboard data if it doesn't exist
        const { data: newData, error: insertError } = await supabase
          .from('user_dashboard_data')
          .insert({
            user_id: user?.id,
            total_courses_enrolled: 0,
            courses_completed: 0,
            current_streak: 0,
            learning_goals: ['Master algorithmic trading', 'Learn Python for finance']
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating dashboard data:', insertError);
          toast({
            title: "Error",
            description: "Failed to initialize dashboard",
            variant: "destructive",
          });
        } else {
          setDashboardData(newData);
        }
      } else {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionPercentage = dashboardData 
    ? (dashboardData.courses_completed / Math.max(dashboardData.total_courses_enrolled, 1)) * 100 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-quant-blue-dark">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-quant-teal border-quant-blue rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-quant-white">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quant-blue-dark">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-quant-white/70">
            Track your progress and continue your quantitative trading journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Course Progress Card */}
          <Card className="bg-quant-blue-light border-quant-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-quant-white">Course Progress</CardTitle>
              <Book className="h-4 w-4 text-quant-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-quant-white mb-2">
                {dashboardData?.courses_completed || 0} / {dashboardData?.total_courses_enrolled || 0}
              </div>
              <Progress value={completionPercentage} className="mb-2" />
              <p className="text-xs text-quant-white/70">
                {completionPercentage.toFixed(0)}% completed
              </p>
            </CardContent>
          </Card>

          {/* Current Streak Card */}
          <Card className="bg-quant-blue-light border-quant-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-quant-white">Learning Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-quant-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-quant-white mb-2">
                {dashboardData?.current_streak || 0}
              </div>
              <p className="text-xs text-quant-white/70">
                days in a row
              </p>
            </CardContent>
          </Card>

          {/* Last Activity Card */}
          <Card className="bg-quant-blue-light border-quant-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-quant-white">Last Activity</CardTitle>
              <Clock className="h-4 w-4 text-quant-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-quant-white mb-2">
                {dashboardData?.last_activity_date 
                  ? new Date(dashboardData.last_activity_date).toLocaleDateString()
                  : 'Today'
                }
              </div>
              <p className="text-xs text-quant-white/70">
                Keep up the momentum!
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Learning Goals Card */}
          <Card className="bg-quant-blue-light border-quant-blue">
            <CardHeader>
              <CardTitle className="text-quant-white flex items-center gap-2">
                <Target className="h-5 w-5 text-quant-teal" />
                Learning Goals
              </CardTitle>
              <CardDescription className="text-quant-white/70">
                Your current learning objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData?.learning_goals?.map((goal, index) => (
                  <Badge key={index} variant="secondary" className="bg-quant-teal/20 text-quant-teal">
                    {goal}
                  </Badge>
                )) || (
                  <p className="text-quant-white/70">No learning goals set yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-quant-blue-light border-quant-blue">
            <CardHeader>
              <CardTitle className="text-quant-white flex items-center gap-2">
                <Award className="h-5 w-5 text-quant-teal" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-quant-white/70">
                Continue your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/80"
                onClick={() => window.location.href = '/#curriculum'}
              >
                <Book className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark"
                onClick={() => window.location.href = '/#pricing'}
              >
                <Calendar className="w-4 h-4 mr-2" />
                View Plans
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Learning Schedule Card */}
        {dashboardData?.preferred_learning_schedule && (
          <Card className="bg-quant-blue-light border-quant-blue mt-6">
            <CardHeader>
              <CardTitle className="text-quant-white">Learning Schedule</CardTitle>
              <CardDescription className="text-quant-white/70">
                Your preferred learning time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge className="bg-quant-teal/20 text-quant-teal">
                {dashboardData.preferred_learning_schedule}
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
