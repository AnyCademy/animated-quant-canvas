
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Play, Clock, Users, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  price: number;
  instructor_id: string;
  status: string;
  created_at: string;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient mb-4">
            Available Courses
          </h1>
          <p className="text-quant-white/80 text-lg max-w-2xl mx-auto">
            Discover our comprehensive algorithmic trading courses designed to help you master the markets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className="bg-quant-blue/20 border-quant-blue hover:border-quant-teal transition-colors cursor-pointer"
              onClick={() => handleCourseClick(course.id)}
            >
              <CardHeader>
                <div className="aspect-video bg-quant-blue rounded-lg mb-4 flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Play className="w-12 h-12 text-quant-teal" />
                  )}
                </div>
                <CardTitle className="text-quant-white">{course.title}</CardTitle>
                <CardDescription className="text-quant-white/70">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-quant-white/60">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Self-paced</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>All levels</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>4.8</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="text-2xl font-bold text-quant-teal">
                  {course.price > 0 ? formatPrice(course.price) : 'Free'}
                </div>
                <Button className="bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/80">
                  {course.price > 0 ? 'Enroll Now' : 'Start Learning'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-quant-white/60 text-lg">No courses available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
