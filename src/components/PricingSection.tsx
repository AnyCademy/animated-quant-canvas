
import React from 'react';
import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PricingTierProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  delay: number;
}

const PricingTier: React.FC<PricingTierProps> = ({ 
  name, 
  price, 
  description, 
  features, 
  popular = false,
  buttonText,
  delay
}) => {
  return (
    <div 
      className={cn(
        "border rounded-xl p-8 transition-all duration-300 relative animate-on-scroll",
        popular 
          ? "border-quant-teal bg-quant-blue shadow-[0_0_30px_rgba(100,255,218,0.15)] transform hover:-translate-y-2" 
          : "border-quant-blue bg-quant-blue-dark hover:border-quant-teal/50 transform hover:-translate-y-1"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-quant-teal text-quant-blue-dark px-4 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold mb-4 text-quant-white">{name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold text-quant-white">{price}</span>
        </div>
        <p className="text-quant-gray">{description}</p>
      </div>
      
      <div className="space-y-4 mb-8">
        {features.map((feature, i) => (
          <div 
            key={i} 
            className="flex items-start opacity-0"
            style={{
              animation: 'fade-in 0.5s forwards',
              animationDelay: `${delay + 0.1 + i * 0.1}s`
            }}
          >
            <div className={cn(
              "mr-3 mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
              popular ? "bg-quant-teal text-quant-blue-dark" : "bg-quant-blue text-quant-teal"
            )}>
              <CheckIcon className="w-3 h-3" />
            </div>
            <p className="text-quant-gray">{feature}</p>
          </div>
        ))}
      </div>
      
      <Button 
        className={cn(
          "w-full button-glow",
          popular 
            ? "bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/90" 
            : "bg-transparent border border-quant-teal text-quant-teal hover:bg-quant-teal/10"
        )}
      >
        {buttonText}
      </Button>
    </div>
  );
};

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-quant-teal/5 rounded-full blur-[100px] z-0"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-quant-gold/5 rounded-full blur-[100px] z-0"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-on-scroll">
            Investment <span className="text-gradient">Plans</span>
          </h2>
          <p className="text-xl text-quant-gray animate-on-scroll stagger-1">
            Choose the plan that best fits your trading goals and experience level.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingTier
            name="Starter"
            price="$499"
            description="Perfect for beginners entering the world of algorithmic trading"
            features={[
              "Core trading algorithms",
              "Basic data analysis tools",
              "30+ hours of video content",
              "Community forum access",
              "3 months of support"
            ]}
            buttonText="Get Started"
            delay={100}
          />
          
          <PricingTier
            name="Professional"
            price="$999"
            description="Comprehensive training for serious quantitative traders"
            features={[
              "All Starter features",
              "Advanced algorithm library",
              "60+ hours of video content",
              "Live trading simulations",
              "1-on-1 strategy review",
              "6 months of support",
              "Private community access"
            ]}
            popular={true}
            buttonText="Enroll Now"
            delay={200}
          />
          
          <PricingTier
            name="Enterprise"
            price="$1,999"
            description="Elite package for professional trading firms and institutions"
            features={[
              "All Professional features",
              "100+ hours of video content",
              "Custom strategy development",
              "Portfolio optimization tools",
              "High-frequency trading modules",
              "Lifetime support",
              "Code review sessions",
              "Team licenses available"
            ]}
            buttonText="Contact Us"
            delay={300}
          />
        </div>
        
        {/* Money-back guarantee */}
        <div className="mt-16 text-center animate-on-scroll">
          <div className="inline-block px-6 py-3 border border-quant-teal/30 rounded-full bg-quant-blue-dark">
            <p className="text-quant-teal flex items-center text-lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              30-Day Money-Back Guarantee
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
