
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChartLine } from 'lucide-react';

const CTASection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Create animated lines
    class Line {
      x: number;
      y: number;
      length: number;
      opacity: number;
      width: number;
      speed: number;
      color: string;
      
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.length = Math.random() * 50 + 50;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.width = Math.random() * 2 + 0.5;
        this.speed = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.5 ? '#64FFDA' : '#FFD700';
      }
      
      draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y);
        ctx.strokeStyle = `${this.color}${Math.floor(this.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = this.width;
        ctx.stroke();
      }
      
      update() {
        this.x -= this.speed;
        if (this.x < -this.length) {
          this.x = canvas.width;
          this.y = Math.random() * canvas.height;
        }
      }
    }
    
    const lines: Line[] = [];
    for (let i = 0; i < 30; i++) {
      lines.push(new Line());
    }
    
    const animate = () => {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      lines.forEach(line => {
        line.update();
        line.draw();
      });
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <section className="py-24 relative">
      <div className="relative rounded-2xl overflow-hidden mx-4 sm:mx-8 lg:mx-16">
        <div className="absolute inset-0 bg-gradient-to-r from-quant-blue-light to-quant-blue-dark opacity-90 z-10"></div>
        <canvas ref={canvasRef} className="absolute inset-0 z-0"></canvas>
        
        <div className="relative z-20 py-16 px-4 sm:px-8 md:px-16 max-w-4xl mx-auto text-center">
          <div className="inline-block p-2 bg-quant-blue/50 rounded-full mb-8 animate-float">
            <div className="w-16 h-16 rounded-full bg-quant-blue flex items-center justify-center">
              <ChartLine className="w-8 h-8 text-quant-teal" />
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 animate-on-scroll">
            Ready to <span className="text-gradient">Transform</span> Your Trading?
          </h2>
          
          <p className="text-xl text-quant-white/90 mb-10 max-w-2xl mx-auto animate-on-scroll stagger-1">
            Join thousands of successful traders who have mastered the art and science of algorithmic trading with AlgoQuant.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-on-scroll stagger-2">
            <Button className="text-lg px-8 py-6 bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/90 button-glow">
              Enroll Now
            </Button>
            <Button variant="outline" className="text-lg px-8 py-6 border-quant-teal text-quant-teal hover:bg-quant-teal/10">
              Download Syllabus
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
