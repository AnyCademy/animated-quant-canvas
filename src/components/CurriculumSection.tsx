
import React, { useState } from 'react';
import { Code, Palette, Briefcase, Heart, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  lessons: string[];
  active: boolean;
  onClick: () => void;
}

const Module: React.FC<ModuleProps> = ({ 
  number, 
  title, 
  description, 
  icon, 
  lessons, 
  active, 
  onClick 
}) => {
  return (
    <div 
      className={cn(
        "border rounded-lg p-6 transition-all duration-300 cursor-pointer animate-on-scroll",
        active 
          ? "border-quant-teal bg-quant-blue shadow-[0_0_25px_rgba(100,255,218,0.1)]" 
          : "border-quant-blue hover:border-quant-teal/50 bg-quant-blue-dark"
      )}
      onClick={onClick}
    >
      <div className="flex items-start">
        <div className="mr-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300",
            active ? "bg-quant-teal text-quant-blue-dark" : "bg-quant-blue text-quant-teal"
          )}>
            {number}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <div className="text-quant-teal mr-2">{icon}</div>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <p className="text-quant-gray mt-2">{description}</p>
        </div>
      </div>
      
      <div className={cn(
        "mt-4 pl-16 grid gap-2 transition-all duration-500 overflow-hidden",
        active ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        {lessons.map((lesson, i) => (
          <div 
            key={i} 
            className="flex items-center opacity-0"
            style={{
              animation: active ? 'fade-in 0.3s forwards' : 'none',
              animationDelay: `${0.1 + i * 0.1}s`
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-quant-teal mr-3"></div>
            <p className="text-quant-gray">{lesson}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const CurriculumSection = () => {
  const [activeModule, setActiveModule] = useState(1);
  
  const modules = [
    {
      number: "01",
      title: "Technology & Programming",
      description: "Master the skills that power the digital world",
      icon: <Code className="w-5 h-5" />,
      lessons: [
        "Web Development (Frontend & Backend)",
        "Mobile App Development",
        "Data Science & Machine Learning",
        "Cloud Computing & DevOps",
        "Cybersecurity Fundamentals"
      ]
    },
    {
      number: "02",
      title: "Design & Creative",
      description: "Unleash your creativity with professional design skills",
      icon: <Palette className="w-5 h-5" />,
      lessons: [
        "UI/UX Design Principles",
        "Graphic Design & Branding",
        "Video Production & Editing",
        "Photography & Visual Arts",
        "Motion Graphics & Animation"
      ]
    },
    {
      number: "03",
      title: "Business & Marketing",
      description: "Build and grow successful businesses",
      icon: <Briefcase className="w-5 h-5" />,
      lessons: [
        "Digital Marketing Strategies",
        "Entrepreneurship & Startup Building",
        "Project Management",
        "Sales & Customer Success",
        "Financial Planning & Analysis"
      ]
    },
    {
      number: "04",
      title: "Health & Lifestyle",
      description: "Improve your well-being and personal growth",
      icon: <Heart className="w-5 h-5" />,
      lessons: [
        "Fitness & Nutrition Coaching",
        "Mental Health & Mindfulness",
        "Personal Development",
        "Cooking & Culinary Arts",
        "Languages & Communication"
      ]
    },
    {
      number: "05",
      title: "Skills & Crafts",
      description: "Learn practical skills for work and life",
      icon: <Wrench className="w-5 h-5" />,
      lessons: [
        "Home Improvement & DIY",
        "Music & Audio Production",
        "Writing & Content Creation",
        "Teaching & Education",
        "Arts & Crafts"
      ]
    }
  ];

  return (
    <section id="curriculum" className="py-24 relative">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-1/3 h-1/3 bg-quant-teal/5 rounded-full blur-[100px] z-0"></div>
      <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-quant-gold/5 rounded-full blur-[100px] z-0"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-on-scroll">
            Explore Course <span className="text-gradient">Categories</span>
          </h2>
          <p className="text-xl text-quant-gray animate-on-scroll stagger-1">
            Discover thousands of courses across diverse categories, taught by industry experts and designed to help you achieve your goals.
          </p>
        </div>
        
        <div className="grid gap-6 max-w-4xl mx-auto">
          {modules.map((module, i) => (
            <Module
              key={i}
              number={module.number}
              title={module.title}
              description={module.description}
              icon={module.icon}
              lessons={module.lessons}
              active={activeModule === i + 1}
              onClick={() => setActiveModule(i + 1)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CurriculumSection;
