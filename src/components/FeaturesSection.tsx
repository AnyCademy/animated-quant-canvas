
import React, { useEffect, useRef } from 'react';
import { GraduationCap, Users, Star, Globe } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  return (
    <div 
      className="bg-quant-blue p-6 rounded-lg border border-quant-teal/20 card-hover opacity-0 animate-scale-up"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }}
    >
      <div className="w-14 h-14 rounded-full bg-quant-blue-dark flex items-center justify-center mb-6">
        <div className="text-quant-teal">{icon}</div>
      </div>
      <h3 className="text-xl font-bold mb-3 text-quant-white">{title}</h3>
      <p className="text-quant-gray">{description}</p>
    </div>
  );
};

const FeaturesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.8;
        
        if (isVisible) {
          el.classList.add('animated');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on initial load
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="features" className="py-24 relative" ref={sectionRef}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-quant-teal/5 rounded-full blur-[100px] z-0"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-quant-gold/5 rounded-full blur-[100px] z-0"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-on-scroll">
            Why <span className="text-gradient">AnyCademy</span> Is Your Best Learning Partner
          </h2>
          <p className="text-xl text-quant-gray animate-on-scroll stagger-1">
            Join millions of learners worldwide and unlock your potential with our comprehensive online education platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard 
            icon={<GraduationCap className="w-8 h-8" />}
            title="Expert-Led Courses"
            description="Learn from industry professionals and certified instructors with real-world experience."
            delay={0.1}
          />
          <FeatureCard 
            icon={<Users className="w-8 h-8" />}
            title="Global Community"
            description="Connect with millions of learners worldwide and build your professional network."
            delay={0.3}
          />
          <FeatureCard 
            icon={<Star className="w-8 h-8" />}
            title="Quality Guaranteed"
            description="All courses are reviewed for quality and updated regularly to ensure relevant content."
            delay={0.5}
          />
          <FeatureCard 
            icon={<Globe className="w-8 h-8" />}
            title="Learn Anywhere"
            description="Access your courses on any device, anytime, anywhere with offline viewing options."
            delay={0.7}
          />
        </div>
        
        {/* Animated metrics section */}
        <div className="mt-24 bg-quant-blue rounded-xl p-8 border border-quant-teal/20 shadow-[0_0_25px_rgba(100,255,218,0.05)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-on-scroll">
              <div className="inline-block mb-4">
                <div className="w-20 h-20 rounded-full bg-quant-blue-dark flex items-center justify-center mx-auto animate-float">
                  <GraduationCap className="w-10 h-10 text-quant-teal" />
                </div>
              </div>
              <h3 className="text-4xl font-bold mb-2 text-quant-white">
                <span className="counter" data-target="5000">10,000+</span>
              </h3>
              <p className="text-quant-gray">Online Courses</p>
            </div>
            
            <div className="text-center animate-on-scroll stagger-2">
              <div className="inline-block mb-4">
                <div className="w-20 h-20 rounded-full bg-quant-blue-dark flex items-center justify-center mx-auto animate-float" style={{ animationDelay: '0.2s' }}>
                  <Users className="w-10 h-10 text-quant-gold" />
                </div>
              </div>
              <h3 className="text-4xl font-bold mb-2 text-quant-white">
                <span className="counter" data-target="100">1M+</span>
              </h3>
              <p className="text-quant-gray">Active Students</p>
            </div>
            
            <div className="text-center animate-on-scroll stagger-3">
              <div className="inline-block mb-4">
                <div className="w-20 h-20 rounded-full bg-quant-blue-dark flex items-center justify-center mx-auto animate-float" style={{ animationDelay: '0.4s' }}>
                  <Star className="w-10 h-10 text-quant-teal" />
                </div>
              </div>
              <h3 className="text-4xl font-bold mb-2 text-quant-white">
                <span className="counter" data-target="25">4.8</span>
              </h3>
              <p className="text-quant-gray">Average Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
