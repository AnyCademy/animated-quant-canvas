
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  
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

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300 py-4",
        scrolled ? "bg-quant-blue-dark/90 backdrop-blur-md shadow-lg" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-gradient">AlgoQuant</span>
        </div>
        
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="text-quant-white hover:text-quant-teal transition-colors">Features</a>
          <a href="#curriculum" className="text-quant-white hover:text-quant-teal transition-colors">Curriculum</a>
          <a href="#testimonials" className="text-quant-white hover:text-quant-teal transition-colors">Testimonials</a>
          <a href="#pricing" className="text-quant-white hover:text-quant-teal transition-colors">Pricing</a>
        </div>
        
        <Button variant="default" className="bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/80 button-glow">
          Enroll Now
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
