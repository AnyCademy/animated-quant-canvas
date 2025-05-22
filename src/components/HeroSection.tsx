
import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { TrendingUp, ChartLine } from 'lucide-react';

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      const { width, height } = containerRef.current!.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Particle animation
    const particles: Array<{x: number; y: number; radius: number; speedX: number; speedY: number; color: string}> = [];
    const particleCount = 80;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: i % 3 === 0 ? '#64FFDA' : i % 3 === 1 ? '#FFD700' : '#8892B0'
      });
    }
    
    const connectParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(136, 146, 176, ${0.2 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };
    
    const animate = () => {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX = -particle.speedX;
        }
        
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY = -particle.speedY;
        }
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });
      
      connectParticles();
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Chart animation effect
  useEffect(() => {
    const animateNumber = (elem: HTMLElement, end: number, duration: number = 2000) => {
      let start = 0;
      const startTime = performance.now();
      
      const updateNumber = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        
        if (elapsedTime > duration) {
          elem.textContent = end.toString();
          return;
        }
        
        const progress = elapsedTime / duration;
        const current = Math.floor(end * progress);
        elem.textContent = current.toString();
        
        requestAnimationFrame(updateNumber);
      };
      
      requestAnimationFrame(updateNumber);
    };
    
    const percentElem = document.getElementById('percent-return');
    const tradersElem = document.getElementById('traders-count');
    
    if (percentElem) animateNumber(percentElem, 237, 3000);
    if (tradersElem) animateNumber(tradersElem, 15000, 3000);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center" ref={containerRef}>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0"
      />
      
      <div className="container mx-auto px-4 pt-24 z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0 md:pr-8">
            <div className="animate-slide-down opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              <div className="inline-block px-4 py-1 mb-4 bg-quant-blue rounded-full border border-quant-teal/30">
                <span className="text-quant-teal text-sm font-medium flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Master Algorithmic Trading
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-slide-down opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              Unleash the Power of <span className="text-gradient">Quantitative Trading</span>
            </h1>
            
            <p className="text-xl text-quant-gray mb-8 max-w-xl animate-slide-down opacity-0" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
              Master algorithmic strategies, data analysis, and market prediction with our comprehensive quantitative trading course.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-8 animate-slide-down opacity-0" style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}>
              <Button className="bg-quant-teal hover:bg-quant-teal/80 text-quant-blue-dark font-medium px-8 py-6 text-lg button-glow">
                Get Started
              </Button>
              <Button variant="outline" className="border-quant-teal text-quant-teal hover:bg-quant-teal/10">
                Watch Demo
              </Button>
            </div>
            
            <div className="flex gap-8 animate-slide-down opacity-0" style={{ animationDelay: '1.1s', animationFillMode: 'forwards' }}>
              <div>
                <p className="text-quant-teal text-4xl font-bold">
                  <span id="percent-return">0</span>%
                </p>
                <p className="text-quant-gray">Average returns</p>
              </div>
              <div>
                <p className="text-quant-teal text-4xl font-bold">
                  <span id="traders-count">0</span>+
                </p>
                <p className="text-quant-gray">Traders trained</p>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 animate-slide-in-right opacity-0" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
            <div className="relative bg-quant-blue p-6 rounded-lg border border-quant-teal/20 shadow-[0_0_25px_rgba(100,255,218,0.15)]">
              <div className="absolute -top-5 -right-5 w-20 h-20 bg-quant-blue-light rounded-full flex items-center justify-center shadow-lg animate-pulse-subtle">
                <ChartLine className="w-10 h-10 text-quant-teal" />
              </div>
              
              <div className="h-72 relative overflow-hidden rounded">
                <svg width="100%" height="100%" viewBox="0 0 500 200">
                  <path
                    className="animate-slide-in-right opacity-0"
                    style={{ animationDelay: '1.5s', animationFillMode: 'forwards' }}
                    d="M0,150 C50,120 100,180 150,140 C200,100 250,160 300,120 C350,80 400,140 450,100 C480,80 500,90 500,90"
                    fill="none"
                    stroke="#64FFDA"
                    strokeWidth="3"
                    strokeDasharray="1000"
                    strokeDashoffset="1000"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="1000"
                      to="0"
                      dur="3s"
                      begin="1.5s"
                      fill="freeze"
                    />
                  </path>
                  
                  <path
                    className="animate-slide-in-right opacity-0"
                    style={{ animationDelay: '2s', animationFillMode: 'forwards' }}
                    d="M0,160 C40,170 70,140 120,160 C170,180 220,140 270,160 C320,180 370,150 420,170 C470,190 500,180 500,180"
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth="3"
                    strokeDasharray="1000"
                    strokeDashoffset="1000"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="1000"
                      to="0"
                      dur="3s"
                      begin="2s"
                      fill="freeze"
                    />
                  </path>
                  
                  {/* Price points */}
                  {[0, 50, 100, 150, 200, 250, 300, 350, 400, 450].map((x, i) => (
                    <circle
                      key={i}
                      cx={x}
                      cy={i % 2 === 0 ? 100 + Math.random() * 60 : 140 - Math.random() * 60}
                      r="3"
                      fill="#E6F1FF"
                      opacity="0"
                    >
                      <animate
                        attributeName="opacity"
                        from="0"
                        to="1"
                        dur="0.3s"
                        begin={`${2 + i * 0.1}s`}
                        fill="freeze"
                      />
                    </circle>
                  ))}
                </svg>
                
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                  {Array(12).fill(0).map((_, i) => (
                    <div key={i} className="border-t border-l border-quant-gray/10"></div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-quant-white">Portfolio Performance</h3>
                    <p className="text-quant-gray">May 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="text-quant-teal text-2xl font-bold">+23.7%</p>
                    <p className="text-quant-gray">vs. Market +8.2%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
