
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, BarChart3, BookOpen, LogIn, UserPlus } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/auth');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleCoursesClick = () => {
    navigate('/courses');
  };

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300 py-4",
        scrolled ? "bg-quant-blue-dark/90 backdrop-blur-md shadow-lg" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img 
            src="/icon.svg" 
            alt="AlgoQuant Logo" 
            className="w-8 h-8 cursor-pointer"
            onClick={() => navigate('/')}
          />
          <span 
            className="text-2xl font-bold text-gradient cursor-pointer" 
            onClick={() => navigate('/')}
          >
            AlgoQuant
          </span>
        </div>
        
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="text-quant-white hover:text-quant-teal transition-colors">Features</a>
          <a href="#curriculum" className="text-quant-white hover:text-quant-teal transition-colors">Curriculum</a>
          <a href="#testimonials" className="text-quant-white hover:text-quant-teal transition-colors">Testimonials</a>
          <a href="#pricing" className="text-quant-white hover:text-quant-teal transition-colors">Pricing</a>
          {user && (
            <>
              <button 
                onClick={handleCoursesClick}
                className="text-quant-white hover:text-quant-teal transition-colors flex items-center gap-1"
              >
                <BookOpen className="w-4 h-4" />
                Courses
              </button>
              <button 
                onClick={handleDashboardClick}
                className="text-quant-white hover:text-quant-teal transition-colors flex items-center gap-1"
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="hidden md:flex items-center space-x-2 text-quant-white">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              
              <Button 
                variant="outline" 
                className="border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark md:hidden"
                onClick={handleCoursesClick}
              >
                <BookOpen className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark md:hidden"
                onClick={handleDashboardClick}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="default" 
                className="bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/80 button-glow"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark"
                onClick={handleLoginClick}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
              <Button 
                variant="default" 
                className="bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/80 button-glow"
                onClick={handleLoginClick}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
