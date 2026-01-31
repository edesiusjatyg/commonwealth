'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { onboardingSlides } from './data';

// Consistent wave paths with identical command structure to prevent morphing glitches
const wavePaths = [
    "M0,160 C320,140,640,240,960,180 C1120,150,1280,140,1440,160 L1440,320 L0,320 Z",
    "M0,190 C320,220,640,160,960,200 C1120,220,1280,200,1440,180 L1440,320 L0,320 Z",
    "M0,150 C320,120,640,260,960,200 C1120,170,1280,180,1440,160 L1440,320 L0,320 Z",
    "M0,200 C320,240,640,180,960,160 C1120,150,1280,120,1440,140 L1440,320 L0,320 Z"
];

export function OnboardingFlow() {
  const router = useRouter();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // prefetch for instant navigation 
  useEffect(() => {
    router.prefetch('/init-wallet');
  }, [router]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const handleFinish = () => {
    router.push('/init-wallet');
  };

  return (
    <div className="h-[100dvh] bg-white text-black flex flex-col relative overflow-hidden">
        
        {/* Main Content Area - Top 50% */}
        <div className="min-h-[50%] flex flex-col w-full max-w-lg mx-auto z-10 px-6 py-2 pt-8 pb-2 relative">
            
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-2 shrink-0">
                {onboardingSlides.map((_, index) => (
                    <div 
                        key={index}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            index === selectedIndex ? "w-6 bg-[#5F33E1]" : "w-1.5 bg-gray-200"
                        )}
                    />
                ))}
            </div>

            {/* Carousel Container */}
            <div className="flex-1 overflow-hidden flex flex-col justify-center" ref={emblaRef}>
                <div className="flex h-full">
                    {onboardingSlides.map((slide) => (
                    <div key={slide.id} className="flex-[0_0_100%] min-w-0 flex flex-col text-center items-center justify-center h-full px-2">
                        <motion.div
                             initial={{ opacity: 0, scale: 0.95 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ duration: 0.4 }}
                             className="space-y-3 w-full flex flex-col justify-center h-full overflow-hidden"
                        >
                            <h2 className="text-2xl xs:text-3xl font-black text-black leading-tight shrink-0">
                                {slide.title}
                            </h2>
                            
                            {slide.description && (
                                <p className="text-gray-600 text-sm xs:text-base leading-snug shrink-0">
                                    {slide.description}
                                </p>
                            )}

                            {/* Render Cards for Council Slide - Compact Grid - NO SCROLL */}
                            {slide.cards && (
                                <div className="grid gap-2 mt-1 w-full text-left">
                                    {slide.cards.map((card, idx) => (
                                        <div key={idx} className="bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-purple-100 shadow-sm">
                                            <h3 className="font-bold text-[#5F33E1] text-xs">{card.title}</h3>
                                            <p className="text-[10px] xs:text-xs text-gray-500 mt-0.5 leading-tight">{card.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                    ))}
                </div>
            </div>
            
            {/* Navigation Buttons are floating above the wave, technically part of value 'top' half visually */}
        </div>

        {/* Buttons Layer - Positioned to bridge the gap or float on top of wave */}
        <div className="top-[55%] left-0 right-0 z-20 px-6 py-3 flex justify-center w-full">
             <div className="flex gap-3 w-full max-w-xs">
                {selectedIndex > 0 && (
                    <Button 
                        variant="ghost" 
                        onClick={scrollPrev}
                        className="flex-1 bg-white/90 backdrop-blur text-gray-600 hover:bg-white border border-gray-100 rounded-xl h-11 text-sm shadow-sm transition-all"
                    >
                        Back
                    </Button>
                )}
                
                <Button 
                    onClick={selectedIndex === onboardingSlides.length - 1 ? handleFinish : scrollNext}
                    className="flex-1 bg-[#5F33E1] text-white hover:bg-[#4a26b7] rounded-xl h-11 font-bold text-sm shadow-md shadow-purple-900/20"
                >
                    {selectedIndex === onboardingSlides.length - 1 ? (
                        <span className="flex items-center justify-center gap-2">Get Started</span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">Next <ChevronRight size={16} /></span>
                    )}
                </Button>
            </div>
        </div>

        {/* Dynamic Wave Footer - Strictly 50% height */}
        <div className="absolute bottom-0 left-0 right-0 h-[50%] w-full z-0 pointer-events-none transition-all duration-700 ease-in-out">
            <svg 
                viewBox="0 0 1440 320" 
                className="absolute bottom-0 w-full h-full text-[#5F33E1] fill-current drop-shadow-2xl"
                preserveAspectRatio="none"
            >
                <motion.path 
                    fillOpacity="1" 
                    d={wavePaths[selectedIndex % wavePaths.length]}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    animate={{ d: wavePaths[selectedIndex % wavePaths.length] }}
                />
            </svg>
        </div>
    </div>
  );
}
