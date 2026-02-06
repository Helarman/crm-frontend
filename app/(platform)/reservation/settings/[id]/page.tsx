//@ts-nocheck

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Square, Ruler, Trash2, Download, Grid, MousePointer, ZoomIn, ZoomOut, Move, 
  Minus, Plus, Maximize2, Eye, Edit, Magnet, DoorOpen, AppWindow as Window,
  MoveLeft, HelpCircle, Grid3X3, MinusCircle, SquareIcon, RotateCcw,
  Save, Loader2, X, PlusCircle, Check, AlertCircle, Table, Users,
  Circle, RectangleHorizontal, Square as SquareShape, Egg, Combine,
  Tags, Filter, SortAsc, SortDesc, Search, Copy, Scissors,
  TableProperties, Table2, LayoutGrid, GitCompare, Unlink,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight
} from "lucide-react";
import { 
  TablesService, HallDto, CreateHallDto, UpdateHallDto, 
  TableDto, CreateTableDto, UpdateTableDto, TableStatus, TableShape,
  TableTagDto, CreateTableTagDto
} from "@/lib/api/tables.service";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogContentExtraWide, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
  thickness?: number;
  color?: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type Door = {
  id: string;
  wallId: string;
  position: number;
  width: number;
  offset: number;
  isPlacing: boolean;
  orientation?: 'horizontal' | 'vertical' | 'diagonal';
  angle?: number;
  height?: number;
  color?: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type Window = {
  id: string;
  wallId: string;
  position: number;
  width: number;
  offset: number;
  isPlacing: boolean;
  orientation?: 'horizontal' | 'vertical' | 'diagonal';
  angle?: number;
  height?: number;
  color?: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
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
  color?: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
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
  snapToTables: boolean;
  showTableLabels: boolean;
};

type DrawingMode = "wall" | "select" | "measure" | "door" | "window" | "guide" | "table";
type WallDrawingMode = "orthogonal" | "diagonal" | "free";
type ViewMode = "edit" | "view" | "tables";
type ViewTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

type SnapPoint = {
  x: number;
  y: number;
  type: 'start' | 'end' | 'intersection' | 'guide' | 'table';
  wallId?: string;
  guideId?: string;
  tableId?: string;
};

interface Hall extends HallDto {
  walls?: WallSegment[];
  doors?: Door[];
  windows?: Window[];
  guides?: GuideLine[];
  tables?: TableDto[];
}

const calculateLengthAndAngle = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return { length, angle };
};

const getPointOnLine = (x1: number, y1: number, x2: number, y2: number, t: number) => {
  return {
    x: x1 + (x2 - x1) * t,
    y: y1 + (y2 - y1) * t
  };
};

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

function Wall({ wall, displayCellSize, isSelected, onClick, viewTransform, showDimensions, showInTablesMode = false }: { 
  wall: WallSegment; 
  displayCellSize: number; 
  isSelected: boolean; 
  onClick: () => void;
  viewTransform: ViewTransform;
  showDimensions: boolean;
  showInTablesMode?: boolean;
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
          className={`absolute ${showInTablesMode ? 'bg-gray-400' : 'bg-gray-600 hover:bg-gray-500'} rounded-md transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
          style={{
            left: `${centerX - (length * displayCellSize * viewTransform.scale) / 2 + viewTransform.translateX}px`,
            top: `${centerY - 5 + viewTransform.translateY}px`,
            width: `${length * displayCellSize * viewTransform.scale}px`,
            height: `10px`,
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'center center',
            cursor: showDimensions ? 'default' : 'pointer',
            pointerEvents: showInTablesMode ? 'none' : 'auto',
          }}
          onClick={showInTablesMode ? undefined : onClick}
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
                pointerEvents: 'none',
              }}
            />
            <div
              className="absolute w-2 h-2 bg-blue-500 rounded-full border border-white"
              style={{
                left: `${x2 * displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
                top: `${y2 * displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
                pointerEvents: 'none',
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
        className={`absolute ${showInTablesMode ? 'bg-gray-400' : 'bg-gray-600 hover:bg-gray-500'} rounded-md transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
        style={{
          left: `${left + viewTransform.translateX}px`,
          top: `${top + viewTransform.translateY}px`,
          width: `${wallWidth}px`,
          height: `${wallHeight}px`,
          cursor: showDimensions ? 'default' : 'pointer',
          pointerEvents: showInTablesMode ? 'none' : 'auto',
        }}
        onClick={showInTablesMode ? undefined : onClick}
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

function GuideLineComponent({ guide, displayCellSize, isSelected, onClick, viewTransform, showGuides, showInTablesMode = false }: { 
  guide: GuideLine; 
  displayCellSize: number; 
  isSelected: boolean; 
  onClick: () => void;
  viewTransform: ViewTransform;
  showGuides: boolean;
  showInTablesMode?: boolean;
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
            pointerEvents: showInTablesMode ? 'none' : 'auto',
          }}
          onClick={showInTablesMode ? undefined : onClick}
        />
        
        <div
          className="absolute w-2 h-2 bg-purple-500 rounded-full border border-white"
          style={{
            left: `${x1 * displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
            top: `${y1 * displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
            pointerEvents: 'none',
          }}
        />
        <div
          className="absolute w-2 h-2 bg-purple-500 rounded-full border border-white"
          style={{
            left: `${x2 * displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
            top: `${y2 * displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
            pointerEvents: 'none',
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
    pointerEvents: showInTablesMode ? 'none' as const : 'auto' as const,
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
        onClick={showInTablesMode ? undefined : onClick}
      />
      
      <div
        className="absolute w-2 h-2 bg-purple-500 rounded-full border border-white"
        style={{
          left: `${x1 * displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
          top: `${y1 * displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
          pointerEvents: 'none',
        }}
      />
      <div
        className="absolute w-2 h-2 bg-purple-500 rounded-full border border-white"
        style={{
          left: `${x2 * displayCellSize * viewTransform.scale + viewTransform.translateX - 4}px`,
          top: `${y2 * displayCellSize * viewTransform.scale + viewTransform.translateY - 4}px`,
          pointerEvents: 'none',
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

function Door({ door, wall, displayCellSize, viewTransform, isSelected, onClick, showDimensions, showInTablesMode = false }: { 
  door: Door;
  wall: WallSegment | undefined;
  displayCellSize: number;
  viewTransform: ViewTransform;
  isSelected: boolean;
  onClick: () => void;
  showDimensions: boolean;
  showInTablesMode?: boolean;
}) {
  if (!wall) return null;
  const { x1, y1, x2, y2, isDiagonal, angle } = wall;
  const { offset, width, isPlacing, orientation = 'vertical' } = door;
  
  const wallLength = wall.length;
  const t = offset / wallLength;
  
  const doorCenter = getPointOnLine(x1, y1, x2, y2, t);
  
  if (isDiagonal) {
    const doorAngle = angle || 0;
    const doorLengthInGrid = width / (wallLength / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    
    const perpVector = getPerpendicularVector(x2 - x1, y2 - y1, 0.25);
    
    const halfLength = doorLengthInGrid / 2;
    const dx = (x2 - x1) * halfLength / wallLength;
    const dy = (y2 - y1) * halfLength / wallLength;
    
    const doorX1 = doorCenter.x - dx;
    const doorY1 = doorCenter.y - dy;
    const doorX2 = doorCenter.x + dx;
    const doorY2 = doorCenter.y + dy;
    
    const doorCenterX = (doorX1 + doorX2) / 2;
    const doorCenterY = (doorY1 + doorY2) / 2;
    
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
          className={`absolute ${showInTablesMode ? 'bg-amber-600' : 'bg-amber-800 hover:bg-amber-700'} rounded-sm border-2 border-amber-900 transition-all ${isSelected ? "ring-2 ring-yellow-500 ring-offset-1" : ""} ${isPlacing ? "opacity-70" : ""}`}
          style={{
            left: `${finalCenterX * displayCellSize * viewTransform.scale - (finalWidth * displayCellSize * viewTransform.scale) / 2 + viewTransform.translateX}px`,
            top: `${finalCenterY * displayCellSize * viewTransform.scale - 10 + viewTransform.translateY}px`,
            width: `${finalWidth * displayCellSize * viewTransform.scale}px`,
            height: `20px`,
            transform: `rotate(${finalAngle}deg)`,
            transformOrigin: 'center center',
            cursor: showInTablesMode ? 'default' : 'pointer',
            pointerEvents: showInTablesMode ? 'none' : 'auto',
          }}
          onClick={showInTablesMode ? undefined : onClick}
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
        className={`absolute ${showInTablesMode ? 'bg-amber-600' : 'bg-amber-800 hover:bg-amber-700'} rounded-sm border-2 border-amber-900 transition-all ${isSelected ? "ring-2 ring-yellow-500 ring-offset-1" : ""} ${isPlacing ? "opacity-70" : ""}`}
        style={{
          left: `${doorLeft + viewTransform.translateX}px`,
          top: `${doorTop + viewTransform.translateY}px`,
          width: `${doorWidth}px`,
          height: `${doorHeight}px`,
          transform: isHorizontal ? 'translateY(-5px)' : 'translateX(-5px)',
          cursor: showInTablesMode ? 'default' : 'pointer',
          pointerEvents: showInTablesMode ? 'none' : 'auto',
        }}
        onClick={showInTablesMode ? undefined : onClick}
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

function WindowComponent({ windowItem, wall, displayCellSize, viewTransform, isSelected, onClick, showDimensions, showInTablesMode = false }: { 
  windowItem: Window;
  wall: WallSegment;
  displayCellSize: number;
  viewTransform: ViewTransform;
  isSelected: boolean;
  onClick: () => void;
  showDimensions: boolean;
  showInTablesMode?: boolean;
}) {
  const { x1, y1, x2, y2, isDiagonal, angle } = wall;
  const { offset, width, isPlacing, orientation = 'horizontal' } = windowItem;
  
  const wallLength = wall.length;
  const t = offset / wallLength;
  
  const windowCenter = getPointOnLine(x1, y1, x2, y2, t);
  
  if (isDiagonal) {
    const windowAngle = angle || 0;
    const windowLengthInGrid = width / (wallLength / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    
    const halfLength = windowLengthInGrid / 2;
    const dx = (x2 - x1) * halfLength / wallLength;
    const dy = (y2 - y1) * halfLength / wallLength;
    
    const windowX1 = windowCenter.x - dx;
    const windowY1 = windowCenter.y - dy;
    const windowX2 = windowCenter.x + dx;
    const windowY2 = windowCenter.y + dy;
    
    const windowCenterX = (windowX1 + windowX2) / 2;
    const windowCenterY = (windowY1 + windowY2) / 2;
    
    const finalWidth = Math.sqrt(Math.pow(windowX2 - windowX1, 2) + Math.pow(windowY2 - windowY1, 2));
    const finalAngle = Math.atan2(windowY2 - windowY1, windowX2 - windowX1) * (180 / Math.PI);
    
    return (
      <>
        <div
          className={`absolute ${showInTablesMode ? 'bg-blue-100' : 'bg-white hover:bg-gray-100'} rounded-sm border-2 border-blue-300 transition-all ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""} ${isPlacing ? "opacity-70" : ""}`}
          style={{
            left: `${windowCenterX * displayCellSize * viewTransform.scale - (finalWidth * displayCellSize * viewTransform.scale) / 2 + viewTransform.translateX}px`,
            top: `${windowCenterY * displayCellSize * viewTransform.scale - 7.5 + viewTransform.translateY}px`,
            width: `${finalWidth * displayCellSize * viewTransform.scale}px`,
            height: `15px`,
            transform: `rotate(${finalAngle}deg)`,
            transformOrigin: 'center center',
            cursor: showInTablesMode ? 'default' : 'pointer',
            pointerEvents: showInTablesMode ? 'none' : 'auto',
          }}
          onClick={showInTablesMode ? undefined : onClick}
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
        className={`absolute ${showInTablesMode ? 'bg-blue-100' : 'bg-white hover:bg-gray-100'} rounded-sm border-2 border-blue-300 transition-all ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""} ${isPlacing ? "opacity-70" : ""}`}
        style={{
          left: `${windowLeft + viewTransform.translateX}px`,
          top: `${windowTop + viewTransform.translateY}px`,
          width: `${windowWidth}px`,
          height: `${windowHeight}px`,
          transform: isHorizontal ? 'translateY(-5px)' : 'translateX(-5px)',
          cursor: showInTablesMode ? 'default' : 'pointer',
          pointerEvents: showInTablesMode ? 'none' : 'auto',
        }}
        onClick={showInTablesMode ? undefined : onClick}
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

function TableComponent({ 
  table, 
  displayCellSize, 
  viewTransform, 
  isSelected, 
  onClick,
  onMouseDown,
  onContextMenu,
  showLabels,
  isDragging,
  dragOffset,
  showInViewMode = false,
  showInTablesMode = false
}: { 
  table: TableDto;
  displayCellSize: number;
  viewTransform: ViewTransform;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  showLabels: boolean;
  isDragging?: boolean;
  dragOffset?: { x: number, y: number };
  showInViewMode?: boolean;
  showInTablesMode?: boolean;
}) {
  const { 
    positionX = 0, 
    positionY = 0, 
    width = 0.8, 
    height = 0.8, 
    radius = 0.4,
    shape, 
    color, 
    name, 
    status 
  } = table;
  
  const statusColor = (showInViewMode || showInTablesMode) ? '#3B82F6' : TablesService.getStatusColor(status);
  
  const effectiveX = positionX + (dragOffset?.x || 0);
  const effectiveY = positionY + (dragOffset?.y || 0);
  
  const left = effectiveX * displayCellSize * viewTransform.scale;
  const top = effectiveY * displayCellSize * viewTransform.scale;
  const tableWidth = (shape === TableShape.CIRCLE || shape === TableShape.OVAL ? radius * 2 : width) * displayCellSize * viewTransform.scale;
  const tableHeight = (shape === TableShape.CIRCLE ? radius * 2 : height) * displayCellSize * viewTransform.scale;
  
  const tableStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${left + viewTransform.translateX - tableWidth/2}px`,
    top: `${top + viewTransform.translateY - tableHeight/2}px`,
    width: `${tableWidth}px`,
    height: `${tableHeight}px`,
    backgroundColor: color,
    border: isSelected ? `3px solid #3B82F6` : `2px solid ${color}`,
    boxShadow: isSelected ? `0 0 0 3px rgba(59, 130, 246, 0.3), 0 4px 6px rgba(0,0,0,0.1)` : 'none',
    borderRadius: shape === TableShape.CIRCLE || shape === TableShape.OVAL ? '50%' : '4px',
    cursor: showInTablesMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: isDragging ? 'none' : 'all 0.2s ease-in-out',
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : isSelected ? 10 : 1,
    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
  };
  
  if (isDragging) {
    tableStyle.boxShadow = `0 4px 12px rgba(0,0,0,0.3), 0 0 0 2px #3B82F6`;
    tableStyle.transform = 'scale(1.05)';
  }
  
  const handleClick = (e: React.MouseEvent) => {
    if (showInViewMode) return;
    e.stopPropagation();
    onClick(e);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (showInViewMode) return;
    e.stopPropagation();
    onMouseDown(e);
  };
  
    const handleContextMenu = (e: React.MouseEvent) => {
    if (showInViewMode) return;
    e.stopPropagation();
    e.preventDefault();
    onContextMenu(e);
  };
  return (
    <>
      <div 
        style={tableStyle}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        className="hover:opacity-90 transition-all duration-200"
      >
        {showLabels && (
          <div className="text-xs font-semibold text-center text-white drop-shadow-md" style={{ lineHeight: 1 }}>
            {name}
          </div>
        )}
        {!showLabels && (
          <div className="text-xs text-white font-semibold">
            {name.charAt(0)}
          </div>
        )}
        
        {isSelected && !isDragging && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </div>
      
      {isSelected && !showInTablesMode && !isDragging && (
        <div
          className="absolute bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none animate-pulse"
          style={{
            left: `${left + viewTransform.translateX}px`,
            top: `${top + viewTransform.translateY - tableHeight/2 - 35}px`,
            transform: 'translateX(-50%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {name} <span className="ml-1 opacity-75">✓</span>
        </div>
      )}
    </>
  );
}

function TableDialog({ 
  open, 
  onOpenChange, 
  table, 
  hallId, 
  onSave,
  tableTags,
  isSaving,
  newTablePosition 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableDto | null;
  hallId: string;
  onSave: (table: TableDto) => void;
  tableTags: TableTagDto[];
  isSaving: boolean;
    newTablePosition?: { x: number; y: number } | null; 
}) {
  const [formData, setFormData] = useState({
    name: table?.name || '',
    description: table?.description || '',
    seats: table?.seats || 4,
    shape: table?.shape || TableShape.RECTANGLE,
    status: table?.status || TableStatus.AVAILABLE,
   positionX: table?.positionX || newTablePosition?.x || 5, 
    positionY: table?.positionY || newTablePosition?.y || 5, 
    width: table?.width || 0.8,
    height: table?.height || 0.8,
    radius: table?.radius || 0.4,
    color: table?.color || '#3B82F6',
    tagIds: table?.tags?.map(tag => tag.id) || [],
  });
    useEffect(() => {
      if (newTablePosition && !table) {
        setFormData(prev => ({
          ...prev,
          positionX: newTablePosition.x,
          positionY: newTablePosition.y,
        }));
      }
    }, [newTablePosition, table]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tableData: any = {
      ...formData,
      hallId,
      order: 0,
    };
    
    if (table) {
      tableData.id = table.id;
    }
    
    onSave(tableData);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentExtraWide className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {table ? 'Редактирование стола' : 'Создание нового стола'}
          </DialogTitle>
          <DialogDescription>
            {table ? 'Измените параметры стола' : 'Заполните параметры нового стола'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название стола</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seats">Количество мест</Label>
                <Input
                  id="seats"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.seats}
                  onChange={(e) => setFormData({...formData, seats: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Форма стола</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.shape === TableShape.RECTANGLE ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({...formData, shape: TableShape.RECTANGLE})}
                  className="flex-1"
                >
                  <RectangleHorizontal className="h-4 w-4 mr-2" />
                  Прямоугольный
                </Button>
                <Button
                  type="button"
                  variant={formData.shape === TableShape.SQUARE ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({...formData, shape: TableShape.SQUARE})}
                  className="flex-1"
                >
                  <SquareShape className="h-4 w-4 mr-2" />
                  Квадратный
                </Button>
                <Button
                  type="button"
                  variant={formData.shape === TableShape.CIRCLE ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({...formData, shape: TableShape.CIRCLE})}
                  className="flex-1"
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Круглый
                </Button>
                <Button
                  type="button"
                  variant={formData.shape === TableShape.OVAL ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({...formData, shape: TableShape.OVAL})}
                  className="flex-1"
                >
                  <Egg className="h-4 w-4 mr-2" />
                  Овальный
                </Button>
              </div>
            </div>
            
            {(formData.shape === TableShape.RECTANGLE || formData.shape === TableShape.SQUARE) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Ширина (м)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    min="0.3"
                    max="3"
                    value={formData.width}
                    onChange={(e) => setFormData({...formData, width: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Длина (м)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0.3"
                    max="3"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            )}
            
            {(formData.shape === TableShape.CIRCLE || formData.shape === TableShape.OVAL) && (
              <div className="space-y-2">
                <Label htmlFor="radius">Радиус (м)</Label>
                <Input
                  id="radius"
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="2"
                  value={formData.radius}
                  onChange={(e) => setFormData({...formData, radius: parseFloat(e.target.value)})}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="color">Цвет стола</Label>
              <div className="flex gap-2">
                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-800' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({...formData, color})}
                  />
                ))}
                <div className="relative">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-12 h-8 p-1"
                  />
                </div>
              </div>
            </div>
            
            {tableTags.length > 0 && (
              <div className="space-y-2">
                <Label>Теги стола</Label>
                <div className="flex flex-wrap gap-2">
                  {tableTags.map(tag => (
                    <Badge
                      key={tag.id}
                      variant={formData.tagIds.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={formData.tagIds.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                      onClick={() => {
                        const newTagIds = formData.tagIds.includes(tag.id)
                          ? formData.tagIds.filter(id => id !== tag.id)
                          : [...formData.tagIds, tag.id];
                        setFormData({...formData, tagIds: newTagIds});
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : table ? 'Сохранить изменения' : 'Создать стол'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContentExtraWide>
    </Dialog>
  );
}

function CombineTablesDialog({
  open,
  onOpenChange,
  tables,
  selectedTableIds,
  onCombine,
  isCombining
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: TableDto[];
  selectedTableIds: string[];
  onCombine: (data: any) => void;
  isCombining: boolean;
}) {
  const [formData, setFormData] = useState({
    combinedTableName: `Стол ${Math.floor(Math.random() * 100)}`,
    keepOriginalTables: false,
  });
  
  const selectedTables = tables.filter(table => selectedTableIds.includes(table.id));
  const totalSeats = selectedTables.reduce((sum, table) => sum + table.seats, 0);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTableIds.length < 2) {
      toast.error('Выберите хотя бы два стола для объединения');
      return;
    }
    
    const mainTableId = selectedTableIds[0];
    const otherTableIds = selectedTableIds.slice(1);
    
    onCombine({
      mainTableId,
      tableIds: otherTableIds,
      combinedTableName: formData.combinedTableName,
      keepOriginalTables: formData.keepOriginalTables,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Объединение столов</DialogTitle>
          <DialogDescription>
            Объедините выбранные столы в один большой стол
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="combinedTableName">Название объединенного стола</Label>
              <Input
                id="combinedTableName"
                value={formData.combinedTableName}
                onChange={(e) => setFormData({...formData, combinedTableName: e.target.value})}
                placeholder="Введите название"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Выбранные столы ({selectedTables.length})</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                {selectedTables.map(table => (
                  <div key={table.id} className="flex items-center justify-between py-1">
                    <span className="text-sm">{table.name} ({table.seats} мест)</span>
                    <Badge variant="outline" style={{ backgroundColor: table.color, color: '#fff' }}>
                      {TablesService.getStatusLabel(table.status)}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                Общее количество мест после объединения: <strong>{totalSeats}</strong>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="keepOriginalTables"
                checked={formData.keepOriginalTables}
                onCheckedChange={(checked) => setFormData({...formData, keepOriginalTables: checked})}
              />
              <Label htmlFor="keepOriginalTables">
                Сохранить оригинальные столы (скрыть из вида)
              </Label>
            </div>
            
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              <strong>Внимание:</strong> После объединения оригинальные столы будут скрыты из общего вида, 
              но останутся в системе для разделения в будущем.
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isCombining || selectedTableIds.length < 2}>
              {isCombining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Объединение...
                </>
              ) : 'Объединить столы'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TableTagsDialog({
  open,
  onOpenChange,
  tags,
  restaurantId,
  onSaveTag,
  onDeleteTag,
  isSaving
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TableTagDto[];
  restaurantId: string;
  onSaveTag: (tag: TableTagDto | CreateTableTagDto) => void;
  onDeleteTag: (tagId: string) => void;
  isSaving: boolean;
}) {
  const [editingTag, setEditingTag] = useState<TableTagDto | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });
  
  const resetForm = () => {
    setEditingTag(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Введите название тега');
      return;
    }
    
    const tagData: any = {
      ...formData,
      restaurantId,
      order: tags.length,
    };
    
    if (editingTag) {
      tagData.id = editingTag.id;
    }
    
    onSaveTag(tagData);
    resetForm();
  };
  
  const handleEdit = (tag: TableTagDto) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Управление тегами столов</DialogTitle>
          <DialogDescription>
            Создавайте и редактируйте теги для категоризации столов
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tagName">Название тега</Label>
            <Input
              id="tagName"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Например: У окна, VIP, Семейный"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tagDescription">Описание (необязательно)</Label>
            <Textarea
              id="tagDescription"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Описание тега"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Цвет тега</Label>
            <div className="flex gap-2">
              {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280', '#000000'].map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-800' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({...formData, color})}
                />
              ))}
              <div className="relative">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-12 h-8 p-1"
                />
              </div>
            </div>
          </div>
          
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : editingTag ? 'Сохранить изменения' : 'Создать тег'}
          </Button>
        </form>
        
        <div className="space-y-2">
          <Label>Существующие теги</Label>
          <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
            {tags.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Нет созданных тегов
              </div>
            ) : (
              tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                    {tag.description && (
                      <span className="text-xs text-gray-500">{tag.description}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tag)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteTag(tag.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RoomDesignerPage() {

  
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  
  const [halls, setHalls] = useState<Hall[]>([]);
  const [currentHall, setCurrentHall] = useState<Hall | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingHall, setIsCreatingHall] = useState(false);
  const [showCreateHallDialog, setShowCreateHallDialog] = useState(false);
  const [newHallTitle, setNewHallTitle] = useState("");
  const [newHallDescription, setNewHallDescription] = useState("");
  
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [tables, setTables] = useState<TableDto[]>([]);
  const [tableTags, setTableTags] = useState<TableTagDto[]>([]);
  
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedDoorId, setSelectedDoorId] = useState<string | null>(null);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  
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
    snapToTables: true,
    showTableLabels: true,
  });
  
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("table");
  const [viewMode, setViewMode] = useState<ViewMode>("tables");
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
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);
  
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableDto | null>(null);
  const [combineDialogOpen, setCombineDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [isTableSaving, setIsTableSaving] = useState(false);
  const [isCombiningTables, setIsCombiningTables] = useState(false);
  const [isTagSaving, setIsTagSaving] = useState(false);
  
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [newTablePosition, setNewTablePosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (restaurantId) {
      loadHalls();
      loadTableTags();
    }
  }, [restaurantId]);

  const loadHalls = async () => {
    try {
      setIsLoading(true);
      const hallsData = await TablesService.getHallsByRestaurant(restaurantId, true);
      setHalls(hallsData);
      
      if (hallsData.length > 0) {
        await loadHallLayout(hallsData[0].id);
      } else {
        setCurrentHall(null);
        resetEditorState();
      }
    } catch (error) {
      console.error('Ошибка при загрузке залов:', error);
      toast.error('Не удалось загрузить залы');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTableTags = async () => {
    try {
      const tags = await TablesService.getTableTagsByRestaurant(restaurantId);
      setTableTags(tags);
    } catch (error) {
      console.error('Ошибка при загрузке тегов:', error);
    }
  };

  const loadHallLayout = async (hallId: string) => {
    try {
      setIsLoading(true);
      const hall = await TablesService.getHallLayout(hallId);
      
      setCurrentHall(hall);
      
      const editorData = TablesService.convertDtoToEditorData(hall);
      
      setWalls(editorData.walls.map((wall, index) => ({
        ...wall,
        order: index,
        thickness: wall.thickness || 0.2,
        color: wall.color || '#4B5563',
      })));
      
      setDoors(editorData.doors.map((door, index) => ({
        id: door.id,
        wallId: door.wallId,
        position: door.x,
        width: door.width,
        offset: door.x,
        isPlacing: false,
        orientation: door.orientation,
        angle: door.angle,
        height: door.height || 2.0,
        color: door.color || '#92400E',
        order: index,
      })));
      
      setWindows(editorData.windows.map((window, index) => ({
        id: window.id,
        wallId: window.wallId,
        position: window.x,
        width: window.width,
        offset: window.x,
        isPlacing: false,
        orientation: window.orientation,
        angle: window.angle,
        height: window.height || 1.2,
        color: window.color || '#1E40AF',
        order: index,
      })));
      
      setGuides(editorData.guides.map((guide, index) => ({
        ...guide,
        order: index,
        color: guide.color || '#7C3AED',
      })));
      
      const tablesResponse = await TablesService.getTables({ hallId });
      setTables(tablesResponse.data);
      
      setSelectedWallId(null);
      setSelectedDoorId(null);
      setSelectedWindowId(null);
      setSelectedGuideId(null);
      setSelectedTableIds([]);
      
    } catch (error) {
      console.error('Ошибка при загрузке планировки:', error);
      toast.error('Не удалось загрузить планировку зала');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewHall = async () => {
    if (!newHallTitle.trim()) {
      toast.error('Введите название зала');
      return;
    }

    try {
      setIsCreatingHall(true);
      
      const createHallDto: CreateHallDto = {
        title: newHallTitle,
        description: newHallDescription,
        color: '#3B82F6',
        order: halls.length,
        restaurantId: restaurantId,
      };

      const newHall = await TablesService.createHall(createHallDto);
      
      toast.success('Зал успешно создан');
      
      const updatedHalls = await TablesService.getHallsByRestaurant(restaurantId, true);
      setHalls(updatedHalls);
      
      await loadHallLayout(newHall.id);
      
      setShowCreateHallDialog(false);
      setNewHallTitle('');
      setNewHallDescription('');
      
    } catch (error) {
      console.error('Ошибка при создании зала:', error);
      toast.error('Не удалось создать зал');
    } finally {
      setIsCreatingHall(false);
    }
  };

  const saveHallLayout = async () => {
    if (!currentHall) {
      toast.error('Выберите зал для сохранения');
      return;
    }

    try {
      setIsSaving(true);
      
      const layoutData = TablesService.convertEditorDataToDto(currentHall.id, {
        walls,
        doors,
        windows,
        guides,
      });

      await TablesService.saveHallLayout(currentHall.id, layoutData);
      
      toast.success('Планировка успешно сохранена');
      
    } catch (error) {
      console.error('Ошибка при сохранении планировки:', error);
      toast.error('Не удалось сохранить планировку');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteHall = async (hallId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот зал? Все данные будут потеряны.')) {
      return;
    }

    try {
      await TablesService.deleteHall(hallId);
      toast.success('Зал удален');
      
      await loadHalls();
      
    } catch (error) {
      console.error('Ошибка при удалении зала:', error);
      toast.error('Не удалось удалить зал');
    }
  };

  const handleCreateTable = async (tableData: any) => {
    try {
      setIsTableSaving(true);
      
      const createTableDto: CreateTableDto = {
        name: tableData.name,
        description: tableData.description,
        seats: tableData.seats,
        shape: tableData.shape,
        status: tableData.status,
        positionX: tableData.positionX,
        positionY: tableData.positionY,
        width: tableData.width,
        height: tableData.height,
        radius: tableData.radius,
        color: tableData.color,
        hallId: tableData.hallId,
        tagIds: tableData.tagIds,
      };
      
      const newTable = await TablesService.createTable(createTableDto);
      
      setTables(prev => [...prev, newTable]);
      setSelectedTableIds([newTable.id]);
      setTableDialogOpen(false);
      setNewTablePosition(null)
      toast.success('Стол успешно создан');
      
    } catch (error) {
      console.error('Ошибка при создании стола:', error);
      toast.error('Не удалось создать стол');
    } finally {
      setIsTableSaving(false);
    }
  };

  const handleUpdateTable = async (tableData: any) => {
    try {
      setIsTableSaving(true);
      
      const updateTableDto: UpdateTableDto = {
        name: tableData.name,
        description: tableData.description,
        seats: tableData.seats,
        status: tableData.status,
        positionX: tableData.positionX,
        positionY: tableData.positionY,
        width: tableData.width,
        height: tableData.height,
        radius: tableData.radius,
        color: tableData.color,
        tagIds: tableData.tagIds,
      };
      
      const updatedTable = await TablesService.updateTable(tableData.id, updateTableDto);
      
      setTables(prev => prev.map(table => 
        table.id === tableData.id ? updatedTable : table
      ));
      setTableDialogOpen(false);
      setEditingTable(null);
      
      
    } catch (error) {
      console.error('Ошибка при обновлении стола:', error);
      toast.error('Не удалось обновить стол');
    } finally {
      setIsTableSaving(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот стол?')) {
      return;
    }

    try {
      await TablesService.deleteTable(tableId);
      
      setTables(prev => prev.filter(table => table.id !== tableId));
      setSelectedTableIds(prev => prev.filter(id => id !== tableId));
      
      toast.success('Стол удален');
      
    } catch (error) {
      console.error('Ошибка при удалении стола:', error);
      toast.error('Не удалось удалить стол');
    }
  };

  const handleCombineTables = async (combineData: any) => {
    try {
      setIsCombiningTables(true);
      
      const combinedTable = await TablesService.combineTables(combineData);
      
      const tablesResponse = await TablesService.getTables({ hallId: currentHall!.id });
      
      setTables(tablesResponse.data);
      
      setSelectedTableIds([combinedTable.id]);
      setCombineDialogOpen(false);
      
      toast.success('Столы успешно объединены');
      
    } catch (error) {
      console.error('Ошибка при объединении столов:', error);
      toast.error('Не удалось объединить столы');
    } finally {
      setIsCombiningTables(false);
    }
  };

  const handleSeparateTables = async (combinedTableId: string) => {
    if (!confirm('Вы уверены, что хотите разделить объединенный стол?')) {
      return;
    }

    try {
      const separatedTables = await TablesService.separateTables(combinedTableId);
      
      const tablesResponse = await TablesService.getTables({ hallId: currentHall!.id });
      setTables(tablesResponse.data);
      
      setSelectedTableIds([]);
      
      toast.success('Стол успешно разделен');
      
    } catch (error) {
      console.error('Ошибка при разделении столов:', error);
      toast.error('Не удалось разделить стол');
    }
  };

  const handleSaveTableTag = async (tagData: any) => {
    try {
      setIsTagSaving(true);
      
      let savedTag: TableTagDto;
      
      if (tagData.id) {
        const updateTagDto = {
          name: tagData.name,
          description: tagData.description,
          color: tagData.color,
        };
        savedTag = await TablesService.updateTableTag(tagData.id, updateTagDto);
      } else {
        const createTagDto: CreateTableTagDto = {
          name: tagData.name,
          description: tagData.description,
          color: tagData.color,
          restaurantId,
        };
        savedTag = await TablesService.createTableTag(createTagDto);
      }
      
      await loadTableTags();
      
      toast.success('Тег успешно сохранен');
      
    } catch (error) {
      console.error('Ошибка при сохранении тега:', error);
      toast.error('Не удалось сохранить тег');
    } finally {
      setIsTagSaving(false);
    }
  };

  const handleDeleteTableTag = async (tagId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот тег?')) {
      return;
    }

    try {
      await TablesService.deleteTableTag(tagId);
      
      await loadTableTags();
      
      toast.success('Тег удален');
      
    } catch (error) {
      console.error('Ошибка при удалении тега:', error);
      toast.error('Не удалось удалить тег');
    }
  };

  const resetEditorState = () => {
    setWalls([]);
    setDoors([]);
    setWindows([]);
    setGuides([]);
    setTables([]);
    setSelectedWallId(null);
    setSelectedDoorId(null);
    setSelectedWindowId(null);
    setSelectedGuideId(null);
    setSelectedTableIds([]);
    setCurrentWallStart(null);
    setIsDrawing(false);
    setTempWallEnd(null);
    setSnapIndicator(null);
    setPlacingDoor({ wallId: null, offset: 0, isPlacing: false });
    setPlacingWindow({ wallId: null, offset: 0, isPlacing: false });
  };

  const findSnapPoint = useCallback((x: number, y: number): SnapPoint | null => {
    const snapRadius = gridSettings.snapGridSize / gridSettings.displayCellSize;
    let nearestSnap: SnapPoint | null = null;
    let minDistance = Infinity;
    
    if (gridSettings.snapToWalls && walls && walls.length > 0 && viewMode !== "tables") {
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
    
    if (gridSettings.snapToGuides && guides && guides.length > 0 && viewMode !== "tables") {
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
    
    if (gridSettings.snapToTables && tables && tables.length > 0 && viewMode === "tables") {
      tables.forEach(table => {
        const point = {
          x: table.positionX || 0,
          y: table.positionY || 0,
          type: 'table' as const,
        };
        
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        if (distance < snapRadius && distance < minDistance) {
          minDistance = distance;
          nearestSnap = {
            x: point.x,
            y: point.y,
            type: 'table',
            tableId: table.id,
          };
        }
      });
    }
    
    return nearestSnap;
  }, [walls, guides, tables, gridSettings.snapToWalls, gridSettings.snapToGuides, gridSettings.snapToTables, gridSettings.snapGridSize, gridSettings.displayCellSize, viewMode]);

  const findNearestWall = useCallback((x: number, y: number, maxDistance: number = 1.0) => {
    if (!walls || walls.length === 0) {
      return { wall: null, point: 0, distance: maxDistance };
    }
    
    let nearestWall: WallSegment | null = null;
    let minDistance = maxDistance;
    let nearestPointOnWall: number = 0;
    
    walls.forEach(wall => {
      const { x1, y1, x2, y2, isHorizontal, isDiagonal } = wall;
      
      if (isDiagonal) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const wallLength = Math.sqrt(dx * dx + dy * dy);
        
        if (wallLength === 0) return;
        
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

  const getGridCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const rawGridX = (x - viewTransform.translateX) / (gridSettings.displayCellSize * viewTransform.scale);
    const rawGridY = (y - viewTransform.translateY) / (gridSettings.displayCellSize * viewTransform.scale);
    
    if ((gridSettings.snapToWalls || gridSettings.snapToGuides || gridSettings.snapToTables) && viewMode === "edit") {
      const snapPoint = findSnapPoint(rawGridX, rawGridY);
      if (snapPoint) {
        setSnapIndicator({ x: snapPoint.x, y: snapPoint.y, type: snapPoint.type });
        return { x: snapPoint.x, y: snapPoint.y };
      }
    }
    
    if (gridSettings.snapToGrid && viewMode === "tables") {
      const snapFactor = gridSettings.displayCellSize / gridSettings.snapGridSize;
      return {
        x: Math.round(rawGridX * snapFactor) / snapFactor,
        y: Math.round(rawGridY * snapFactor) / snapFactor,
      };
    }
    
    setSnapIndicator(null);
    
    if (gridSettings.snapToGrid && (viewMode === "edit" || viewMode === "tables")) {
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
  }, [viewTransform, gridSettings.displayCellSize, gridSettings.snapGridSize, gridSettings.snapToGrid, gridSettings.snapToWalls, gridSettings.snapToGuides, gridSettings.snapToTables, viewMode, findSnapPoint]);

  const startDrawingWall = (gridX: number, gridY: number) => {
    if (viewMode === "edit" && (drawingMode === "wall" || drawingMode === "guide")) {
      setCurrentWallStart({ x: gridX, y: gridY });
      setIsDrawing(true);
      setTempWallEnd({ x: gridX, y: gridY });
    }
  };

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
          height: 2.0,
          color: '#92400E',
          order: doors.length,
        };
        
        setDoors(prev => [...prev, newDoor]);
        setSelectedDoorId(newDoor.id);
        setSelectedWindowId(null);
        setSelectedGuideId(null);
        setSelectedTableIds([]);
      }
    }
  };

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
          height: 1.2,
          color: '#1E40AF',
          order: windows.length,
        };
        
        setWindows(prev => [...prev, newWindow]);
        setSelectedWindowId(newWindow.id);
        setSelectedDoorId(null);
        setSelectedGuideId(null);
        setSelectedTableIds([]);
      }
    }
  };

  const startDraggingTable = (gridX: number, gridY: number, tableId: string) => {
    if (viewMode === "tables" && drawingMode === "select") {
      setDraggingTableId(tableId);
      setDragStart({ x: gridX, y: gridY });
      setDragOffset({ x: 0, y: 0 });
      
      if (!selectedTableIds.includes(tableId)) {
        setSelectedTableIds([tableId]);
      }
    }
  };

  const updateDoorPosition = (gridX: number, gridY: number) => {
    if (placingDoor.isPlacing && placingDoor.wallId && viewMode === "edit") {
      const wall = walls.find(w => w.id === placingDoor.wallId);
      if (!wall) return;
      
      const { point } = findNearestWall(gridX, gridY, 2.0);
      const offset = point * wall.length;
      
      setDoors(prev => prev.map(door => 
        door.isPlacing 
          ? { ...door, position: point, offset: offset }
          : door
      ));
    }
  };

  const updateWindowPosition = (gridX: number, gridY: number) => {
    if (placingWindow.isPlacing && placingWindow.wallId && viewMode === "edit") {
      const wall = walls.find(w => w.id === placingWindow.wallId);
      if (!wall) return;
      
      const { point } = findNearestWall(gridX, gridY, 2.0);
      const offset = point * wall.length;
      
      setWindows(prev => prev.map(window => 
        window.isPlacing 
          ? { ...window, position: point, offset: offset }
          : window
      ));
    }
  };

  const updateDraggingTable = (gridX: number, gridY: number) => {
    if (draggingTableId && viewMode === "tables") {
      const deltaX = gridX - dragStart.x;
      const deltaY = gridY - dragStart.y;
      
      setDragOffset({ x: deltaX, y: deltaY });
    }
  };

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

  const finishDraggingTable = (gridX: number, gridY: number) => {
    if (draggingTableId && viewMode === "tables") {
      const table = tables.find(t => t.id === draggingTableId);
      if (!table) return;
      
      let newX = (table.positionX || 0) + dragOffset.x;
      let newY = (table.positionY || 0) + dragOffset.y;
      
      if (gridSettings.snapToGrid) {
        const snapFactor = gridSettings.displayCellSize / gridSettings.snapGridSize;
        newX = Math.round(newX * snapFactor) / snapFactor;
        newY = Math.round(newY * snapFactor) / snapFactor;
      }
      
      handleUpdateTable({
        ...table,
        positionX: newX,
        positionY: newY,
      });
      
      setDraggingTableId(null);
      setDragOffset({ x: 0, y: 0 });
    }
  };

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
    if (draggingTableId && viewMode === "tables") {
      updateDraggingTable(gridX, gridY);
    }
  };

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
          thickness: 0.2,
          color: '#4B5563',
          order: walls.length,
        };
        
        setWalls([...walls, newWall]);
        setSelectedWallId(newWall.id);
        setSelectedGuideId(null);
        setSelectedTableIds([]);
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
          color: '#7C3AED',
          order: guides.length,
        };
        
        setGuides([...guides, newGuide]);
        setSelectedGuideId(newGuide.id);
        setSelectedWallId(null);
        setSelectedTableIds([]);
      }
      
      setCurrentWallStart(null);
      setIsDrawing(false);
      setTempWallEnd(null);
      setSnapIndicator(null);
    }
  };

  const handleTableClick = (e: React.MouseEvent, tableId: string) => {
    if (viewMode === "tables" && drawingMode === "select") {
      if (!e.ctrlKey && !e.metaKey) {
        const { x: gridX, y: gridY } = getGridCoordinates(e.clientX, e.clientY);
        startDraggingTable(gridX, gridY, tableId);
      }
    }
  };

  const handleTableContextMenu = (e: React.MouseEvent, tableId: string) => {
    if (viewMode === "tables" && drawingMode === "select") {
      e.preventDefault();
      
      if (e.ctrlKey || e.metaKey) {
        setSelectedTableIds(prev => 
          prev.includes(tableId)
            ? prev.filter(id => id !== tableId)
            : [...prev, tableId]
        );
      } else {
        setSelectedTableIds([tableId]);
      }
      
      setSelectedWallId(null);
      setSelectedDoorId(null);
      setSelectedWindowId(null);
      setSelectedGuideId(null);
    }
  };

  const handleGridClick = (e: React.MouseEvent) => {
    if (isRightMouseDown || isPanning || viewMode === "view") return;
    
    const { x: gridX, y: gridY } = getGridCoordinates(e.clientX, e.clientY);
    
    if (viewMode === "tables" && drawingMode === "table") {
       let maxTableNumber = 0;
    tables.forEach(table => {
      const match = table.name.match(/^Стол\s*(\d+)$/i) || table.name.match(/^(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxTableNumber) maxTableNumber = num;
      }
    });
    
    const nextTableNumber = maxTableNumber + 1;
    const defaultTableName = nextTableNumber.toString();

      const newTableData = {
          name: defaultTableName,
        seats: 4,
        shape: TableShape.RECTANGLE,
        status: TableStatus.AVAILABLE,
        positionX: gridX,
        positionY: gridY,
        width: 0.8,
        height: 0.8,
        radius: 0.4,
        color: '#3B82F6',
        hallId: currentHall?.id,
        tagIds: [],
      };
         setNewTablePosition({ x: gridX, y: gridY });
      setEditingTable(null);
      setTableDialogOpen(true);
      return;
    }
    
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
      setSelectedTableIds([]);
    }
  };

  const handleTableMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (viewMode === "tables" && drawingMode === "select" && e.button === 0) {
      e.stopPropagation();
      const { x: gridX, y: gridY } = getGridCoordinates(e.clientX, e.clientY);
      startDraggingTable(gridX, gridY, tableId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x: gridX, y: gridY } = getGridCoordinates(e.clientX, e.clientY);
    
    if (viewMode === "edit" || viewMode === "tables") {
      updateTempWall(gridX, gridY);
    }
    
    if (isRightMouseDown && !isDrawing && !placingDoor.isPlacing && !placingWindow.isPlacing && !draggingTableId) {
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) {
      setIsRightMouseDown(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
    
    if (e.button === 0) {
      if ((drawingMode !== "wall" && !isDrawing && !placingDoor.isPlacing && !placingWindow.isPlacing && !draggingTableId) || viewMode === "view") {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        e.preventDefault();
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 2) {
      setIsRightMouseDown(false);
    }
    if (e.button === 0) {
      setIsPanning(false);
    }
    
    if (draggingTableId && viewMode === "tables") {
      const { x: gridX, y: gridY } = getGridCoordinates(e.clientX, e.clientY);
      finishDraggingTable(gridX, gridY);
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomIntensity = 0.1;
    const newScale = e.deltaY > 0 
      ? Math.max(0.1, viewTransform.scale - zoomIntensity)
      : Math.min(30, viewTransform.scale + zoomIntensity);
    
    const scaleChange = newScale / viewTransform.scale;
    
    setViewTransform(prev => ({
      scale: newScale,
      translateX: mouseX - (mouseX - prev.translateX) * scaleChange,
      translateY: mouseY - (mouseY - prev.translateY) * scaleChange,
    }));
  }, [viewTransform]);

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
    if (draggingTableId) {
      setDraggingTableId(null);
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const deleteSelectedWall = () => {
    if (selectedWallId && viewMode === "edit") {
      setDoors(doors.filter(door => door.wallId !== selectedWallId));
      setWindows(windows.filter(window => window.wallId !== selectedWallId));
      setWalls(walls.filter(wall => wall.id !== selectedWallId));
      setSelectedWallId(null);
    }
  };

  const deleteSelectedDoor = () => {
    if (selectedDoorId && viewMode === "edit") {
      setDoors(doors.filter(door => door.id !== selectedDoorId));
      setSelectedDoorId(null);
    }
  };

  const deleteSelectedWindow = () => {
    if (selectedWindowId && viewMode === "edit") {
      setWindows(windows.filter(window => window.id !== selectedWindowId));
      setSelectedWindowId(null);
    }
  };

  const deleteSelectedGuide = () => {
    if (selectedGuideId && viewMode === "edit") {
      setGuides(guides.filter(guide => guide.id !== selectedGuideId));
      setSelectedGuideId(null);
    }
  };

  const deleteSelectedTables = () => {
    if (selectedTableIds.length > 0 && viewMode === "tables") {
      if (confirm(`Удалить ${selectedTableIds.length} выбранных столов?`)) {
        selectedTableIds.forEach(tableId => {
          handleDeleteTable(tableId);
        });
      }
    }
  };

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

  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    
    if (mode === "edit") {
      setDrawingMode("wall");
    } else if (mode === "tables") {
      setDrawingMode("select");
    } else {
      setDrawingMode("select");
    }
    
    cancelDrawing();
    setSelectedWallId(null);
    setSelectedDoorId(null);
    setSelectedWindowId(null);
    setSelectedGuideId(null);
    setSelectedTableIds([]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isDrawing || placingDoor.isPlacing || placingWindow.isPlacing || draggingTableId)) {
        cancelDrawing();
      }
      
      if (e.key === 'a' && e.ctrlKey && viewMode === "tables") {
        e.preventDefault();
        setSelectedTableIds(tables.map(table => table.id));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, placingDoor.isPlacing, placingWindow.isPlacing, draggingTableId, viewMode, tables]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

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

  const getCursor = () => {
    if (isRightMouseDown) return 'grabbing';
    if (isPanning) return 'grabbing';
    if (viewMode === "view") return 'grab';
    if (draggingTableId) return 'grabbing';
    if (drawingMode === "door" || drawingMode === "window" || drawingMode === "guide" || drawingMode === "table") return 'crosshair';
    if (isDrawing) return 'crosshair';
    if (viewMode === "tables") return 'default';
    return 'crosshair';
  };

  const selectedTable = selectedTableIds.length === 1 ? tables.find(t => t.id === selectedTableIds[0]) : null;
  const isCombinedTable = selectedTable ? TablesService.isCombinedTable(selectedTable) : false;

const getTablesToDisplay = () => {
  if (viewMode === "view") {
    return tables.filter(table => 
      !table.isHidden
    );
  }
  return tables;
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-900">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      
      <div className="flex flex-col gap-4">
        <div className="border rounded-lg bg-white">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Залы ресторана</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateHallDialog(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Создать зал
                </Button>
                {currentHall && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={saveHallLayout}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Сохранить
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {halls.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Нет созданных залов</p>
                <Button onClick={() => setShowCreateHallDialog(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Создать первый зал
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {halls.map(hall => (
                  <Button
                    key={hall.id}
                    variant={currentHall?.id === hall.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => loadHallLayout(hall.id)}
                    className="relative group"
                  >
                    {hall.title}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHall(hall.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {showCreateHallDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Создать новый зал</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateHallDialog(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div >
                  <Label className='mb-2' htmlFor="hallTitle">Название зала</Label>
                  <Input
                    id="hallTitle"
                    value={newHallTitle}
                    onChange={(e) => setNewHallTitle(e.target.value)}
                    placeholder="Например: Основной зал, Терраса, Летняя веранда"
                  />
                </div>
                
                <div>
                  <Label className='mb-2' htmlFor="hallDescription">Описание</Label>
                  <Input
                    id="hallDescription"
                    value={newHallDescription}
                    onChange={(e) => setNewHallDescription(e.target.value)}
                    placeholder="Описание зала (необязательно)"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateHallDialog(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={createNewHall}
                    disabled={isCreatingHall || !newHallTitle.trim()}
                  >
                    {isCreatingHall ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Создать
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Card className="w-full flex flex-row flex-wrap gap-4 p-2">
          <div className="flex items-center gap-2 border rounded-md p-1">
            <Button
              variant={viewMode === "view" ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleViewMode("view")}
              title="Режим просмотра"
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Просмотр</span>
            </Button>
            
            <Button
              variant={viewMode === "edit" ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleViewMode("edit")}
              title="Режим редактирования стен"
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Стены</span>
            </Button>
            
            <Button
              variant={viewMode === "tables" ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleViewMode("tables")}
              title="Режим работы со столами"
              className="flex items-center gap-1"
            >
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Столы</span>
            </Button>
          </div>

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
                Очистить стены
              </Button>
            </>
          )}
          
          {viewMode === "tables" && (
            <>
              <Button
                variant={drawingMode === "table" ? "default" : "outline"}
                onClick={() => setDrawingMode("table")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить стол
              </Button>
              <Button
                variant={drawingMode === "select" ? "default" : "outline"}
                onClick={() => setDrawingMode("select")}
              >
                <MousePointer className="h-4 w-4 mr-2" />
                Выбор
              </Button>
              
              {selectedTableIds.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const table = tables.find(t => t.id === selectedTableIds[0]);
                      if (table) {
                        setEditingTable(table);
                        setTableDialogOpen(true);
                      }
                    }}
                    disabled={selectedTableIds.length !== 1}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={deleteSelectedTables}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить ({selectedTableIds.length})
                  </Button>
                  
                  {selectedTableIds.length >= 2 && (
                    <Button
                      variant="outline"
                      onClick={() => setCombineDialogOpen(true)}
                    >
                      <Combine className="h-4 w-4 mr-2" />
                      Объединить
                    </Button>
                  )}
                  
                  {isCombinedTable && (
                    <Button
                      variant="outline"
                      onClick={() => handleSeparateTables(selectedTableIds[0])}
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Разделить
                    </Button>
                  )}
                </>
              )}
              
              <Button
                variant="outline"
                onClick={() => setTagsDialogOpen(true)}
              >
                <Tags className="h-4 w-4 mr-2" />
                Теги
              </Button>
            </>
          )}
          
          {(isDrawing || placingDoor.isPlacing || placingWindow.isPlacing || draggingTableId) && (
            <Button 
              variant="outline" 
              onClick={cancelDrawing}
            >
              Отменить {
                placingDoor.isPlacing ? "размещение двери" : 
                placingWindow.isPlacing ? "размещение окна" : 
                draggingTableId ? "перетаскивание стола" :
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
          
          {viewMode === "edit" && (
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="showGuides">Показать вспомогательные линии</Label>
              <Switch
                id="showGuides"
                checked={gridSettings.showGuides}
                onCheckedChange={(checked) => setGridSettings({...gridSettings, showGuides: checked})}
              />
            </div>
          )}
          
          {viewMode === "tables" && (
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="showTableLabels">Показать названия столов</Label>
              <Switch
                id="showTableLabels"
                checked={gridSettings.showTableLabels}
                onCheckedChange={(checked) => setGridSettings({...gridSettings, showTableLabels: checked})}
              />
            </div>
          )}
          
          {viewMode !== "view" && (
            <>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="snapToGrid">Привязка к сетке</Label>
                <Switch
                  id="snapToGrid"
                  checked={gridSettings.snapToGrid}
                  onCheckedChange={(checked) => setGridSettings({...gridSettings, snapToGrid: checked})}
                />
              </div>
              
              {viewMode === "edit" && (
                <>
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
              
              {viewMode === "tables" && (
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="snapToTables">Привязка к столам</Label>
                  <Switch
                    id="snapToTables"
                    checked={gridSettings.snapToTables}
                    onCheckedChange={(checked) => setGridSettings({...gridSettings, snapToTables: checked})}
                  />
                </div>
              )}
            </>
          )}
        </Card>
        
        <Card className="flex-1">
          <CardHeader>
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <CardTitle className="text-lg">
                  {currentHall ? `План зала: ${currentHall.title}` : 'Редактор плана'}
                </CardTitle>
                <CardDescription>
                  {viewMode === "edit" 
                    ? "Режим редактирования стен. Добавляйте стены, двери, окна и вспомогательные линии." 
                    : viewMode === "tables"
                    ? "Режим работы со столами. Добавляйте, редактируйте и расставляйте столы. ЛКМ - перемещение, ПКМ - выбор."
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
            {!currentHall ? (
              <div className="flex flex-col items-center justify-center h-[600px] border border-gray-300 rounded-md bg-gray-50">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите или создайте зал</h3>
                <p className="text-gray-600 text-center mb-6 max-w-md">
                  Для начала работы выберите существующий зал из списка выше или создайте новый
                </p>
                <Button onClick={() => setShowCreateHallDialog(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Создать новый зал
                </Button>
              </div>
            ) : (
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
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                  setIsPanning(false);
                  setIsRightMouseDown(false);
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                {gridSettings.showGuides && viewMode !== "tables" && guides.map(guide => (
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
                        setSelectedTableIds([]);
                      }
                    }}
                    viewTransform={viewTransform}
                    showGuides={gridSettings.showGuides}
                    showInTablesMode={viewMode === "tables"}
                  />
                ))}
                
                {(viewMode === "edit" || viewMode === "view" || viewMode === "tables") && walls.map(wall => (
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
                        setSelectedTableIds([]);
                      }
                    }}
                    viewTransform={viewTransform}
                    showDimensions={viewMode === "edit"}
                    showInTablesMode={viewMode === "tables"}
                  />
                ))}
                
                {(viewMode === "edit" || viewMode === "view" || viewMode === "tables") && doors.map(door => {
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
                          setSelectedTableIds([]);
                        }
                      }}
                      showDimensions={viewMode === "edit"}
                      showInTablesMode={viewMode === "tables"}
                    />
                  );
                })}
                
                {(viewMode === "edit" || viewMode === "view" || viewMode === "tables") && windows.map(windowItem => {
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
                          setSelectedTableIds([]);
                        }
                      }}
                      showDimensions={viewMode === "edit"}
                      showInTablesMode={viewMode === "tables"}
                    />
                  );
                })}
                
                {(viewMode === "tables" || viewMode === "view") && getTablesToDisplay().map(table => (
                  <TableComponent
                    key={table.id}
                    table={table}
                    displayCellSize={gridSettings.displayCellSize}
                    viewTransform={viewTransform}
                    isSelected={selectedTableIds.includes(table.id)}
                    onClick={(e) => handleTableClick(e, table.id)}
                    onMouseDown={(e) => handleTableMouseDown(e, table.id)}
                    onContextMenu={(e) => handleTableContextMenu(e, table.id)}
                    showLabels={gridSettings.showTableLabels}
                    isDragging={draggingTableId === table.id}
                    dragOffset={draggingTableId === table.id ? dragOffset : undefined}
                    showInViewMode={viewMode === "view"}
                    showInTablesMode={viewMode === "tables"}
                  />
                ))}
                
                {currentWallStart && viewMode === "edit" && (
                  <div
                    className="absolute w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow z-10"
                    style={{
                      left: `${currentWallStart.x * gridSettings.displayCellSize * viewTransform.scale + viewTransform.translateX - 6}px`,
                      top: `${currentWallStart.y * gridSettings.displayCellSize * viewTransform.scale + viewTransform.translateY - 6}px`,
                    }}
                  />
                )}
                
                {walls.length === 0 && tables.length === 0 && !isDrawing && viewMode === "edit" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center p-6 bg-white/90 rounded-lg max-w-md shadow-lg">
                      <Grid3X3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-medium text-lg mb-2">Начните проектирование</h3>
                      <p className="text-gray-600 mb-3">Добавьте первую стену, используя инструмент "Стена"</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleViewMode("tables")}
                        className="pointer-events-auto mt-2"
                      >
                        Или перейдите к расстановке столов
                      </Button>
                    </div>
                  </div>
                )}
                
                {walls.length === 0 && tables.length === 0 && viewMode === "tables" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center p-6 bg-white/90 rounded-lg max-w-md shadow-lg">
                      <Table className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-medium text-lg mb-2">Начните расстановку столов</h3>
                      <p className="text-gray-600 mb-3">Добавьте первый стол, используя инструмент "Добавить стол"</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleViewMode("edit")}
                        className="pointer-events-auto mt-2"
                      >
                        Или перейдите к проектированию стен
                      </Button>
                    </div>
                  </div>
                )}
                
                {isRightMouseDown && (
                  <div className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <Move className="h-4 w-4 animate-pulse" />
                    Панорамирование (правая кнопка мыши)...
                  </div>
                )}
                
                {!isRightMouseDown && (
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm flex items-center gap-2 ${viewMode === "edit" ? "bg-blue-600 text-white" : viewMode === "tables" ? "bg-green-600 text-white" : "bg-gray-600 text-white"}`}>
                    {viewMode === "edit" ? <Edit className="h-4 w-4" /> : 
                     viewMode === "tables" ? <Table className="h-4 w-4" /> : 
                     <Eye className="h-4 w-4" />}
                    {viewMode === "edit" ? "Режим стен" : 
                     viewMode === "tables" ? "Режим столов" : 
                     "Режим просмотра"}
                  </div>
                )}
                
                {currentHall && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                    Зал: {currentHall.title}
                  </div>
                )}
                
                {viewMode === "tables" && selectedTableIds.length > 0 && (
                  <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-md text-sm">
                    Выбрано столов: {selectedTableIds.length}
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm">
                {(viewMode === "edit" || viewMode === "view" || viewMode === "tables") && (
                  <>
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
                    {gridSettings.showGuides && viewMode !== "tables" && (
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-1 border-t-2 border-dashed border-purple-500"></div>
                        <span>Вспом. линия</span>
                      </div>
                    )}
                  </>
                )}
                
                {(viewMode === "tables" || viewMode === "view") && (
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-blue-500 rounded border-2 border-blue-700"></div>
                    <span>Стол</span>
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
                  </>
                )}
              </div>
              
              {currentHall && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveHallLayout}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Сохранить планировку
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TableDialog
        open={tableDialogOpen}
         onOpenChange={(open) => {
          setTableDialogOpen(open);
          if (!open) {
            setNewTablePosition(null); 
          }
        }}
        table={editingTable}
        hallId={currentHall?.id || ''}
        onSave={editingTable ? handleUpdateTable : handleCreateTable}
        tableTags={tableTags}
        isSaving={isTableSaving}
         newTablePosition={newTablePosition}
      />
      
      <CombineTablesDialog
        open={combineDialogOpen}
        onOpenChange={setCombineDialogOpen}
        tables={tables}
        selectedTableIds={selectedTableIds}
        onCombine={handleCombineTables}
        isCombining={isCombiningTables}
      />
      
      <TableTagsDialog
        open={tagsDialogOpen}
        onOpenChange={setTagsDialogOpen}
        tags={tableTags}
        restaurantId={restaurantId}
        onSaveTag={handleSaveTableTag}
        onDeleteTag={handleDeleteTableTag}
        isSaving={isTagSaving}
      />
    </div>
  );
}