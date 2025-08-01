
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Play, Clock, Users, Star, CheckCircle, Lock, Edit } from 'lucide-react';
import Navbar from '@/components/Navbar';
import VideoPlayer from '@/components/VideoPlayer';
import PaymentPage from '@/components/PaymentPage';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  price: number;
  instructor_id: string;
  status: string;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  order_index: number;
  videos: Video[];
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration: number | null;
  order_index: number;
}

interface Enrollment {
  id: string;
  enrolled_at: string;
}

const Course = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Check if user is enrolled
      if (user) {
        const { data: enrollmentData } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('course_id', courseId)
          .eq('user_id', user.id)
          .single();

        setEnrollment(enrollmentData);
      }

      // Fetch chapters and videos
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select(`
          *,
          videos (*)
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (chaptersError) throw chaptersError;

      const formattedChapters = chaptersData.map(chapter => ({
        ...chapter,
        videos: chapter.videos.sort((a: Video, b: Video) => a.order_index - b.order_index)
      }));

      setChapters(formattedChapters);

      // Auto-select first video if enrolled
      if (enrollment && formattedChapters.length > 0 && formattedChapters[0].videos.length > 0) {
        setSelectedVideo(formattedChapters[0].videos[0]);
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!course) return;

    if (course.price > 0) {
      // Show payment page for paid courses
      setShowPayment(true);
    } else {
      // Handle free course - direct enrollment
      setEnrolling(true);
      
      try {
        const { error } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: user.id,
            course_id: course.id
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "You have successfully enrolled in this course!",
        });

        await fetchCourseData();
      } catch (error) {
        console.error('Error enrolling:', error);
        toast({
          title: "Error",
          description: "Failed to enroll in course",
          variant: "destructive",
        });
      } finally {
        setEnrolling(false);
      }
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    await fetchCourseData();
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
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

  if (!course) {
    return (
      <div className="min-h-screen bg-quant-blue-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-quant-white mb-4">Course Not Found</h1>
            <Button onClick={() => navigate('/courses')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isInstructor = user?.id === course.instructor_id;

  // Show payment page for paid courses
  if (showPayment && course) {
    return (
      <PaymentPage
        course={course}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentCancel={handlePaymentCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-quant-blue-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={() => navigate('/courses')} 
            variant="ghost" 
            className="text-quant-white hover:text-quant-teal"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
          
          {isInstructor && (
            <Button 
              onClick={() => navigate(`/edit-course/${courseId}`)} 
              variant="outline"
              className="border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Course
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {enrollment && selectedVideo ? (
              <VideoPlayer 
                video={selectedVideo}
                onVideoEnd={() => {
                  // Handle video completion
                  console.log('Video completed');
                }}
              />
            ) : (
              <div className="aspect-video bg-quant-blue rounded-lg mb-6 flex items-center justify-center">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Play className="w-24 h-24 text-quant-teal" />
                )}
              </div>
            )}

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-quant-white mb-4">{course.title}</h1>
              <p className="text-quant-white/80 text-lg mb-6">{course.description}</p>

              <div className="flex items-center gap-6 text-sm text-quant-white/60 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Self-paced</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>All levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>4.8 (128 reviews)</span>
                </div>
              </div>

              {!enrollment && !isInstructor && (
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-quant-teal">
                    {course.price > 0 ? formatPrice(course.price) : 'Free'}
                  </div>
                  <Button 
                    onClick={handleEnrollment}
                    disabled={enrolling}
                    className="bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/80 px-8 py-3"
                  >
                    {enrolling ? 'Processing...' : (course.price > 0 ? 'Enroll Now' : 'Start Learning')}
                  </Button>
                </div>
              )}

              {isInstructor && (
                <div className="p-4 bg-quant-teal/10 border border-quant-teal rounded-lg">
                  <p className="text-quant-teal font-medium">
                    You are the instructor of this course
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Course Content */}
          <div className="lg:col-span-1">
            <Card className="bg-quant-blue/20 border-quant-blue">
              <CardHeader>
                <CardTitle className="text-quant-white">Course Content</CardTitle>
                <CardDescription className="text-quant-white/70">
                  {chapters.length} chapters • {chapters.reduce((total, chapter) => total + chapter.videos.length, 0)} videos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="space-y-2">
                    <h4 className="font-semibold text-quant-white">{chapter.title}</h4>
                    {chapter.videos.map((video) => (
                      <div 
                        key={video.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          enrollment || isInstructor
                            ? 'hover:bg-quant-blue/40 text-quant-white' 
                            : 'text-quant-white/50'
                        } ${selectedVideo?.id === video.id ? 'bg-quant-teal/20 border border-quant-teal' : ''}`}
                        onClick={() => {
                          if (enrollment || isInstructor) {
                            setSelectedVideo(video);
                          }
                        }}
                      >
                        {enrollment || isInstructor ? (
                          <Play className="w-4 h-4 text-quant-teal" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{video.title}</p>
                          <p className="text-xs opacity-70">{formatDuration(video.duration)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {chapters.length === 0 && (
                  <p className="text-quant-white/60 text-center py-4">
                    Course content will be available soon.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Course;
