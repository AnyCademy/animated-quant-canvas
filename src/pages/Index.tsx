
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import CurriculumSection from '@/components/CurriculumSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import PricingSection from '@/components/PricingSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import ScrollAnimation from '@/components/ScrollAnimation';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  // Add preloader effect
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      document.body.style.overflow = '';
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.classList.add('fade-out');
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 500);
      }
    }, 1000);
  }, []);

  return (
    <>
      {/* Preloader */}
      <div 
        id="preloader" 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-quant-blue-dark transition-opacity duration-500"
      >
        <div className="text-center">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 border-4 border-t-quant-teal border-quant-blue rounded-full animate-spin"></div>
          </div>
          <h2 className="text-3xl font-bold text-gradient">AlgoQuant</h2>
          {user && (
            <p className="text-quant-white mt-2">Welcome back, {user.email}!</p>
          )}
        </div>
      </div>
      
      <ScrollAnimation>
        <div className="min-h-screen bg-quant-blue-dark">
          <Navbar />
          <HeroSection />
          <FeaturesSection />
          <CurriculumSection />
          <TestimonialsSection />
          <PricingSection />
          <CTASection />
          <Footer />
          <ScrollToTop />
        </div>
      </ScrollAnimation>
    </>
  );
};

export default Index;
