
import React, { useCallback } from 'react';

interface ParticleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const ParticleButton: React.FC<ParticleButtonProps> = ({ 
  children, 
  className = "",
  onClick
}) => {
  const createParticles = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    for (let i = 0; i < 10; i++) {
      createParticle(x, y, btn);
    }
    
    if (onClick) onClick();
  }, [onClick]);
  
  const createParticle = (x: number, y: number, btn: HTMLButtonElement) => {
    const particle = document.createElement('span');
    particle.className = 'particle';
    btn.appendChild(particle);
    
    const size = Math.floor(Math.random() * 5 + 3);
    const color = i % 2 === 0 ? '#64FFDA' : '#FFD700';
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = color;
    particle.style.borderRadius = '50%';
    particle.style.position = 'absolute';
    particle.style.top = `${y}px`;
    particle.style.left = `${x}px`;
    
    const destinationX = (Math.random() - 0.5) * 100;
    const destinationY = (Math.random() - 0.5) * 100;
    
    const animation = particle.animate([
      {
        transform: 'translate(0, 0)',
        opacity: 1
      },
      {
        transform: `translate(${destinationX}px, ${destinationY}px)`,
        opacity: 0
      }
    ], {
      duration: Math.random() * 1000 + 500,
      easing: 'cubic-bezier(0, .9, .57, 1)'
    });
    
    animation.onfinish = () => {
      particle.remove();
    };
  };

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onClick={createParticles}
    >
      {children}
    </button>
  );
};

export default ParticleButton;
