
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

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

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_url: string | null;
  status: string;
  instructor_id: string;
}

const EditCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (courseId && user) {
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
        .eq('instructor_id', user?.id)
        .single();

      if (courseError) {
        if (courseError.code === 'PGRST116') {
          toast({
            title: "Error",
            description: "Course not found or you don't have permission to edit it",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }
        throw courseError;
      }

      setCourse(courseData);
      setTitle(courseData.title);
      setDescription(courseData.description || '');
      setPrice(courseData.price.toString());
      setThumbnailUrl(courseData.thumbnail_url || '');
      setStatus(courseData.status as 'draft' | 'published');

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

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      order_index: chapters.length,
      videos: []
    };
    setChapters([...chapters, newChapter]);
  };

  const updateChapter = (chapterId: string, field: keyof Chapter, value: string) => {
    setChapters(chapters.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, [field]: value }
        : chapter
    ));
  };

  const removeChapter = async (chapterId: string) => {
    // If it's an existing chapter (not temp), delete from database
    if (!chapterId.startsWith('temp-')) {
      try {
        const { error } = await supabase
          .from('chapters')
          .delete()
          .eq('id', chapterId);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting chapter:', error);
        toast({
          title: "Error",
          description: "Failed to delete chapter",
          variant: "destructive",
        });
        return;
      }
    }

    setChapters(chapters.filter(chapter => chapter.id !== chapterId));
  };

  const addVideo = (chapterId: string) => {
    const newVideo: Video = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      video_url: '',
      duration: null,
      order_index: 0
    };

    setChapters(chapters.map(chapter =>
      chapter.id === chapterId
        ? { ...chapter, videos: [...chapter.videos, { ...newVideo, order_index: chapter.videos.length }] }
        : chapter
    ));
  };

  const updateVideo = (chapterId: string, videoId: string, field: keyof Video, value: string | number | null) => {
    setChapters(chapters.map(chapter =>
      chapter.id === chapterId
        ? {
            ...chapter,
            videos: chapter.videos.map(video =>
              video.id === videoId
                ? { ...video, [field]: value }
                : video
            )
          }
        : chapter
    ));
  };

  const removeVideo = async (chapterId: string, videoId: string) => {
    // If it's an existing video (not temp), delete from database
    if (!videoId.startsWith('temp-')) {
      try {
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('id', videoId);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting video:', error);
        toast({
          title: "Error",
          description: "Failed to delete video",
          variant: "destructive",
        });
        return;
      }
    }

    setChapters(chapters.map(chapter =>
      chapter.id === chapterId
        ? { ...chapter, videos: chapter.videos.filter(video => video.id !== videoId) }
        : chapter
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !course) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a course",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Course title is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Update course
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price) || 0,
          thumbnail_url: thumbnailUrl.trim() || null,
          status
        })
        .eq('id', course.id)
        .eq('instructor_id', user.id);

      if (courseError) throw courseError;

      // Update chapters and videos
      for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
        const chapter = chapters[chapterIndex];
        
        if (!chapter.title.trim()) continue;

        let chapterData;
        
        if (chapter.id.startsWith('temp-')) {
          // Create new chapter
          const { data, error: chapterError } = await supabase
            .from('chapters')
            .insert({
              course_id: course.id,
              title: chapter.title.trim(),
              description: chapter.description.trim(),
              order_index: chapterIndex
            })
            .select()
            .single();

          if (chapterError) throw chapterError;
          chapterData = data;
        } else {
          // Update existing chapter
          const { data, error: chapterError } = await supabase
            .from('chapters')
            .update({
              title: chapter.title.trim(),
              description: chapter.description.trim(),
              order_index: chapterIndex
            })
            .eq('id', chapter.id)
            .select()
            .single();

          if (chapterError) throw chapterError;
          chapterData = data;
        }

        // Update videos for this chapter
        for (let videoIndex = 0; videoIndex < chapter.videos.length; videoIndex++) {
          const video = chapter.videos[videoIndex];
          
          if (!video.title.trim() || !video.video_url.trim()) continue;

          if (video.id.startsWith('temp-')) {
            // Create new video
            const { error: videoError } = await supabase
              .from('videos')
              .insert({
                chapter_id: chapterData.id,
                title: video.title.trim(),
                description: video.description.trim(),
                video_url: video.video_url.trim(),
                duration: video.duration,
                order_index: videoIndex
              });

            if (videoError) throw videoError;
          } else {
            // Update existing video
            const { error: videoError } = await supabase
              .from('videos')
              .update({
                title: video.title.trim(),
                description: video.description.trim(),
                video_url: video.video_url.trim(),
                duration: video.duration,
                order_index: videoIndex
              })
              .eq('id', video.id);

            if (videoError) throw videoError;
          }
        }
      }

      toast({
        title: "Success",
        description: "Course updated successfully!",
      });

      navigate(`/course/${course.id}`);

    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
    return null;
  }

  return (
    <div className="min-h-screen bg-quant-blue-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <Button 
          onClick={() => navigate(`/course/${courseId}`)} 
          variant="ghost" 
          className="mb-6 text-quant-white hover:text-quant-teal"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gradient mb-8">Edit Course</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Course Basic Info */}
            <Card className="bg-quant-blue/20 border-quant-blue">
              <CardHeader>
                <CardTitle className="text-quant-white">Course Information</CardTitle>
                <CardDescription className="text-quant-white/70">
                  Basic details about your course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-quant-white">Course Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter course title"
                    className="bg-quant-blue/20 border-quant-blue text-quant-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-quant-white">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your course"
                    className="bg-quant-blue/20 border-quant-blue text-quant-white"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-quant-white">Price (IDR)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="1000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      className="bg-quant-blue/20 border-quant-blue text-quant-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-quant-white">Status</Label>
                    <Select value={status} onValueChange={(value: 'draft' | 'published') => setStatus(value)}>
                      <SelectTrigger className="bg-quant-blue/20 border-quant-blue text-quant-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="thumbnail" className="text-quant-white">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="bg-quant-blue/20 border-quant-blue text-quant-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Chapters */}
            <Card className="bg-quant-blue/20 border-quant-blue">
              <CardHeader>
                <CardTitle className="text-quant-white flex items-center justify-between">
                  Course Content
                  <Button
                    type="button"
                    onClick={addChapter}
                    variant="outline"
                    size="sm"
                    className="border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Chapter
                  </Button>
                </CardTitle>
                <CardDescription className="text-quant-white/70">
                  Organize your course into chapters and videos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {chapters.map((chapter, chapterIndex) => (
                  <div key={chapter.id} className="border border-quant-blue rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-quant-white">
                        Chapter {chapterIndex + 1}
                      </h4>
                      <Button
                        type="button"
                        onClick={() => removeChapter(chapter.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        value={chapter.title}
                        onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                        placeholder="Chapter title"
                        className="bg-quant-blue/20 border-quant-blue text-quant-white"
                      />
                      <Textarea
                        value={chapter.description}
                        onChange={(e) => updateChapter(chapter.id, 'description', e.target.value)}
                        placeholder="Chapter description"
                        className="bg-quant-blue/20 border-quant-blue text-quant-white"
                        rows={2}
                      />
                    </div>

                    {/* Videos */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-quant-white font-medium">Videos</h5>
                        <Button
                          type="button"
                          onClick={() => addVideo(chapter.id)}
                          variant="outline"
                          size="sm"
                          className="border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Video
                        </Button>
                      </div>

                      {chapter.videos.map((video, videoIndex) => (
                        <div key={video.id} className="bg-quant-blue/10 border border-quant-blue/50 rounded p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-quant-white/80 text-sm">Video {videoIndex + 1}</span>
                            <Button
                              type="button"
                              onClick={() => removeVideo(chapter.id, video.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <Input
                              value={video.title}
                              onChange={(e) => updateVideo(chapter.id, video.id, 'title', e.target.value)}
                              placeholder="Video title"
                              className="bg-quant-blue/20 border-quant-blue text-quant-white"
                            />
                            <Input
                              value={video.video_url}
                              onChange={(e) => updateVideo(chapter.id, video.id, 'video_url', e.target.value)}
                              placeholder="Video URL"
                              className="bg-quant-blue/20 border-quant-blue text-quant-white"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                type="number"
                                value={video.duration || ''}
                                onChange={(e) => updateVideo(chapter.id, video.id, 'duration', parseInt(e.target.value) || null)}
                                placeholder="Duration (seconds)"
                                className="bg-quant-blue/20 border-quant-blue text-quant-white"
                              />
                              <Textarea
                                value={video.description}
                                onChange={(e) => updateVideo(chapter.id, video.id, 'description', e.target.value)}
                                placeholder="Video description"
                                className="bg-quant-blue/20 border-quant-blue text-quant-white"
                                rows={1}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {chapters.length === 0 && (
                  <div className="text-center py-8 text-quant-white/60">
                    No chapters added yet. Click "Add Chapter" to get started.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                onClick={() => navigate(`/course/${courseId}`)}
                variant="outline"
                className="border-quant-blue text-quant-white hover:bg-quant-blue"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/80"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-quant-blue-dark border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCourse;
