
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Software Developer",
    company: "Tech Innovations",
    content: "AnyCademy helped me transition from marketing to tech. The programming courses were comprehensive and the instructors were incredibly supportive throughout my journey.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&h=200&q=80"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "UX Designer",
    company: "Creative Studios",
    content: "The design courses on AnyCademy are world-class. I learned practical skills that I immediately applied to my work, resulting in a promotion within three months.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&h=200&q=80"
  },
  {
    id: 3,
    name: "David Rodriguez",
    role: "Small Business Owner",
    company: "Rodriguez Consulting",
    content: "As an entrepreneur, I needed to learn marketing and business skills quickly. AnyCademy's business courses helped me grow my revenue by 150% in one year.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&h=200&q=80"
  },
  {
    id: 4,
    name: "Emma Thompson",
    role: "Data Analyst",
    company: "Analytics Corp",
    content: "The data science program exceeded my expectations. The hands-on projects and real-world applications gave me the confidence to excel in my new career.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&h=200&q=80"
  },
  {
    id: 5,
    name: "Raj Patel",
    role: "Digital Marketer",
    company: "Growth Agency",
    content: "The marketing courses provided actionable strategies that I implemented immediately. My campaign performance improved dramatically, and I now lead my team's digital initiatives.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&h=200&q=80"
  }
];

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  
  const showPrevious = () => {
    setAnimationDirection('right');
    setTimeout(() => {
      setActiveIndex((current) => (current === 0 ? testimonials.length - 1 : current - 1));
      setAnimationDirection(null);
    }, 300);
  };
  
  const showNext = () => {
    setAnimationDirection('left');
    setTimeout(() => {
      setActiveIndex((current) => (current === testimonials.length - 1 ? 0 : current + 1));
      setAnimationDirection(null);
    }, 300);
  };
  
  useEffect(() => {
    const interval = setInterval(() => {
      showNext();
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="testimonials" className="py-24 relative bg-gradient-to-b from-quant-blue-dark to-quant-blue">
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-quant-teal/10 blur-[100px] animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-quant-gold/10 blur-[100px] animate-float" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-on-scroll">
            Success <span className="text-gradient">Stories</span>
          </h2>
          <p className="text-xl text-quant-gray animate-on-scroll stagger-1">
            Hear from learners who transformed their careers and achieved their goals with AnyCademy.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="overflow-hidden">
              <div 
                className={cn(
                  "transition-all duration-300 transform",
                  animationDirection === 'left' ? 'translate-x-[-10%] opacity-0' : 
                  animationDirection === 'right' ? 'translate-x-[10%] opacity-0' : ''
                )}
              >
                <div className="bg-quant-blue p-8 rounded-xl border border-quant-teal/20 shadow-[0_0_25px_rgba(100,255,218,0.05)]">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="md:w-1/3">
                      <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-quant-teal mx-auto">
                          <img 
                            src={testimonials[activeIndex].image}
                            alt={testimonials[activeIndex].name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-quant-teal text-quant-blue-dark px-4 py-1 rounded-full text-sm font-medium">
                          {testimonials[activeIndex].company}
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:w-2/3 text-center md:text-left">
                      <div className="mb-4">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50 mb-2">
                          <path d="M14.4 24H8V32H16V40H24V24H14.4ZM38.4 24H32V32H40V40H48V24H38.4Z" fill="#64FFDA"/>
                        </svg>
                      </div>
                      
                      <p className="text-xl mb-8 text-quant-white">"{testimonials[activeIndex].content}"</p>
                      
                      <div>
                        <h4 className="text-xl font-bold text-quant-white">{testimonials[activeIndex].name}</h4>
                        <p className="text-quant-gray">{testimonials[activeIndex].role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-8 gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full border-quant-teal text-quant-teal hover:bg-quant-teal/10"
                onClick={showPrevious}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      i === activeIndex 
                        ? "bg-quant-teal w-6" 
                        : "bg-quant-gray/30 hover:bg-quant-gray/50"
                    )}
                    onClick={() => setActiveIndex(i)}
                  />
                ))}
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full border-quant-teal text-quant-teal hover:bg-quant-teal/10"
                onClick={showNext}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
