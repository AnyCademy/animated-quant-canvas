
import React, { useRef, useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration: number | null;
}

interface VideoPlayerProps {
  video: Video;
  onVideoEnd?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onVideoEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onVideoEnd?.();
      updateProgress(video.duration, true);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, [video.id, onVideoEnd]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds of inactivity
    const timer = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, isPlaying]);

  const updateProgress = async (progressSeconds: number, completed: boolean = false) => {
    if (!user) return;

    try {
      await supabase
        .from('user_video_progress')
        .upsert({
          user_id: user.id,
          video_id: video.id,
          progress_seconds: Math.floor(progressSeconds),
          completed,
          last_watched_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating video progress:', error);
    }
  };

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (seekTime: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.currentTime = seekTime;
    setCurrentTime(seekTime);
    updateProgress(seekTime);
  };

  const handleVolumeChange = (newVolume: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isMuted) {
      videoElement.volume = volume;
      setIsMuted(false);
    } else {
      videoElement.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoElement.requestFullscreen();
    }
  };

  const skip = (seconds: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    handleSeek(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="bg-black border-none overflow-hidden">
      <div 
        className="relative aspect-video"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={video.video_url}
          className="w-full h-full"
          onClick={togglePlay}
        />

        {/* Video Controls Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Play/Pause Button in Center */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="lg"
                variant="ghost"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 text-white"
              >
                <Play className="w-8 h-8" />
              </Button>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            {/* Progress Bar */}
            <div className="w-full">
              <Progress 
                value={progressPercentage} 
                className="w-full h-1 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newTime = (clickX / rect.width) * duration;
                  handleSeek(newTime);
                }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePlay}
                  className="text-white hover:text-quant-teal"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => skip(-10)}
                  className="text-white hover:text-quant-teal"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => skip(10)}
                  className="text-white hover:text-quant-teal"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className="text-white hover:text-quant-teal"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20"
                />

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={toggleFullscreen}
                className="text-white hover:text-quant-teal"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4 bg-quant-blue-dark">
        <h3 className="text-xl font-semibold text-quant-white mb-2">{video.title}</h3>
        {video.description && (
          <p className="text-quant-white/70">{video.description}</p>
        )}
      </div>
    </Card>
  );
};

export default VideoPlayer;
