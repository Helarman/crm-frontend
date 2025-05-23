"use client"

import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface SwipeButtonProps {
  onSwipeSuccess: () => void;
  text?: string;
  swipeText?: string;
}

export const SwipeButton: React.FC<SwipeButtonProps> = ({
  onSwipeSuccess,
  text = "Swipe to confirm",
  swipeText = "Slide to confirm"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [buttonWidth, setButtonWidth] = useState(0);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, []);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    let newX = e.clientX - rect.left;

    // Ограничиваем движение в пределах кнопки
    newX = Math.max(0, Math.min(newX, buttonWidth - (dragRef.current?.offsetWidth || 0)));

    setDragX(newX);

    // Если дотянули до конца - активируем
    if (newX >= buttonWidth - (dragRef.current?.offsetWidth || 0) - 10) {
      onSwipeSuccess();
      resetButton();
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    resetButton();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    let newX = e.touches[0].clientX - rect.left;

    // Ограничиваем движение в пределах кнопки
    newX = Math.max(0, Math.min(newX, buttonWidth - (dragRef.current?.offsetWidth || 0)));

    setDragX(newX);

    // Если дотянули до конца - активируем
    if (newX >= buttonWidth - (dragRef.current?.offsetWidth || 0) - 10) {
      onSwipeSuccess();
      resetButton();
    }
  };

  const resetButton = () => {
    setDragX(0);
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        ref={buttonRef}
        className="relative w-full h-14 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
      >
        <div
          className="absolute inset-0 flex items-center justify-center px-4 text-gray-700 dark:text-gray-300 font-medium transition-opacity duration-300"
          style={{ opacity: dragX > 10 ? 0 : 1 }}
        >
          {text}
        </div>
        
        <div
          ref={dragRef}
          className="absolute left-0 top-0 h-full flex items-center px-6 bg-primary rounded-full cursor-grab active:cursor-grabbing shadow-md transition-transform duration-100"
          style={{
            transform: `translateX(${dragX}px)`,
            width: '120px'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <div className="flex items-center space-x-2 text-white">
            <span className="text-sm font-medium">{swipeText}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};