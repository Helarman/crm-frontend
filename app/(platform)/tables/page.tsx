 //@ts-nocheck
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Square, Ruler, Trash2, Download, Grid, MousePointer, ZoomIn, ZoomOut, Move, 
  Minus, Plus, Maximize2, Eye, Edit, Magnet, DoorOpen, AppWindow as Window,
  MoveLeft, HelpCircle, Grid3X3, MinusCircle, SquareIcon, RotateCcw
} from "lucide-react";

// Типы
type WallSegment = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  isHorizontal: boolean;
  isDiagonal: boolean;
  angle?: number;
};

type Door = {
  id: string;
  wallId: string;
  position: number;
  width: number;
  offset: number;
  isPlacing: boolean;
  orientation?: 'horizontal' | 'vertical' | 'diagonal'; // НОВОЕ: ориентация двери
  angle?: number; // НОВОЕ: угол двери для диагональных стен
};

type Window = {
  id: string;
  wallId: string;
  position: number;
  width: number;
  offset: number;
  isPlacing: boolean;
  orientation?: 'horizontal' | 'vertical' | 'diagonal'; // НОВОЕ: ориентация окна
  angle?: number; // НОВОЕ: угол окна для диагональных стен
};

type GuideLine = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isHorizontal: boolean;
  isDiagonal: boolean;
  angle?: number;
};

type GridSettings = {
  displayCellSize: number;
  snapGridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToWalls: boolean;
  snapToGuides: boolean;
  showGuides: boolean;
  forceOrthogonal: boolean;
};

type DrawingMode = "wall" | "select" | "measure" | "door" | "window" | "guide";
type WallDrawingMode = "orthogonal" | "diagonal" | "free";
type ViewMode = "edit" | "view";
type ViewTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

type SnapPoint = {
  x: number;
  y: number;
  type: 'start' | 'end' | 'intersection' | 'guide';
  wallId?: string;
  guideId?: string;
};

// Вспомогательная функция для расчета длины и угла
const calculateLengthAndAngle = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return { length, angle };
};

// Вспомогательная функция для расчета точки на линии по параметру t (0-1)
const getPointOnLine = (x1: number, y1: number, x2: number, y2: number, t: number) => {
  return {
    x: x1 + (x2 - x1) * t,
    y: y1 + (y2 - y1) * t
  };
};

// Вспомогательная функция для расчета перпендикулярного вектора
const getPerpendicularVector = (dx: number, dy: number, length: number) => {
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance === 0) return { x: 0, y: 0 };
  const normalizedX = dx / distance;
  const normalizedY = dy / distance;
  return {
    x: -normalizedY * length,
    y: normalizedX * length
  };
};

// Компонент стены
function Wall({ wall, displayCellSize, isSelected, onClick, viewTransform, showDimensions }: { 
  wall: WallSegment; 
  displayCellSize: number; 
  isSelected: boolean; 
  onClick: () => void;
  viewTransform: ViewTransform;
  showDimensions: boolean;
}) {
  const { x1, y1, x2, y2, isHorizontal, isDiagonal, length, angle } = wall;
  
  const left = Math.min(x1, x2) * displayCellSize * viewTransform.scale;
  const top = Math.min(y1, y2) * displayCellSize * viewTransform.scale;
  const width = Math.abs(x2 - x1) * displayCellSize * viewTransform.scale;
  const height = Math.abs(y2 - y1) * displayCellSize * viewTransform.scale;
  
  if (isDiagonal) {
    const centerX = (x1 + x2) / 2 * displayCellSize * viewTransform.scale;
    const centerY = (y1 + y2) / 2 * displayCellSize * viewTransform.scale;
    
    return (
      <>
        <div
          className={`absolute bg-gray-600 hover:bg-gray-500 rounded-md transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
          style={{
            left: `${centerX - (length * displayCellSize * viewTransform.scale) / 2 + viewTransform.translateX}px`,
            top: `${centerY - 5 + viewTransform.translateY}px`,
            width: `${length * displayCellSize * viewTransform.scale}px`,
            height: `10px`,
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'center center',
            cursor: showDimensions ? 'default' : 'pointer',
          }}
          onClick={onClick}
        />
        
        {showDimensions && (
          <div
            className="absolute bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none"
            style={{
              left: `${centerX + viewTransform.translateX}px`,
              top: `${centerY - 25 + viewTransform.translateY}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {length.toFixed(1)} м {angle && `(${Math.round(angle)}°)`}
          </div>
        )}
        
        {isDiagonal && (
          <>
            <div
              className="absolute w-2 h-2 bg-blue-500 rounded-full border border-white"
              style={{
                left: `${x1 * displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
                top: `${y1 * displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
              }}
            />
            <div
              className="absolute w-2 h-2 bg-blue-500 rounded-full border border-white"
              style={{
                left: `${x2 * displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
                top: `${y2 * displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
              }}
            />
          </>
        )}
      </>
    );
  }
  
  const wallWidth = isHorizontal ? width + 10 : 10;
  const wallHeight = isHorizontal ? 10 : height + 10;
  const centerX = left + (width / 2);
  const centerY = top + (height / 2);
  
  return (
    <>
      <div
        className={`absolute bg-gray-600 hover:bg-gray-500 rounded-md transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
        style={{
          left: `${left + viewTransform.translateX}px`,
          top: `${top + viewTransform.translateY}px`,
          width: `${wallWidth}px`,
          height: `${wallHeight}px`,
          cursor: showDimensions ? 'default' : 'pointer',
        }}
        onClick={onClick}
      />
      
      {showDimensions && (
        <div
          className="absolute bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none"
          style={{
            left: `${centerX + viewTransform.translateX}px`,
            top: `${centerY - 25 + viewTransform.translateY}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {wall.length.toFixed(1)} м
        </div>
      )}
    </>
  );
}

// Компонент вспомогательной линии
function GuideLineComponent({ guide, displayCellSize, isSelected, onClick, viewTransform, showGuides }: { 
  guide: GuideLine; 
  displayCellSize: number; 
  isSelected: boolean; 
  onClick: () => void;
  viewTransform: ViewTransform;
  showGuides: boolean;
}) {
  const { x1, y1, x2, y2, isHorizontal, isDiagonal, angle } = guide;
  
  const left = Math.min(x1, x2) * displayCellSize * viewTransform.scale;
  const top = Math.min(y1, y2) * displayCellSize * viewTransform.scale;
  const width = Math.abs(x2 - x1) * displayCellSize * viewTransform.scale;
  const height = Math.abs(y2 - y1) * displayCellSize * viewTransform.scale;
  
  if (isDiagonal) {
    const centerX = (x1 + x2) / 2 * displayCellSize * viewTransform.scale;
    const centerY = (y1 + y2) / 2 * displayCellSize * viewTransform.scale;
    const length = Math.sqrt(width * width + height * height);
    
    return (
      <>
        <div
          className={`absolute ${isSelected ? "ring-1 ring-purple-500 ring-offset-1" : ""}`}
          style={{
            left: `${centerX - length / 2 + viewTransform.translateX}px`,
            top: `${centerY + viewTransform.translateY}px`,
            width: `${length}px`,
            height: '0px',
            borderTop: '2px dashed #4f46e5',
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'center center',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          onClick={onClick}
        />
        
        <div
          className="absolute w-2 h-2 bg-purple-500 rounded-full border border-white"
          style={{
            left: `${x1 * displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
            top: `${y1 * displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
          }}
        />
        <div
          className="absolute w-2 h-2 bg-purple-500 rounded-full border border-white"
          style={{
            left: `${x2 * displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
            top: `${y2 * displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
          }}
        />
        
        {isSelected && (
          <div
            className="absolute bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none"
            style={{
              left: `${centerX + viewTransform.translateX}px`,
              top: `${centerY - 20 + viewTransform.translateY}px`,
              transform: 'translateX(-50%)',
            }}
          >
            Вспомогательная линия ({Math.round(angle || 0)}°)
          </div>
        )}
      </>
    );
  }
  
  const lineStyle = {
    position: 'absolute' as const,
    left: `${left + viewTransform.translateX}px`,
    top: `${top + viewTransform.translateY}px`,
    width: `${width}px`,
    height: `${height}px`,
    cursor: 'pointer',
    pointerEvents: 'auto' as const,
  };
  
  if (isHorizontal) {
    Object.assign(lineStyle, {
      borderTop: '2px dashed #4f46e5',
      height: '0px',
      width: `${width}px`,
    });
  } else {
    Object.assign(lineStyle, {
      borderLeft: '2px dashed #4f46e5',
      width: '0px',
      height: `${height}px`,
    });
  }
  
  if (!showGuides) return null;
  
  return (
    <>
      <div
        className={`absolute ${isSelected ? "ring-1 ring-purple-500 ring-offset-1" : ""}`}
        style={lineStyle}
        onClick={onClick}
      />
      
      <div
        className="absolute w-2 h-2 bg-purple-500 rounded-full border border-white"
        style={{
          left: `${x1 * displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
          top: `${y1 * displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
        }}
      />
      <div
        className="absolute w-2 h-2 bg-purple-500 rounded-full border border-white"
        style={{
          left: `${x2 * displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
          top: `${y2 * displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
        }}
      />
      
      {isSelected && (
        <div
          className="absolute bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none"
          style={{
            left: `${(left + width/2) + viewTransform.translateX}px`,
            top: `${top - 20 + viewTransform.translateY}px`,
            transform: 'translateX(-50%)',
          }}
        >
          Вспомогательная линия
        </div>
      )}
    </>
  );
}

// Компонент двери (обновлен для поддержки диагональных стен)
function Door({ door, wall, displayCellSize, viewTransform, isSelected, onClick, showDimensions }: { 
  door: Door;
  wall: WallSegment | undefined;
  displayCellSize: number;
  viewTransform: ViewTransform;
  isSelected: boolean;
  onClick: () => void;
  showDimensions: boolean;
}) {
    if (!wall) return null;
  const { x1, y1, x2, y2, isDiagonal, angle } = wall;
  const { offset, width, isPlacing, orientation = 'vertical' } = door;
  
  const wallLength = wall.length;
  const t = offset / wallLength; // параметр вдоль стены (0-1)
  
  // Точка на стене, где находится дверь
  const doorCenter = getPointOnLine(x1, y1, x2, y2, t);
  
  // Для диагональных стен
  if (isDiagonal) {
    const doorAngle = angle || 0;
    const doorLengthInGrid = width / (wallLength / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    
    // Перпендикулярный вектор для смещения двери от стены
    const perpVector = getPerpendicularVector(x2 - x1, y2 - y1, 0.25);
    
    // Точки для отрисовки двери (прямоугольник вдоль стены)
    const halfLength = doorLengthInGrid / 2;
    const dx = (x2 - x1) * halfLength / wallLength;
    const dy = (y2 - y1) * halfLength / wallLength;
    
    const doorX1 = doorCenter.x - dx;
    const doorY1 = doorCenter.y - dy;
    const doorX2 = doorCenter.x + dx;
    const doorY2 = doorCenter.y + dy;
    
    // Центр двери
    const doorCenterX = (doorX1 + doorX2) / 2;
    const doorCenterY = (doorY1 + doorY2) / 2;
    
    // Смещение от стены для визуализации
    const offsetX = perpVector.x;
    const offsetY = perpVector.y;
    
    const finalDoorX1 = doorX1 + offsetX;
    const finalDoorY1 = doorY1 + offsetY;
    const finalDoorX2 = doorX2 + offsetX;
    const finalDoorY2 = doorY2 + offsetY;
    
    const finalCenterX = (finalDoorX1 + finalDoorX2) / 2;
    const finalCenterY = (finalDoorY1 + finalDoorY2) / 2;
    
    const finalWidth = Math.sqrt(Math.pow(finalDoorX2 - finalDoorX1, 2) + Math.pow(finalDoorY2 - finalDoorY1, 2));
    const finalAngle = Math.atan2(finalDoorY2 - finalDoorY1, finalDoorX2 - finalDoorX1) * (180 / Math.PI);
    
    return (
      <>
        <div
          className={`absolute bg-amber-800 hover:bg-amber-700 rounded-sm border-2 border-amber-900 transition-all cursor-pointer ${isSelected ? "ring-2 ring-yellow-500 ring-offset-1" : ""} ${isPlacing ? "opacity-70" : ""}`}
          style={{
            left: `${finalCenterX * displayCellSize * viewTransform.scale - (finalWidth * displayCellSize * viewTransform.scale) / 2 + viewTransform.translateX}px`,
            top: `${finalCenterY * displayCellSize * viewTransform.scale - 10 + viewTransform.translateY}px`,
            width: `${finalWidth * displayCellSize * viewTransform.scale}px`,
            height: `20px`,
            transform: `rotate(${finalAngle}deg)`,
            transformOrigin: 'center center',
          }}
          onClick={onClick}
        />
        
        {showDimensions && !isPlacing && (
          <div
            className="absolute bg-amber-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none"
            style={{
              left: `${finalCenterX * displayCellSize * viewTransform.scale + viewTransform.translateX}px`,
              top: `${finalCenterY * displayCellSize * viewTransform.scale + 20 + viewTransform.translateY}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {width.toFixed(1)} м
          </div>
        )}
        
        {showDimensions && (
          <div
            className="absolute bg-gray-400 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none"
            style={{
              left: `${doorCenter.x * displayCellSize * viewTransform.scale + viewTransform.translateX}px`,
              top: `${doorCenter.y * displayCellSize * viewTransform.scale - 20 + viewTransform.translateY}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {offset.toFixed(1)} м
          </div>
        )}
      </>
    );
  }
  
  // Для прямых стен (старый код)
  const { isHorizontal, length } = wall;
  const doorLength = width / (length / Math.abs(isHorizontal ? x2 - x1 : y2 - y1));
  const doorOffset = door.offset / (length / Math.abs(isHorizontal ? x2 - x1 : y2 - y1));
  
  let doorLeft, doorTop, doorWidth, doorHeight;
  
  if (isHorizontal) {
    const startX = Math.min(x1, x2);
    doorLeft = (startX + doorOffset) * displayCellSize * viewTransform.scale;
    doorTop = y1 * displayCellSize * viewTransform.scale;
    doorWidth = doorLength * displayCellSize * viewTransform.scale;
    doorHeight = 20;
  } else {
    const startY = Math.min(y1, y2);
    doorLeft = x1 * displayCellSize * viewTransform.scale;
    doorTop = (startY + doorOffset) * displayCellSize * viewTransform.scale;
    doorWidth = 20;
    doorHeight = doorLength * displayCellSize * viewTransform.scale;
  }
  
  return (
    <>
      <div
        className={`absolute bg-amber-800 hover:bg-amber-700 rounded-sm border-2 border-amber-900 transition-all cursor-pointer ${isSelected ? "ring-2 ring-yellow-500 ring-offset-1" : ""} ${isPlacing ? "opacity-70" : ""}`}
        style={{
          left: `${doorLeft + viewTransform.translateX}px`,
          top: `${doorTop + viewTransform.translateY}px`,
          width: `${doorWidth}px`,
          height: `${doorHeight}px`,
          transform: isHorizontal ? 'translateY(-5px)' : 'translateX(-5px)',
        }}
        onClick={onClick}
      />
      
      {showDimensions && !isPlacing && (
        <div
          className="absolute bg-amber-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none"
          style={{
            left: `${doorLeft + doorWidth/2 + viewTransform.translateX}px`,
            top: `${doorTop + doorHeight + viewTransform.translateY + 5}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {width.toFixed(1)} м
        </div>
      )}
      
      {showDimensions && (
        <div
          className="absolute bg-gray-400 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none"
          style={{
            left: `${doorLeft + viewTransform.translateX}px`,
            top: `${doorTop - 25 + viewTransform.translateY}px`,
            transform: 'translateX(-50%)',
          }}
        >
         {door.offset.toFixed(1)} м
        </div>
      )}
    </>
  );
}

// Компонент окна (обновлен для поддержки диагональных стен)
function WindowComponent({ windowItem, wall, displayCellSize, viewTransform, isSelected, onClick, showDimensions }: { 
  windowItem: Window;
  wall: WallSegment;
  displayCellSize: number;
  viewTransform: ViewTransform;
  isSelected: boolean;
  onClick: () => void;
  showDimensions: boolean;
}) {
  const { x1, y1, x2, y2, isDiagonal, angle } = wall;
  const { offset, width, isPlacing, orientation = 'horizontal' } = windowItem;
  
  const wallLength = wall.length;
  const t = offset / wallLength;
  
  // Точка на стене, где находится окно
  const windowCenter = getPointOnLine(x1, y1, x2, y2, t);
  
  // Для диагональных стен
  if (isDiagonal) {
    const windowAngle = angle || 0;
    const windowLengthInGrid = width / (wallLength / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    
    // Точки для отрисовки окна
    const halfLength = windowLengthInGrid / 2;
    const dx = (x2 - x1) * halfLength / wallLength;
    const dy = (y2 - y1) * halfLength / wallLength;
    
    const windowX1 = windowCenter.x - dx;
    const windowY1 = windowCenter.y - dy;
    const windowX2 = windowCenter.x + dx;
    const windowY2 = windowCenter.y + dy;
    
    // Центр окна
    const windowCenterX = (windowX1 + windowX2) / 2;
    const windowCenterY = (windowY1 + windowY2) / 2;
    
    // Для окон не делаем смещение от стены, они остаются на стене
    const finalWidth = Math.sqrt(Math.pow(windowX2 - windowX1, 2) + Math.pow(windowY2 - windowY1, 2));
    const finalAngle = Math.atan2(windowY2 - windowY1, windowX2 - windowX1) * (180 / Math.PI);
    
    return (
      <>
        <div
          className={`absolute bg-white hover:bg-gray-100 rounded-sm border-2 border-blue-300 transition-all cursor-pointer ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""} ${isPlacing ? "opacity-70" : ""}`}
          style={{
            left: `${windowCenterX * displayCellSize * viewTransform.scale - (finalWidth * displayCellSize * viewTransform.scale) / 2 + viewTransform.translateX}px`,
            top: `${windowCenterY * displayCellSize * viewTransform.scale - 7.5 + viewTransform.translateY}px`,
            width: `${finalWidth * displayCellSize * viewTransform.scale}px`,
            height: `15px`,
            transform: `rotate(${finalAngle}deg)`,
            transformOrigin: 'center center',
          }}
          onClick={onClick}
        >
          <div className="absolute inset-1 bg-blue-50 border border-blue-100 rounded-sm"></div>
        </div>
        
        {showDimensions && !isPlacing && (
          <div
            className="absolute bg-blue-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none"
            style={{
              left: `${windowCenterX * displayCellSize * viewTransform.scale + viewTransform.translateX}px`,
              top: `${windowCenterY * displayCellSize * viewTransform.scale + 20 + viewTransform.translateY}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {width.toFixed(1)} м
          </div>
        )}
        
        {showDimensions && (
          <div
            className="absolute bg-gray-400 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none"
            style={{
              left: `${windowCenter.x * displayCellSize * viewTransform.scale + viewTransform.translateX}px`,
              top: `${windowCenter.y * displayCellSize * viewTransform.scale - 25 + viewTransform.translateY}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {windowItem.offset.toFixed(1)} м
          </div>
        )}
      </>
    );
  }
  
  // Для прямых стен (старый код)
  const { isHorizontal, length } = wall;
  const windowLength = width / (length / Math.abs(isHorizontal ? x2 - x1 : y2 - y1));
  const windowOffset = windowItem.offset / (length / Math.abs(isHorizontal ? x2 - x1 : y2 - y1));
  
  let windowLeft, windowTop, windowWidth, windowHeight;
  
  if (isHorizontal) {
    const startX = Math.min(x1, x2);
    windowLeft = (startX + windowOffset) * displayCellSize * viewTransform.scale;
    windowTop = y1 * displayCellSize * viewTransform.scale;
    windowWidth = windowLength * displayCellSize * viewTransform.scale;
    windowHeight = 15;
  } else {
    const startY = Math.min(y1, y2);
    windowLeft = x1 * displayCellSize * viewTransform.scale;
    windowTop = (startY + windowOffset) * displayCellSize * viewTransform.scale;
    windowWidth = 15;
    windowHeight = windowLength * displayCellSize * viewTransform.scale;
  }
  
  return (
    <>
      <div
        className={`absolute bg-white hover:bg-gray-100 rounded-sm border-2 border-blue-300 transition-all cursor-pointer ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""} ${isPlacing ? "opacity-70" : ""}`}
        style={{
          left: `${windowLeft + viewTransform.translateX}px`,
          top: `${windowTop + viewTransform.translateY}px`,
          width: `${windowWidth}px`,
          height: `${windowHeight}px`,
          transform: isHorizontal ? 'translateY(-5px)' : 'translateX(-5px)',
        }}
        onClick={onClick}
      >
        <div className="absolute inset-1 bg-blue-50 border border-blue-100 rounded-sm"></div>
      </div>
      
      {showDimensions && !isPlacing && (
        <div
          className="absolute bg-blue-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none"
          style={{
            left: `${windowLeft + windowWidth/2 + viewTransform.translateX}px`,
            top: `${windowTop + windowHeight + viewTransform.translateY + 5}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {width.toFixed(1)} м
        </div>
      )}
      
      {showDimensions && (
        <div
          className="absolute bg-gray-400 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none"
          style={{
            left: `${windowLeft + viewTransform.translateX}px`,
            top: `${windowTop - 25 + viewTransform.translateY}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {windowItem.offset.toFixed(1)} м
        </div>
      )}
    </>
  );
}

// Компонент временной стены при рисовании
function TempWall({ startX, startY, endX, endY, displayCellSize, viewTransform, showDimensions, snapIndicator, isGuide = false, wallDrawingMode = "orthogonal" }: { 
  startX: number; startY: number; endX: number; endY: number; displayCellSize: number;
  viewTransform: ViewTransform;
  showDimensions: boolean;
  snapIndicator: { x: number; y: number; type: string } | null;
  isGuide?: boolean;
  wallDrawingMode?: WallDrawingMode;
}) {
  let x1 = startX;
  let y1 = startY;
  let x2 = endX;
  let y2 = endY;
  
  const { length: rawLength, angle: rawAngle } = calculateLengthAndAngle(x1, y1, x2, y2);
  const isDiagonal = wallDrawingMode === "diagonal" || 
    (wallDrawingMode === "free" && Math.abs(rawAngle) % 90 > 5);
  
  if (wallDrawingMode === "orthogonal") {
    const isHorizontal = Math.abs(endX - startX) > Math.abs(endY - startY);
    if (isHorizontal) {
      y2 = startY;
    } else {
      x2 = startX;
    }
  }
  
  const { length, angle } = calculateLengthAndAngle(x1, y1, x2, y2);
  const finalIsDiagonal = wallDrawingMode !== "orthogonal" && isDiagonal;
  
  const left = Math.min(x1, x2) * displayCellSize * viewTransform.scale;
  const top = Math.min(y1, y2) * displayCellSize * viewTransform.scale;
  const width = Math.abs(x2 - x1) * displayCellSize * viewTransform.scale;
  const height = Math.abs(y2 - y1) * displayCellSize * viewTransform.scale;
  
  const centerX = (x1 + x2) / 2 * displayCellSize * viewTransform.scale;
  const centerY = (y1 + y2) / 2 * displayCellSize * viewTransform.scale;
  
  if (finalIsDiagonal) {
    const lineStyle = {
      position: 'absolute' as const,
      left: `${centerX - (length * displayCellSize * viewTransform.scale) / 2 + viewTransform.translateX}px`,
      top: `${centerY + viewTransform.translateY}px`,
      width: `${length * displayCellSize * viewTransform.scale}px`,
      height: '0px',
      pointerEvents: 'none' as const,
      transform: `rotate(${angle}deg)`,
      transformOrigin: 'center center',
    };
    
    if (isGuide) {
      Object.assign(lineStyle, {
        borderTop: '2px dashed #8b5cf6',
      });
    } else {
      Object.assign(lineStyle, {
        height: '10px',
        backgroundColor: 'rgba(75, 85, 99, 0.7)',
        borderRadius: '0.375rem',
        top: `${centerY - 5 + viewTransform.translateY}px`,
      });
    }
    
    return (
      <>
        <div style={lineStyle} />
        
        {showDimensions && !isGuide && (
          <div
            className="absolute bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
            style={{
              left: `${centerX + viewTransform.translateX}px`,
              top: `${centerY - 25 + viewTransform.translateY}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {Math.max(0.5, length).toFixed(1)} м ({Math.round(angle)}°)
          </div>
        )}
        
        {snapIndicator && showDimensions && (
          <div
            className="absolute w-10 h-10 border-2 border-green-500 rounded-full bg-white/80 animate-pulse z-20 pointer-events-none"
            style={{
              left: `${snapIndicator.x * displayCellSize * viewTransform.scale + viewTransform.translateX - 12}px`,
              top: `${snapIndicator.y * displayCellSize * viewTransform.scale + viewTransform.translateY - 12}px`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Magnet className="h-3 w-3 text-green-600" />
            </div>
          </div>
        )}
      </>
    );
  }
  
  const lineStyle = {
    position: 'absolute' as const,
    left: `${left + viewTransform.translateX}px`,
    top: `${top + viewTransform.translateY}px`,
    pointerEvents: 'none' as const,
  };
  
  if (isGuide) {
    const isHorizontal = Math.abs(x2 - x1) > Math.abs(y2 - y1);
    if (isHorizontal) {
      Object.assign(lineStyle, {
        borderTop: '2px dashed #8b5cf6',
        height: '0px',
        width: `${width}px`,
      });
    } else {
      Object.assign(lineStyle, {
        borderLeft: '2px dashed #8b5cf6',
        width: '0px',
        height: `${height}px`,
      });
    }
  } else {
    const isHorizontal = Math.abs(x2 - x1) > Math.abs(y2 - y1);
    Object.assign(lineStyle, {
      width: `${isHorizontal ? width + 10 : 10}px`,
      height: `${isHorizontal ? 10 : height + 10}px`,
      backgroundColor: 'rgba(75, 85, 99, 0.7)',
      borderRadius: '0.375rem',
    });
  }
  
  return (
    <>
      <div style={lineStyle} />
      
      {showDimensions && !isGuide && (
        <div
          className="absolute bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
          style={{
            left: `${centerX + viewTransform.translateX}px`,
            top: `${centerY - 25 + viewTransform.translateY}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {Math.max(0.5, length).toFixed(1)} м
        </div>
      )}
      
      {snapIndicator && showDimensions && (
        <div
          className="absolute w-10 h-10 border-2 border-green-500 rounded-full bg-white/80 animate-pulse z-20 pointer-events-none"
          style={{
            left: `${snapIndicator.x * displayCellSize * viewTransform.scale + viewTransform.translateX - 12}px`,
            top: `${snapIndicator.y * displayCellSize * viewTransform.scale + viewTransform.translateY - 12}px`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Magnet className="h-3 w-3 text-green-600" />
          </div>
        </div>
      )}
    </>
  );
}

export default function RoomDesignerPage() {
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedDoorId, setSelectedDoorId] = useState<string | null>(null);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  
  const [wallDrawingMode, setWallDrawingMode] = useState<WallDrawingMode>("orthogonal");
  
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    displayCellSize: 40,
    snapGridSize: 4,
    showGrid: true,
    snapToGrid: true,
    snapToWalls: true,
    snapToGuides: true,
    showGuides: true,
    forceOrthogonal: false,
  });
  
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("wall");
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWallStart, setCurrentWallStart] = useState<{ x: number; y: number } | null>(null);
  const [tempWallEnd, setTempWallEnd] = useState<{ x: number; y: number } | null>(null);
  const [snapIndicator, setSnapIndicator] = useState<{ x: number; y: number; type: string } | null>(null);
  
  const [doorWidth, setDoorWidth] = useState<number>(0.9);
  const [windowWidth, setWindowWidth] = useState<number>(1.2);
  const [placingDoor, setPlacingDoor] = useState<{
    wallId: string | null;
    offset: number;
    isPlacing: boolean;
  }>({ wallId: null, offset: 0, isPlacing: false });
  const [placingWindow, setPlacingWindow] = useState<{
    wallId: string | null;
    offset: number;
    isPlacing: boolean;
  }>({ wallId: null, offset: 0, isPlacing: false });
  
  const [viewTransform, setViewTransform] = useState<ViewTransform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Функция для поиска ближайшей точки привязки
const findSnapPoint = useCallback((x: number, y: number): SnapPoint | null => {
  const snapRadius = gridSettings.snapGridSize / gridSettings.displayCellSize;
  let nearestSnap: SnapPoint | null = null;
  let minDistance = Infinity;
  
  // Проверяем, что массивы существуют
  if (gridSettings.snapToWalls && walls && walls.length > 0) {
    walls.forEach(wall => {
      const points = [
        { x: wall.x1, y: wall.y1, type: 'start' as const },
        { x: wall.x2, y: wall.y2, type: 'end' as const },
      ];
      
      points.forEach(point => {
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        if (distance < snapRadius && distance < minDistance) {
          minDistance = distance;
          nearestSnap = {
            x: point.x,
            y: point.y,
            type: point.type,
            wallId: wall.id,
          };
        }
      });
    });
  }
  
  if (gridSettings.snapToGuides && guides && guides.length > 0) {
    guides.forEach(guide => {
      const points = [
        { x: guide.x1, y: guide.y1, type: 'guide' as const },
        { x: guide.x2, y: guide.y2, type: 'guide' as const },
      ];
      
      points.forEach(point => {
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        if (distance < snapRadius && distance < minDistance) {
          minDistance = distance;
          nearestSnap = {
            x: point.x,
            y: point.y,
            type: 'guide',
            guideId: guide.id,
          };
        }
      });
    });
  }
  
  return nearestSnap;
}, [walls, guides, gridSettings.snapToWalls, gridSettings.snapToGuides, gridSettings.snapGridSize, gridSettings.displayCellSize]);
  // НОВАЯ ФУНКЦИЯ: Найти ближайшую стену (включая диагональные)
const findNearestWall = useCallback((x: number, y: number, maxDistance: number = 1.0) => {
  // Проверяем, что walls существует и не пуст
  if (!walls || walls.length === 0) {
    return { wall: null, point: 0, distance: maxDistance };
  }
  
  let nearestWall: WallSegment | null = null;
  let minDistance = maxDistance;
  let nearestPointOnWall: number = 0;
  
  walls.forEach(wall => {
    const { x1, y1, x2, y2, isHorizontal, isDiagonal } = wall;
    
    if (isDiagonal) {
      // Для диагональных стен вычисляем расстояние до линии
      const dx = x2 - x1;
      const dy = y2 - y1;
      const wallLength = Math.sqrt(dx * dx + dy * dy);
      
      if (wallLength === 0) return;
      
      // Находим проекцию точки на линию стены
      const t = ((x - x1) * dx + (y - y1) * dy) / (wallLength * wallLength);
      
      if (t >= 0 && t <= 1) {
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        const distance = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestWall = wall;
          nearestPointOnWall = t;
        }
      }
    } else if (isHorizontal) {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      if (x >= minX && x <= maxX) {
        const distance = Math.abs(y - y1);
        if (distance < minDistance) {
          minDistance = distance;
          nearestWall = wall;
          nearestPointOnWall = (x - minX) / (maxX - minX);
        }
      }
    } else {
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      if (y >= minY && y <= maxY) {
        const distance = Math.abs(x - x1);
        if (distance < minDistance) {
          minDistance = distance;
          nearestWall = wall;
          nearestPointOnWall = (y - minY) / (maxY - minY);
        }
      }
    }
  });
  
  return { wall: nearestWall, point: nearestPointOnWall, distance: minDistance };
}, [walls]);

  // Найти ближайшую вспомогательную линию
  const findNearestGuide = useCallback((x: number, y: number, maxDistance: number = 0.5) => {
  // Проверяем, что guides существует и не пуст
  if (!guides || guides.length === 0) {
    return { guide: null, point: 0, distance: maxDistance };
  }
  
  let nearestGuide: GuideLine | null = null;
  let minDistance = maxDistance;
  let nearestPointOnGuide: number = 0;
  
  guides.forEach(guide => {
    const { x1, y1, x2, y2, isHorizontal, isDiagonal } = guide;
    
    if (isDiagonal) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length === 0) return;
      
      const t = ((x - x1) * dx + (y - y1) * dy) / (length * length);
      
      if (t >= 0 && t <= 1) {
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        const distance = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestGuide = guide;
          nearestPointOnGuide = t;
        }
      }
    } else if (isHorizontal) {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      if (x >= minX && x <= maxX) {
        const distance = Math.abs(y - y1);
        if (distance < minDistance) {
          minDistance = distance;
          nearestGuide = guide;
          nearestPointOnGuide = (x - minX) / (maxX - minX);
        }
      }
    } else {
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      if (y >= minY && y <= maxY) {
        const distance = Math.abs(x - x1);
        if (distance < minDistance) {
          minDistance = distance;
          nearestGuide = guide;
          nearestPointOnGuide = (y - minY) / (maxY - minY);
        }
      }
    }
  });
  
  return { guide: nearestGuide, point: nearestPointOnGuide, distance: minDistance };
}, [guides]);

  const getGridCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const rawGridX = (x - viewTransform.translateX) / (gridSettings.displayCellSize * viewTransform.scale);
    const rawGridY = (y - viewTransform.translateY) / (gridSettings.displayCellSize * viewTransform.scale);
    
    if ((gridSettings.snapToWalls || gridSettings.snapToGuides) && viewMode === "edit") {
      const snapPoint = findSnapPoint(rawGridX, rawGridY);
      if (snapPoint) {
        setSnapIndicator({ x: snapPoint.x, y: snapPoint.y, type: snapPoint.type });
        return { x: snapPoint.x, y: snapPoint.y };
      }
    }
    
    setSnapIndicator(null);
    
    if (gridSettings.snapToGrid && viewMode === "edit") {
      const snapFactor = gridSettings.displayCellSize / gridSettings.snapGridSize;
      return {
        x: Math.round(rawGridX * snapFactor) / snapFactor,
        y: Math.round(rawGridY * snapFactor) / snapFactor,
      };
    }
    
    return {
      x: rawGridX,
      y: rawGridY,
    };
  }, [viewTransform, gridSettings.displayCellSize, gridSettings.snapGridSize, gridSettings.snapToGrid, gridSettings.snapToWalls, gridSettings.snapToGuides, viewMode, findSnapPoint]);

  // Начать рисование стены или вспомогательной линии
  const startDrawingWall = (gridX: number, gridY: number) => {
    if (viewMode === "edit" && (drawingMode === "wall" || drawingMode === "guide")) {
      setCurrentWallStart({ x: gridX, y: gridY });
      setIsDrawing(true);
      setTempWallEnd({ x: gridX, y: gridY });
    }
  };

  // НОВАЯ ФУНКЦИЯ: Начать размещение двери (поддержка диагональных стен)
  const startPlacingDoor = (gridX: number, gridY: number) => {
    if (viewMode === "edit" && drawingMode === "door") {
      const { wall, point, distance } = findNearestWall(gridX, gridY, 1.0);
      
      if (wall) {
        const offset = point * wall.length;
        setPlacingDoor({
          wallId: wall.id,
          offset: offset,
          isPlacing: true,
        });
        
        const newDoor: Door = {
          id: `temp-door-${Date.now()}`,
          wallId: wall.id,
          position: point,
          width: doorWidth,
          offset: offset,
          isPlacing: true,
          orientation: wall.isDiagonal ? 'diagonal' : wall.isHorizontal ? 'horizontal' : 'vertical',
          angle: wall.isDiagonal ? wall.angle : undefined,
        };
        
        setDoors(prev => [...prev, newDoor]);
        setSelectedDoorId(newDoor.id);
        setSelectedWindowId(null);
        setSelectedGuideId(null);
      }
    }
  };

  // НОВАЯ ФУНКЦИЯ: Начать размещение окна (поддержка диагональных стен)
  const startPlacingWindow = (gridX: number, gridY: number) => {
    if (viewMode === "edit" && drawingMode === "window") {
      const { wall, point, distance } = findNearestWall(gridX, gridY, 1.0);
      
      if (wall) {
        const offset = point * wall.length;
        setPlacingWindow({
          wallId: wall.id,
          offset: offset,
          isPlacing: true,
        });
        
        const newWindow: Window = {
          id: `temp-window-${Date.now()}`,
          wallId: wall.id,
          position: point,
          width: windowWidth,
          offset: offset,
          isPlacing: true,
          orientation: wall.isDiagonal ? 'diagonal' : wall.isHorizontal ? 'horizontal' : 'vertical',
          angle: wall.isDiagonal ? wall.angle : undefined,
        };
        
        setWindows(prev => [...prev, newWindow]);
        setSelectedWindowId(newWindow.id);
        setSelectedDoorId(null);
        setSelectedGuideId(null);
      }
    }
  };

  // НОВАЯ ФУНКЦИЯ: Обновить положение двери (поддержка диагональных стен)
 const updateDoorPosition = (gridX: number, gridY: number) => {
  if (placingDoor.isPlacing && placingDoor.wallId && viewMode === "edit") {
    const wall = walls.find(w => w.id === placingDoor.wallId);
    if (!wall) return;
    
    // Используем safe-версию findNearestWall
    const { point } = findNearestWall(gridX, gridY, 2.0);
    const offset = point * wall.length;
    
    setDoors(prev => prev.map(door => 
      door.isPlacing 
        ? { ...door, position: point, offset: offset }
        : door
    ));
  }
};

  // НОВАЯ ФУНКЦИЯ: Обновить положение окна (поддержка диагональных стен)
  const updateWindowPosition = (gridX: number, gridY: number) => {
    if (placingWindow.isPlacing && placingWindow.wallId && viewMode === "edit") {
      const wall = walls.find(w => w.id === placingWindow.wallId);
      if (!wall) return;
      
      // Для диагональных стен находим ближайшую точку на линии стены
      const { point } = findNearestWall(gridX, gridY, 2.0);
      const offset = point * wall.length;
      
      setWindows(prev => prev.map(window => 
        window.isPlacing 
          ? { ...window, position: point, offset: offset }
          : window
      ));
    }
  };

  // Завершить размещение двери
  const finishPlacingDoor = () => {
    if (placingDoor.isPlacing && viewMode === "edit") {
      const wall = walls.find(w => w.id === placingDoor.wallId);
      setDoors(prev => prev.map(door => 
        door.isPlacing 
          ? { 
              ...door, 
              isPlacing: false, 
              id: `door-${Date.now()}`,
              orientation: wall?.isDiagonal ? 'diagonal' : wall?.isHorizontal ? 'horizontal' : 'vertical',
              angle: wall?.isDiagonal ? wall.angle : undefined
            }
          : door
      ));
      
      setPlacingDoor({ wallId: null, offset: 0, isPlacing: false });
    }
  };

  // Завершить размещение окна
  const finishPlacingWindow = () => {
    if (placingWindow.isPlacing && viewMode === "edit") {
      const wall = walls.find(w => w.id === placingWindow.wallId);
      setWindows(prev => prev.map(window => 
        window.isPlacing 
          ? { 
              ...window, 
              isPlacing: false, 
              id: `window-${Date.now()}`,
              orientation: wall?.isDiagonal ? 'diagonal' : wall?.isHorizontal ? 'horizontal' : 'vertical',
              angle: wall?.isDiagonal ? wall.angle : undefined
            }
          : window
      ));
      
      setPlacingWindow({ wallId: null, offset: 0, isPlacing: false });
    }
  };

  // Обновление временной стены/вспомогательной линии при движении мыши
  const updateTempWall = (gridX: number, gridY: number) => {
    if (isDrawing && currentWallStart && viewMode === "edit") {
      setTempWallEnd({ x: gridX, y: gridY });
    }
    if (placingDoor.isPlacing && viewMode === "edit") {
      updateDoorPosition(gridX, gridY);
    }
    if (placingWindow.isPlacing && viewMode === "edit") {
      updateWindowPosition(gridX, gridY);
    }
  };

  // Завершить рисование стены или вспомогательной линии
  const finishDrawingWall = (gridX: number, gridY: number) => {
    if (isDrawing && currentWallStart && viewMode === "edit") {
      const { x: startX, y: startY } = currentWallStart;
      
      const { length: rawLength, angle: rawAngle } = calculateLengthAndAngle(startX, startY, gridX, gridY);
      let endX = gridX;
      let endY = gridY;
      
      const forceOrthogonal = gridSettings.forceOrthogonal || wallDrawingMode === "orthogonal";
      const isDiagonalMode = wallDrawingMode === "diagonal";
      const isFreeMode = wallDrawingMode === "free";
      
      let isDiagonal = false;
      let finalAngle = 0;
      
      if (forceOrthogonal) {
        const isHorizontal = Math.abs(gridX - startX) > Math.abs(gridY - startY);
        if (isHorizontal) {
          endY = startY;
        } else {
          endX = startX;
        }
        isDiagonal = false;
      } else if (isDiagonalMode) {
        isDiagonal = true;
        finalAngle = rawAngle;
      } else if (isFreeMode) {
        const absAngle = Math.abs(rawAngle % 90);
        isDiagonal = absAngle > 5 && absAngle < 85;
        finalAngle = rawAngle;
        
        if (!isDiagonal) {
          const roundedAngle = Math.round(rawAngle / 90) * 90;
          const radians = (roundedAngle * Math.PI) / 180;
          const length = rawLength;
          endX = startX + Math.cos(radians) * length;
          endY = startY + Math.sin(radians) * length;
        }
      }
      
      const { length, angle } = calculateLengthAndAngle(startX, startY, endX, endY);
      
      if (drawingMode === "wall") {
        const newWall: WallSegment = {
          id: `wall-${Date.now()}`,
          x1: startX,
          y1: startY,
          x2: endX,
          y2: endY,
          length: Math.max(0.5, length),
          isHorizontal: !isDiagonal && Math.abs(endX - startX) > Math.abs(endY - startY),
          isDiagonal: isDiagonal,
          angle: isDiagonal ? angle : undefined,
        };
        
        setWalls([...walls, newWall]);
        setSelectedWallId(newWall.id);
        setSelectedGuideId(null);
      } else if (drawingMode === "guide") {
        const newGuide: GuideLine = {
          id: `guide-${Date.now()}`,
          x1: startX,
          y1: startY,
          x2: endX,
          y2: endY,
          isHorizontal: !isDiagonal && Math.abs(endX - startX) > Math.abs(endY - startY),
          isDiagonal: isDiagonal,
          angle: isDiagonal ? angle : undefined,
        };
        
        setGuides([...guides, newGuide]);
        setSelectedGuideId(newGuide.id);
        setSelectedWallId(null);
      }
      
      setCurrentWallStart(null);
      setIsDrawing(false);
      setTempWallEnd(null);
      setSnapIndicator(null);
    }
  };

  // Обработчик клика по сетке
  const handleGridClick = (e: React.MouseEvent) => {
    if (isPanning || viewMode === "view") return;
    
    const { x: gridX, y: gridY } = getGridCoordinates(e.clientX, e.clientY);
    
    if (drawingMode === "door") {
      if (!placingDoor.isPlacing) {
        startPlacingDoor(gridX, gridY);
      } else {
        finishPlacingDoor();
      }
    } else if (drawingMode === "window") {
      if (!placingWindow.isPlacing) {
        startPlacingWindow(gridX, gridY);
      } else {
        finishPlacingWindow();
      }
    } else if (drawingMode === "wall" || drawingMode === "guide") {
      if (!isDrawing) {
        startDrawingWall(gridX, gridY);
      } else {
        finishDrawingWall(gridX, gridY);
      }
    } else if (drawingMode === "select") {
      setSelectedWallId(null);
      setSelectedDoorId(null);
      setSelectedWindowId(null);
      setSelectedGuideId(null);
    }
  };

  // Обработчик движения мыши
  const handleMouseMove = (e: React.MouseEvent) => {
    const { x: gridX, y: gridY } = getGridCoordinates(e.clientX, e.clientY);
    
    if (viewMode === "edit") {
      updateTempWall(gridX, gridY);
    }
    
    if (isPanning && !isDrawing && !placingDoor.isPlacing && !placingWindow.isPlacing) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      setViewTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY,
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Начать панорамирование
  const startPanning = (e: React.MouseEvent) => {
    if ((drawingMode !== "wall" && !isDrawing && !placingDoor.isPlacing && !placingWindow.isPlacing) || viewMode === "view") {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  // Остановить панорамирование
  const stopPanning = () => {
    setIsPanning(false);
  };

  // Масштабирование колесом мыши
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomIntensity = 0.1;
    const newScale = e.deltaY > 0 
      ? Math.max(0.1, viewTransform.scale - zoomIntensity)
      : Math.min(3, viewTransform.scale + zoomIntensity);
    
    const scaleChange = newScale / viewTransform.scale;
    
    setViewTransform(prev => ({
      scale: newScale,
      translateX: mouseX - (mouseX - prev.translateX) * scaleChange,
      translateY: mouseY - (mouseY - prev.translateY) * scaleChange,
    }));
  }, [viewTransform]);

  // Быстрое масштабирование
  const zoomIn = () => {
    const newScale = Math.min(3, viewTransform.scale + 0.2);
    setViewTransform(prev => ({
      ...prev,
      scale: newScale,
    }));
  };

  const zoomOut = () => {
    const newScale = Math.max(0.1, viewTransform.scale - 0.2);
    setViewTransform(prev => ({
      ...prev,
      scale: newScale,
    }));
  };

  const resetView = () => {
    setViewTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  };

  // Отмена рисования/размещения
  const cancelDrawing = () => {
    if (isDrawing) {
      setCurrentWallStart(null);
      setIsDrawing(false);
      setTempWallEnd(null);
      setSnapIndicator(null);
    }
    if (placingDoor.isPlacing) {
      setDoors(prev => prev.filter(door => !door.isPlacing));
      setPlacingDoor({ wallId: null, offset: 0, isPlacing: false });
      setSelectedDoorId(null);
    }
    if (placingWindow.isPlacing) {
      setWindows(prev => prev.filter(window => !window.isPlacing));
      setPlacingWindow({ wallId: null, offset: 0, isPlacing: false });
      setSelectedWindowId(null);
    }
  };

  // Удаление выбранной стены
  const deleteSelectedWall = () => {
    if (selectedWallId && viewMode === "edit") {
      setDoors(doors.filter(door => door.wallId !== selectedWallId));
      setWindows(windows.filter(window => window.wallId !== selectedWallId));
      setWalls(walls.filter(wall => wall.id !== selectedWallId));
      setSelectedWallId(null);
    }
  };

  // Удаление выбранной двери
  const deleteSelectedDoor = () => {
    if (selectedDoorId && viewMode === "edit") {
      setDoors(doors.filter(door => door.id !== selectedDoorId));
      setSelectedDoorId(null);
    }
  };

  // Удаление выбранного окна
  const deleteSelectedWindow = () => {
    if (selectedWindowId && viewMode === "edit") {
      setWindows(windows.filter(window => window.id !== selectedWindowId));
      setSelectedWindowId(null);
    }
  };

  // Удаление выбранной вспомогательной линии
  const deleteSelectedGuide = () => {
    if (selectedGuideId && viewMode === "edit") {
      setGuides(guides.filter(guide => guide.id !== selectedGuideId));
      setSelectedGuideId(null);
    }
  };

  // Изменение ширины двери
  const changeDoorWidth = (width: number) => {
    setDoorWidth(width);
    if (selectedDoorId && viewMode === "edit") {
      setDoors(prev => prev.map(door => 
        door.id === selectedDoorId 
          ? { ...door, width: width }
          : door
      ));
    }
  };

  // Изменение ширины окна
  const changeWindowWidth = (width: number) => {
    setWindowWidth(width);
    if (selectedWindowId && viewMode === "edit") {
      setWindows(prev => prev.map(window => 
        window.id === selectedWindowId 
          ? { ...window, width: width }
          : window
      ));
    }
  };

  // Сброс всех стен, дверей, окон и вспомогательных линий
  const resetWalls = () => {
    if (viewMode === "edit") {
      setWalls([]);
      setDoors([]);
      setWindows([]);
      setGuides([]);
      setSelectedWallId(null);
      setSelectedDoorId(null);
      setSelectedWindowId(null);
      setSelectedGuideId(null);
      setCurrentWallStart(null);
      setIsDrawing(false);
      setTempWallEnd(null);
      setSnapIndicator(null);
      setPlacingDoor({ wallId: null, offset: 0, isPlacing: false });
      setPlacingWindow({ wallId: null, offset: 0, isPlacing: false });
    }
  };

  // Переключение режима просмотра/редактирования
  const toggleViewMode = () => {
    if (viewMode === "edit") {
      setViewMode("view");
      setDrawingMode("select");
      cancelDrawing();
      setSelectedWallId(null);
      setSelectedDoorId(null);
      setSelectedWindowId(null);
      setSelectedGuideId(null);
    } else {
      setViewMode("edit");
    }
  };

  // Обработка нажатия клавиши ESC для отмены
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isDrawing || placingDoor.isPlacing || placingWindow.isPlacing) && viewMode === "edit") {
        cancelDrawing();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, placingDoor.isPlacing, placingWindow.isPlacing, viewMode]);

  // Добавляем обработчик колеса мыши
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Создаем фоновую сетку
  const getGridBackground = () => {
    if (!gridSettings.showGrid) return 'none';
    
    const displayCellSize = gridSettings.displayCellSize * viewTransform.scale;
    const snapGridSize = gridSettings.snapGridSize * viewTransform.scale;
    
    const subGrid = `
      linear-gradient(
        to right,
        #e5e7eb 1px,
        transparent 1px
      ) ${viewTransform.translateX}px ${viewTransform.translateY}px / ${snapGridSize}px 100%,
      linear-gradient(
        to bottom,
        #e5e7eb 1px,
        transparent 1px
      ) ${viewTransform.translateX}px ${viewTransform.translateY}px / 100% ${snapGridSize}px
    `;
    
    const mainGrid = `
      linear-gradient(
        to right,
        #9ca3af 2px,
        transparent 2px
      ) ${viewTransform.translateX}px ${viewTransform.translateY}px / ${displayCellSize}px 100%,
      linear-gradient(
        to bottom,
        #9ca3af 2px,
        transparent 2px
      ) ${viewTransform.translateX}px ${viewTransform.translateY}px / 100% ${displayCellSize}px
    `;
    
    return `${subGrid}, ${mainGrid}`;
  };

  // Получение курсора в зависимости от режима
  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (viewMode === "view") return 'grab';
    if (drawingMode === "door" || drawingMode === "window" || drawingMode === "guide") return 'crosshair';
    if (isDrawing) return 'crosshair';
    return 'crosshair';
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        <Tabs>
          <TabsList className="w-full">
            <TabsTrigger value="menu" className="flex-1">
              <div className="flex items-center gap-2 justify-center">
                <span className="truncate">Зал</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex-1">
              <div className="flex items-center gap-2 justify-center">
                <span className="truncate">Терраса</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex-1">
              <div className="flex items-center gap-2 justify-center">
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Добавить</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Область рисования */}
        <Card className="w-full flex flex-row flex-wrap gap-4 p-2">
          {/* Переключатель режимов */}
          <Button
            variant={viewMode === "edit" ? "default" : "outline"}
            onClick={toggleViewMode}
            className="flex items-center gap-2"
          >
            {viewMode === "edit" ? (
              <>
                <Eye className="h-4 w-4" />
                Режим просмотра
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                Режим редактирования
              </>
            )}
          </Button>

          {/* Кнопки редактирования (только в режиме редактирования) */}
          {viewMode === "edit" && (
            <>
              <div className="flex items-center gap-2 border rounded-md p-1">
                <Button
                  variant={wallDrawingMode === "orthogonal" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setWallDrawingMode("orthogonal")}
                  title="Ортогональные стены (только горизонтальные/вертикальные)"
                >
                  <SquareIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={wallDrawingMode === "diagonal" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setWallDrawingMode("diagonal")}
                  title="Диагональные стены (под произвольным углом)"
                >
                  <MinusCircle className="h-4 w-4 rotate-45" />
                </Button>
                <Button
                  variant={wallDrawingMode === "free" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setWallDrawingMode("free")}
                  title="Свободный режим (автоматическое определение)"
                >
                  <Square className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant={drawingMode === "wall" ? "default" : "outline"}
                onClick={() => setDrawingMode("wall")}
              >
                <Square className="h-4 w-4 mr-2" />
                Стена
              </Button>
              <Button
                variant={drawingMode === "door" ? "default" : "outline"}
                onClick={() => {
                  setDrawingMode("door");
                  cancelDrawing();
                }}
              >
                <DoorOpen className="h-4 w-4 mr-2" />
                Дверь
              </Button>
              <Button
                variant={drawingMode === "window" ? "default" : "outline"}
                onClick={() => {
                  setDrawingMode("window");
                  cancelDrawing();
                }}
              >
                <Window className="h-4 w-4 mr-2" />
                Окно
              </Button>
              <Button
                variant={drawingMode === "guide" ? "default" : "outline"}
                onClick={() => {
                  setDrawingMode("guide");
                  cancelDrawing();
                }}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Вспомогательная линия
              </Button>
              <Button
                variant={drawingMode === "select" ? "default" : "outline"}
                onClick={() => {
                  setDrawingMode("select");
                  cancelDrawing();
                }}
              >
                <MousePointer className="h-4 w-4 mr-2" />
                Выбор
              </Button>

              {selectedDoorId && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="doorWidth" className="whitespace-nowrap">
                    Ширина двери:
                  </Label>
                  <Input
                    id="doorWidth"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="2.0"
                    value={doorWidth}
                    onChange={(e) => changeDoorWidth(parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm">м</span>
                </div>
              )}

              {selectedWindowId && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="windowWidth" className="whitespace-nowrap">
                    Ширина окна:
                  </Label>
                  <Input
                    id="windowWidth"
                    type="number"
                    step="0.1"
                    min="0.3"
                    max="3.0"
                    value={windowWidth}
                    onChange={(e) => changeWindowWidth(parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm">м</span>
                </div>
              )}

              <Button 
                variant="destructive" 
                onClick={() => {
                  if (selectedDoorId) deleteSelectedDoor();
                  else if (selectedWindowId) deleteSelectedWindow();
                  else if (selectedGuideId) deleteSelectedGuide();
                  else deleteSelectedWall();
                }}
                disabled={!selectedWallId && !selectedDoorId && !selectedWindowId && !selectedGuideId}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить {
                  selectedDoorId ? "дверь" : 
                  selectedWindowId ? "окно" : 
                  selectedGuideId ? "вспомогательную линию" : 
                  "стену"
                }
              </Button>
              <Button 
                variant="outline" 
                onClick={resetWalls}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Сбросить всё
              </Button>
            </>
          )}
          
          {(isDrawing || placingDoor.isPlacing || placingWindow.isPlacing) && viewMode === "edit" && (
            <Button 
              variant="outline" 
              onClick={cancelDrawing}
            >
              Отменить {
                placingDoor.isPlacing ? "размещение двери" : 
                placingWindow.isPlacing ? "размещение окна" : 
                "рисование"
              } (ESC)
            </Button>
          )}
          
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="showGrid">Показать сетку</Label>
            <Switch
              id="showGrid"
              checked={gridSettings.showGrid}
              onCheckedChange={(checked) => setGridSettings({...gridSettings, showGrid: checked})}
              disabled={viewMode === "view"}
            />
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="showGuides">Показать вспомогательные линии</Label>
            <Switch
              id="showGuides"
              checked={gridSettings.showGuides}
              onCheckedChange={(checked) => setGridSettings({...gridSettings, showGuides: checked})}
              disabled={viewMode === "view"}
            />
          </div>
          
          {viewMode === "edit" && (
            <>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="snapToGrid">Привязка к сетке</Label>
                <Switch
                  id="snapToGrid"
                  checked={gridSettings.snapToGrid}
                  onCheckedChange={(checked) => setGridSettings({...gridSettings, snapToGrid: checked})}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="snapToWalls">Привязка к стенам</Label>
                <Switch
                  id="snapToWalls"
                  checked={gridSettings.snapToWalls}
                  onCheckedChange={(checked) => setGridSettings({...gridSettings, snapToWalls: checked})}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="snapToGuides">Привязка к вспомогательным линиям</Label>
                <Switch
                  id="snapToGuides"
                  checked={gridSettings.snapToGuides}
                  onCheckedChange={(checked) => setGridSettings({...gridSettings, snapToGuides: checked})}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="forceOrthogonal" title="Принудительно рисовать только горизонтальные/вертикальные линии">
                  Только ортогональные линии
                </Label>
                <Switch
                  id="forceOrthogonal"
                  checked={gridSettings.forceOrthogonal}
                  onCheckedChange={(checked) => setGridSettings({...gridSettings, forceOrthogonal: checked})}
                />
              </div>
            </>
          )}
        </Card>
        
        <Card className="flex-1">
          <CardHeader>
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <CardTitle className="text-lg">
                  {viewMode === "edit" ? "Редактирование плана" : "Просмотр плана"}
                </CardTitle>
                <CardDescription>
                  {viewMode === "edit" 
                    ? "Режим редактирования. Добавляйте стены, двери, окна и вспомогательные линии." 
                    : "Режим просмотра. Только навигация по плану."}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                {viewMode === "edit" && drawingMode === "wall" && (
                  <div className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1 rounded-md">
                    <span className="font-medium">Режим стен:</span>
                    <span className="text-gray-700">
                      {wallDrawingMode === "orthogonal" ? "Ортогональный" : 
                       wallDrawingMode === "diagonal" ? "Диагональный" : 
                       "Свободный"}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={zoomOut}
                    title="Отдалить"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[60px] text-center">
                    {Math.round(viewTransform.scale * 100)}%
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={zoomIn}
                    title="Приблизить"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetView}
                    title="Сбросить вид"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div 
              ref={containerRef}
              className="relative border border-gray-300 rounded-md bg-white overflow-hidden"
              style={{ 
                height: "600px",
                background: getGridBackground(),
                cursor: getCursor()
              }}
              onClick={handleGridClick}
              onMouseMove={handleMouseMove}
              onMouseDown={startPanning}
              onMouseUp={stopPanning}
              onMouseLeave={stopPanning}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Вспомогательные линии */}
              {gridSettings.showGuides && viewMode === "edit" && guides.map(guide => (
                <GuideLineComponent
                  key={guide.id}
                  guide={guide}
                  displayCellSize={gridSettings.displayCellSize}
                  isSelected={selectedGuideId === guide.id}
                  onClick={() => {
                    if (viewMode === "edit" && drawingMode === "select") {
                      setSelectedGuideId(guide.id);
                      setSelectedWallId(null);
                      setSelectedDoorId(null);
                      setSelectedWindowId(null);
                    }
                  }}
                  viewTransform={viewTransform}
                  showGuides={gridSettings.showGuides}
                />
              ))}
              
              {/* Нарисованные стены */}
              {walls.map(wall => (
                <Wall
                  key={wall.id}
                  wall={wall}
                  displayCellSize={gridSettings.displayCellSize}
                  isSelected={selectedWallId === wall.id}
                  onClick={() => {
                    if (viewMode === "edit" && drawingMode === "select") {
                      setSelectedWallId(wall.id);
                      setSelectedDoorId(null);
                      setSelectedWindowId(null);
                      setSelectedGuideId(null);
                    }
                  }}
                  viewTransform={viewTransform}
                  showDimensions={viewMode === "edit"}
                />
              ))}
              
              {/* Точки концов стен и вспомогательных линий для визуализации */}
              {(gridSettings.snapToWalls || gridSettings.snapToGuides) && viewMode === "edit" && !isDrawing && !placingDoor.isPlacing && !placingWindow.isPlacing && (
                <>
                  {gridSettings.snapToWalls && walls.length > 0 && walls.flatMap(wall => [
                    { x: wall.x1, y: wall.y1 },
                    { x: wall.x2, y: wall.y2 }
                  ]).map((point, index) => (
                    <div
                      key={`snap-wall-point-${index}`}
                      className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm opacity-50 pointer-events-none"
                      style={{
                        left: `${point.x * gridSettings.displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
                        top: `${point.y * gridSettings.displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
                      }}
                    />
                  ))}
                  
                  {gridSettings.snapToGuides && gridSettings.showGuides && guides.length > 0 && guides.flatMap(guide => [
                    { x: guide.x1, y: guide.y1 },
                    { x: guide.x2, y: guide.y2 }
                  ]).map((point, index) => (
                    <div
                      key={`snap-guide-point-${index}`}
                      className="absolute w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow-sm opacity-50 pointer-events-none"
                      style={{
                        left: `${point.x * gridSettings.displayCellSize * viewTransform.scale + viewTransform.translateX - 3}px`,
                        top: `${point.y * gridSettings.displayCellSize * viewTransform.scale + viewTransform.translateY - 3}px`,
                      }}
                    />
                  ))}
                </>
              )}
              
              {/* Двери */}
              {doors.map(door => {
                const wall = walls.find(w => w.id === door.wallId);
                if (!wall) return null;
                
                return (
                  <Door
                    key={door.id}
                    door={door}
                    wall={wall}
                    displayCellSize={gridSettings.displayCellSize}
                    viewTransform={viewTransform}
                    isSelected={selectedDoorId === door.id}
                    onClick={() => {
                      if (viewMode === "edit" && drawingMode === "select") {
                        setSelectedDoorId(door.id);
                        setSelectedWallId(null);
                        setSelectedWindowId(null);
                        setSelectedGuideId(null);
                      }
                    }}
                    showDimensions={viewMode === "edit"}
                  />
                );
              })}
              
              {/* Окна */}
              {windows.map(windowItem => {
                const wall = walls.find(w => w.id === windowItem.wallId);
                if (!wall) return null;
                
                return (
                  <WindowComponent
                    key={windowItem.id}
                    windowItem={windowItem}
                    wall={wall}
                    displayCellSize={gridSettings.displayCellSize}
                    viewTransform={viewTransform}
                    isSelected={selectedWindowId === windowItem.id}
                    onClick={() => {
                      if (viewMode === "edit" && drawingMode === "select") {
                        setSelectedWindowId(windowItem.id);
                        setSelectedWallId(null);
                        setSelectedDoorId(null);
                        setSelectedGuideId(null);
                      }
                    }}
                    showDimensions={viewMode === "edit"}
                  />
                );
              })}
              
              {/* Точка начала рисования */}
              {currentWallStart && viewMode === "edit" && (
                <div
                  className="absolute w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow z-10"
                  style={{
                    left: `${currentWallStart.x * gridSettings.displayCellSize * viewTransform.scale + viewTransform.translateX - 6}px`,
                    top: `${currentWallStart.y * gridSettings.displayCellSize * viewTransform.scale + viewTransform.translateY - 6}px`,
                  }}
                />
              )}
              
              {/* Временная стена или вспомогательная линия при рисовании */}
              {isDrawing && currentWallStart && tempWallEnd && viewMode === "edit" && (
                <TempWall
                  startX={currentWallStart.x}
                  startY={currentWallStart.y}
                  endX={tempWallEnd.x}
                  endY={tempWallEnd.y}
                  displayCellSize={gridSettings.displayCellSize}
                  viewTransform={viewTransform}
                  showDimensions={viewMode === "edit"}
                  snapIndicator={snapIndicator}
                  isGuide={drawingMode === "guide"}
                  wallDrawingMode={wallDrawingMode}
                />
              )}
              
              {/* Подсказка для режима дверей */}
              {drawingMode === "door" && !placingDoor.isPlacing && viewMode === "edit" && (
                <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none">
                  <p className="text-sm font-medium">Режим добавления дверей</p>
                  <p className="text-xs opacity-90">Нажмите на стену, чтобы добавить дверь</p>
                  <p className="text-xs opacity-90 mt-1">Двери можно размещать на любых стенах (включая диагональные)</p>
                </div>
              )}
              
              {/* Подсказка для режима окон */}
              {drawingMode === "window" && !placingWindow.isPlacing && viewMode === "edit" && (
                <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none">
                  <p className="text-sm font-medium">Режим добавления окон</p>
                  <p className="text-xs opacity-90">Нажмите на стену, чтобы добавить окно</p>
                  <p className="text-xs opacity-90 mt-1">Окна можно размещать на любых стенах (включая диагональные)</p>
                </div>
              )}
              
              {/* Подсказка для режима вспомогательных линий */}
              {drawingMode === "guide" && !isDrawing && viewMode === "edit" && (
                <div className="absolute bottom-4 left-4 bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none">
                  <p className="text-sm font-medium">Режим добавления вспомогательных линий</p>
                  <p className="text-xs opacity-90">Нажмите и протяните для создания линии</p>
                  <p className="text-xs opacity-90">Можно рисовать горизонтальные, вертикальные и диагональные линии</p>
                </div>
              )}
              
              {/* Подсказка для режима рисования стен */}
              {drawingMode === "wall" && !isDrawing && viewMode === "edit" && (
                <div className="absolute bottom-4 left-4 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none max-w-md">
                  <p className="text-sm font-medium">Режим рисования стен: {wallDrawingMode === "orthogonal" ? "Ортогональный" : wallDrawingMode === "diagonal" ? "Диагональный" : "Свободный"}</p>
                  <p className="text-xs opacity-90">
                    {wallDrawingMode === "orthogonal" 
                      ? "Рисуются только горизонтальные и вертикальные стены" 
                      : wallDrawingMode === "diagonal" 
                      ? "Рисуются стены под произвольным углом" 
                      : "Автоматическое определение: при малом отклонении от осей создаются прямые стены"}
                  </p>
                  <p className="text-xs opacity-90 mt-1">Нажмите и протяните для создания стены</p>
                </div>
              )}
              
              {/* Подсказка для размещения двери */}
              {placingDoor.isPlacing && viewMode === "edit" && (
                <div className="absolute bottom-4 left-4 bg-amber-600 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none">
                  <p className="text-sm font-medium">Размещение двери</p>
                  <p className="text-xs opacity-90">Перетащите вдоль стены, кликните для размещения</p>
                  <p className="text-xs opacity-90 mt-1">Привязка от начала стены: {doors.find(d => d.isPlacing)?.offset.toFixed(1) || '0.0'} м</p>
                </div>
              )}
              
              {/* Подсказка для размещения окна */}
              {placingWindow.isPlacing && viewMode === "edit" && (
                <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none">
                  <p className="text-sm font-medium">Размещение окна</p>
                  <p className="text-xs opacity-90">Перетащите вдоль стены, кликните для размещения</p>
                  <p className="text-xs opacity-90 mt-1">Привязка от начала стены: {windows.find(w => w.isPlacing)?.offset.toFixed(1) || '0.0'} м</p>
                </div>
              )}
              
              {/* Подсказка при пустом плане */}
              {walls.length === 0 && !isDrawing && viewMode === "edit" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center p-6 bg-white/90 rounded-lg max-w-md shadow-lg">
                    <Grid3X3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-medium text-lg mb-2">Начните проектирование</h3>
                    <p className="text-gray-600 mb-3">Добавьте первую стену, используя инструмент "Стена"</p>
                    <p className="text-gray-500 text-sm mb-3">
                      Попробуйте разные режимы рисования: ортогональный, диагональный или свободный
                    </p>
                  </div>
                </div>
              )}
              
              {/* Подсказка в режиме просмотра */}
              {walls.length === 0 && viewMode === "view" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center p-6 bg-white/90 rounded-lg max-w-md shadow-lg">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-medium text-lg mb-2">Режим просмотра</h3>
                    <p className="text-gray-600 mb-3">Добавьте стены в режиме редактирования</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={toggleViewMode}
                      className="pointer-events-auto mt-2"
                    >
                      Перейти к редактированию
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Индикатор панорамирования */}
              {isPanning && (
                <div className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Move className="h-4 w-4 animate-pulse" />
                  Панорамирование...
                </div>
              )}
              
              {/* Индикатор режима просмотра */}
              {viewMode === "view" && !isPanning && (
                <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Режим просмотра
                </div>
              )}
              
            </div>
            
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-3 bg-gray-600 rounded"></div>
                  <span>Стена</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-4 bg-amber-800 rounded-sm border border-amber-900"></div>
                  <span>Дверь</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-3 bg-white rounded-sm border-2 border-blue-300"></div>
                  <span>Окно</span>
                </div>
                {viewMode === "edit" && gridSettings.showGuides && (
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-1 border-t-2 border-dashed border-purple-500"></div>
                    <span>Вспом. линия</span>
                  </div>
                )}
                {viewMode === "edit" && (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-3 bg-gray-600 opacity-70 rounded"></div>
                      <span>Рисуемая стена</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span>Начало стены</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-gray-400 rounded-sm"></div>
                      <span>Привязка</span>
                    </div>
                    {gridSettings.snapToWalls && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Точки стен</span>
                      </div>
                    )}
                    {gridSettings.snapToGuides && gridSettings.showGuides && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Точки линий</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}