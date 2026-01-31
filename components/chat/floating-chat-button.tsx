"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

export function FloatingChatButton() {
  const pathname = usePathname();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState(false);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  // Initialize position on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Default position: right side, above navbar (assuming 80px navbar height)
      const defaultX = window.innerWidth - 72; // 56px button + 16px margin
      const defaultY = window.innerHeight - 160; // Above navbar
      setPosition({ x: defaultX, y: defaultY });
      positionRef.current = { x: defaultX, y: defaultY };
      setIsInitialized(true);
    }
  }, []);

  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    let newX = clientX - dragStartRef.current.x;
    let newY = clientY - dragStartRef.current.y;
    
    // Constrain to viewport
    const buttonSize = 56;
    const margin = 8;
    newX = Math.max(margin, Math.min(window.innerWidth - buttonSize - margin, newX));
    newY = Math.max(margin, Math.min(window.innerHeight - buttonSize - margin, newY));
    
    positionRef.current = { x: newX, y: newY };
    setPosition({ x: newX, y: newY });
    setHasMovedDuringDrag(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDrag(e);
      const handleTouchMove = (e: TouchEvent) => handleDrag(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchEnd = () => handleDragEnd();

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleTouchEnd);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  const shouldRender =
			isInitialized &&
			(pathname === "/financial" ||
				pathname === "/trading" ||
				pathname === "/portfolio");

		if (!shouldRender) {
			return null;
		}

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setHasMovedDuringDrag(false);
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = {
      x: clientX - positionRef.current.x,
      y: clientY - positionRef.current.y,
    };
  };

  return (
    <Link
      ref={buttonRef}
      href="/chat"
      onClick={(e) => {
        // Prevent navigation if we moved during drag
        if (hasMovedDuringDrag) {
          e.preventDefault();
        }
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      className={`fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-shadow ${
        isDragging ? "shadow-xl cursor-grabbing scale-110" : "hover:shadow-xl cursor-grab"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      aria-label="Open AI Chat"
    >
      <MessageCircle className="h-6 w-6 pointer-events-none" />
    </Link>
  );
}
