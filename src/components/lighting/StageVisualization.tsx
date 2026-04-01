"use client";

import { motion } from "motion/react";
import type { Light } from "@/lib/lighting-types";

interface StageVisualizationProps {
  lights: Light[];
  backdropColor: string;
  stageColor: string;
  showPerformer: boolean;
  selectedLights: string[];
  onLightClick: (lightId: string, multiSelect: boolean) => void;
  onLightToggle: (lightId: string) => void;
}

export function StageVisualization({ 
  lights, 
  backdropColor, 
  stageColor,
  showPerformer,
  selectedLights,
  onLightClick,
  onLightToggle,
}: StageVisualizationProps) {
  // Calculate lighting overlay
  const activeLights = lights.filter(l => l.active && l.intensity > 0 && l.type !== 'backdrop');
  const backdropLights = lights.filter(l => l.type === 'backdrop' && l.active && l.intensity > 0);
  const specialLights = lights.filter(l => l.type === 'special');
  
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-zinc-900 rounded-lg overflow-hidden">
      {/* Stage container with perspective */}
      <div className="relative w-[90%] h-[85%]" style={{ perspective: '1200px' }}>
        {/* Backdrop */}
        <motion.div
          className="absolute top-0 left-[10%] right-[10%] h-[50%] rounded-t-lg"
          style={{
            background: backdropColor,
            transformStyle: 'preserve-3d',
            transform: 'rotateX(0deg) translateZ(-100px)',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.3)',
          }}
          animate={{
            background: backdropColor,
          }}
          transition={{ duration: 0.8 }}
        >
          {/* Backdrop hatching lines for depth */}
          <svg className="absolute inset-0 w-full h-full opacity-10" style={{ mixBlendMode: 'multiply' }}>
            <defs>
              <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4">
                <path d="M0,4 l4,-4" stroke="black" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hatch)" />
          </svg>
          
          {/* Backdrop lighting overlay */}
          {backdropLights.map(light => (
            <motion.div
              key={`backdrop-light-${light.id}`}
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: light.intensity / 100 }}
              transition={{ duration: 0.8 }}
              style={{
                background: `radial-gradient(ellipse at 50% 100%, ${light.color}cc 0%, ${light.color}66 40%, transparent 100%)`,
                mixBlendMode: 'screen',
              }}
            />
          ))}
          
          {/* Top lights */}
          <div className="absolute -top-8 left-0 right-0 flex justify-around px-8">
            {lights.filter(l => l.type === 'top').map((light) => (
              <motion.div 
                key={light.id} 
                className="relative cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onLightClick(light.id, e.shiftKey);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onLightToggle(light.id);
                }}
                initial={false}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Light fixture */}
                <div className={`w-8 h-8 bg-zinc-800 rounded-b-lg border-2 ${
                  selectedLights.includes(light.id) 
                    ? 'border-blue-400 shadow-lg shadow-blue-500/50' 
                    : 'border-zinc-600 group-hover:border-zinc-400'
                } flex items-center justify-center transition-all`}>
                  <div 
                    className={`w-4 h-4 rounded-full transition-all ${
                      light.active ? 'shadow-lg' : 'bg-zinc-700'
                    }`}
                    style={{
                      backgroundColor: light.active ? light.color : undefined,
                      boxShadow: light.active ? `0 0 10px ${light.color}` : undefined,
                    }}
                  />
                </div>
                {/* Light beam */}
                {light.active && light.intensity > 0 && (
                  <motion.div
                    className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: light.intensity / 100 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div
                      className="w-32 h-64 rounded-b-full blur-2xl"
                      style={{
                        background: `radial-gradient(ellipse at top, ${light.color}cc 0%, ${light.color}44 50%, transparent 100%)`,
                        opacity: light.intensity / 100,
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
          
          {/* Lighting overlay on backdrop from other sources */}
          {activeLights.map(light => (
            <motion.div
              key={`backdrop-${light.id}`}
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: light.intensity / 150 }}
              transition={{ duration: 0.8 }}
              style={{
                background: light.type === 'top' 
                  ? `radial-gradient(ellipse at 50% 0%, ${light.color}88 0%, transparent 60%)`
                  : light.type === 'side-left'
                  ? `radial-gradient(ellipse at 0% 50%, ${light.color}66 0%, transparent 50%)`
                  : light.type === 'side-right'
                  ? `radial-gradient(ellipse at 100% 50%, ${light.color}66 0%, transparent 50%)`
                  : light.type === 'special'
                  ? `radial-gradient(circle at ${light.position.x}% ${light.position.y}%, ${light.color}55 0%, transparent 25%)`
                  : `radial-gradient(circle at 50% 50%, ${light.color}44 0%, transparent 70%)`,
                mixBlendMode: 'screen',
              }}
            />
          ))}
        </motion.div>

        {/* Stage floor */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[50%] rounded-b-lg"
          style={{
            background: stageColor,
            transformStyle: 'preserve-3d',
            transform: 'rotateX(60deg)',
            transformOrigin: 'top center',
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.4)',
          }}
          animate={{
            background: stageColor,
          }}
          transition={{ duration: 0.8 }}
        >
          {/* Stage grid */}
          <svg className="absolute inset-0 w-full h-full opacity-30">
            <defs>
              <pattern id="grid" patternUnits="userSpaceOnUse" width="40" height="40">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          
          {/* Spotlight indicators on floor - 3x3 grid */}
          {specialLights.map(light => (
            <motion.div
              key={`floor-indicator-${light.id}`}
              className="absolute rounded-full cursor-pointer group"
              style={{
                left: `${light.position.x}%`,
                top: `${light.position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onLightClick(light.id, e.shiftKey);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onLightToggle(light.id);
              }}
              initial={false}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-8 h-8 rounded-full border-2 ${
                selectedLights.includes(light.id)
                  ? 'border-blue-400 shadow-lg shadow-blue-500/50'
                  : 'border-zinc-500 group-hover:border-zinc-300'
              } bg-zinc-800/50 flex items-center justify-center transition-all`}>
                <div 
                  className={`w-4 h-4 rounded-full ${
                    light.active ? '' : 'bg-zinc-700'
                  }`}
                  style={{
                    backgroundColor: light.active ? light.color : undefined,
                    boxShadow: light.active ? `0 0 8px ${light.color}` : undefined,
                  }}
                />
              </div>
              
              {/* Spotlight beam on floor */}
              {light.active && light.intensity > 0 && (
                <motion.div
                  className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: light.intensity / 100,
                    scale: 1,
                  }}
                  transition={{ duration: 0.6 }}
                >
                  <div
                    className="rounded-full blur-xl"
                    style={{
                      width: '120px',
                      height: '120px',
                      background: `radial-gradient(circle, ${light.color}aa 0%, ${light.color}55 30%, transparent 70%)`,
                    }}
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
          
          {/* General lighting on stage floor */}
          {activeLights.filter(l => l.type !== 'special').map(light => (
            <motion.div
              key={`floor-${light.id}`}
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: light.intensity / 120 }}
              transition={{ duration: 0.8 }}
              style={{
                background: light.type === 'top' || light.type === 'front'
                  ? `radial-gradient(ellipse at 50% 20%, ${light.color}66 0%, transparent 60%)`
                  : light.type === 'side-left'
                  ? `radial-gradient(ellipse at 20% 50%, ${light.color}55 0%, transparent 50%)`
                  : light.type === 'side-right'
                  ? `radial-gradient(ellipse at 80% 50%, ${light.color}55 0%, transparent 50%)`
                  : `radial-gradient(circle at 50% 50%, ${light.color}44 0%, transparent 60%)`,
                mixBlendMode: 'screen',
              }}
            />
          ))}
          
          {/* Performer - smaller and closer to backdrop */}
          {showPerformer && (
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2">
              <div className="relative" style={{ transform: 'scale(0.7)' }}>
                {/* Body */}
                <div className="relative">
                  {/* Head */}
                  <div className="w-10 h-10 bg-zinc-700 rounded-full mx-auto mb-1 relative z-10" />
                  
                  {/* Torso */}
                  <div className="w-16 h-20 bg-zinc-700 rounded-lg mx-auto relative z-10" />
                  
                  {/* Arms */}
                  <div className="absolute top-10 -left-3 w-6 h-16 bg-zinc-700 rounded-full rotate-12" style={{ zIndex: 5 }} />
                  <div className="absolute top-10 -right-3 w-6 h-16 bg-zinc-700 rounded-full -rotate-12" style={{ zIndex: 5 }} />
                  
                  {/* Legs */}
                  <div className="absolute -bottom-16 left-2 w-6 h-20 bg-zinc-700 rounded-full" />
                  <div className="absolute -bottom-16 right-2 w-6 h-20 bg-zinc-700 rounded-full" />
                </div>
                
                {/* Lighting on performer - layered effect */}
                {activeLights.map(light => {
                  // Calculate lighting direction and intensity based on light type
                  let gradientDirection = '';
                  let gradientIntensity = light.intensity / 100;
                  
                  if (light.type === 'top') {
                    gradientDirection = 'to bottom';
                    gradientIntensity *= 0.8;
                  } else if (light.type === 'side-left') {
                    gradientDirection = 'to right';
                    gradientIntensity *= 0.6;
                  } else if (light.type === 'side-right') {
                    gradientDirection = 'to left';
                    gradientIntensity *= 0.6;
                  } else if (light.type === 'front') {
                    gradientDirection = 'to top';
                    gradientIntensity *= 0.7;
                  } else if (light.type === 'special') {
                    // Calculate distance from spotlight to center stage
                    const dx = light.position.x - 50;
                    const dy = light.position.y - 20; // Adjusted for performer position
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Only apply spotlight if close enough to performer position
                    if (distance < 30) {
                      gradientDirection = 'radial-gradient(circle';
                      gradientIntensity *= (1 - distance / 30) * 1.2;
                    } else {
                      return null;
                    }
                  }
                  
                  return (
                    light.active && light.intensity > 0 && (
                      <motion.div
                        key={`performer-${light.id}`}
                        className="absolute inset-0 -m-8 pointer-events-none blur-sm rounded-full"
                        animate={{
                          opacity: gradientIntensity,
                        }}
                        transition={{ duration: 0.8 }}
                        style={{
                          background: light.type === 'special'
                            ? `radial-gradient(circle, ${light.color}dd 0%, ${light.color}66 50%, transparent 100%)`
                            : `linear-gradient(${gradientDirection}, ${light.color}bb 0%, ${light.color}55 50%, transparent 100%)`,
                          mixBlendMode: 'screen',
                        }}
                      />
                    )
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Side lights - left */}
        <div className="absolute left-0 top-1/4 flex flex-col gap-8">
          {lights.filter(l => l.type === 'side-left').map(light => (
            <motion.div 
              key={light.id} 
              className="relative cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                onLightClick(light.id, e.shiftKey);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onLightToggle(light.id);
              }}
              initial={false}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-6 h-6 bg-zinc-800 rounded-r-lg border-2 ${
                selectedLights.includes(light.id)
                  ? 'border-blue-400 shadow-lg shadow-blue-500/50'
                  : 'border-zinc-600 group-hover:border-zinc-400'
              } flex items-center justify-center transition-all`}>
                <div 
                  className={`w-3 h-3 rounded-full ${
                    light.active ? '' : 'bg-zinc-700'
                  }`}
                  style={{
                    backgroundColor: light.active ? light.color : undefined,
                    boxShadow: light.active ? `0 0 8px ${light.color}` : undefined,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Side lights - right */}
        <div className="absolute right-0 top-1/4 flex flex-col gap-8">
          {lights.filter(l => l.type === 'side-right').map(light => (
            <motion.div 
              key={light.id} 
              className="relative cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                onLightClick(light.id, e.shiftKey);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onLightToggle(light.id);
              }}
              initial={false}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-6 h-6 bg-zinc-800 rounded-l-lg border-2 ${
                selectedLights.includes(light.id)
                  ? 'border-blue-400 shadow-lg shadow-blue-500/50'
                  : 'border-zinc-600 group-hover:border-zinc-400'
              } flex items-center justify-center transition-all`}>
                <div 
                  className={`w-3 h-3 rounded-full ${
                    light.active ? '' : 'bg-zinc-700'
                  }`}
                  style={{
                    backgroundColor: light.active ? light.color : undefined,
                    boxShadow: light.active ? `0 0 8px ${light.color}` : undefined,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Front lights */}
        <div className="absolute bottom-0 left-1/4 right-1/4 flex justify-around">
          {lights.filter(l => l.type === 'front').map(light => (
            <motion.div 
              key={light.id} 
              className="relative cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                onLightClick(light.id, e.shiftKey);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onLightToggle(light.id);
              }}
              initial={false}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-6 h-6 bg-zinc-800 rounded-t-lg border-2 ${
                selectedLights.includes(light.id)
                  ? 'border-blue-400 shadow-lg shadow-blue-500/50'
                  : 'border-zinc-600 group-hover:border-zinc-400'
              } flex items-center justify-center -mb-3 transition-all`}>
                <div 
                  className={`w-3 h-3 rounded-full ${
                    light.active ? '' : 'bg-zinc-700'
                  }`}
                  style={{
                    backgroundColor: light.active ? light.color : undefined,
                    boxShadow: light.active ? `0 0 8px ${light.color}` : undefined,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
