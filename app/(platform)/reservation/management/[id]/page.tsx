//@ts-nocheck

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Filter, 
  Search, 
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Eye,
  EyeOff,
  Table as TableIcon,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Plus,
  Move,
  Lock,
  Unlock,
  CalendarDays,
  BarChart3,
  Download,
  Printer,
  MoreVertical,
  Tag,
  Star,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  MousePointer,
  Square,
  DoorOpen,
  HelpCircle,
  Ruler,
  Square as SquareIcon,
  Circle,
  RectangleHorizontal,
  Egg,
  Combine,
  Copy,
  Scissors,
  Table2,
  GitCompare,
  Move as MoveIcon,
  Save,
  Loader2,
  DoorOpen as DoorIcon,
  AppWindow as WindowIcon,
  Users as UsersIcon,
  AlertTriangle,
  DoorClosed,
  Grid,
  BoxSelect,
  CheckSquare,
  Square as SquareShape,
  GitMerge,
  GitBranch,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, addDays, subDays, isToday, isPast, isFuture } from "date-fns";
import { ru } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { TablesService, TableDto, TableStatus, HallDto, TableTagDto, TableShape } from "@/lib/api/tables.service";
import { 
  ReservationsService, 
  ReservationDto, 
  ReservationStatus, 
  CreateReservationDto,
  UpdateReservationDto 
} from "@/lib/api/reservation.service";

// Типы для планировки зала
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
};

type Door = {
  id: string;
  wallId: string;
  position: number;
  width: number;
  orientation?: 'horizontal' | 'vertical' | 'diagonal';
  angle?: number;
  height?: number;
  color?: string;
};

type Window = {
  id: string;
  wallId: string;
  position: number;
  width: number;
  orientation?: 'horizontal' | 'vertical' | 'diagonal';
  angle?: number;
  height?: number;
  color?: string;
};

interface HallWithLayout extends HallDto {
  walls?: WallSegment[];
  doors?: Door[];
  windows?: Window[];
}

// Диалог объединения столов (полностью как на странице настроек)
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

// Диалог разделения столов
function SeparateTablesDialog({
  open,
  onOpenChange,
  table,
  onSeparate,
  isSeparating
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableDto | null;
  onSeparate: (tableId: string) => void;
  isSeparating: boolean;
}) {
  const handleSubmit = () => {
    if (table) {
      onSeparate(table.id);
      onOpenChange(false);
    }
  };
  
  if (!table) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Разделение объединенного стола</DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите разделить стол "{table.name}"?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded flex items-center justify-center"
                style={{ backgroundColor: table.color }}
              >
                <span className="text-white font-bold">{table.name.charAt(0)}</span>
              </div>
              <div>
                <div className="font-medium">{table.name}</div>
                <div className="text-sm text-gray-600">
                  {table.seats} мест • {TablesService.getStatusLabel(table.status)}
                </div>
              </div>
            </div>
            
            {table.childTables && table.childTables.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Столы, которые будут восстановлены:</div>
                <div className="space-y-2">
                  {table.childTables.map(child => (
                    <div key={child.id} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: child.color }}
                      >
                        <span className="text-white text-xs font-bold">{child.name.charAt(0)}</span>
                      </div>
                      <span>{child.name} ({child.seats} мест)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
            После разделения оригинальные столы будут восстановлены на своих местах.
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSeparating}
            variant="default"
          >
            {isSeparating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Разделение...
              </>
            ) : 'Разделить стол'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Компонент стола для отображения на плане
function TableComponent({ 
  table, 
  displayCellSize, 
  viewTransform, 
  isSelected, 
  onClick,
  onMouseDown,
  onContextMenu,
  reservations,
  currentReservation,
  showLabels,
  isDragging,
  dragOffset,
  onStatusChange,
  showInTablesMode = true,
  moveModeEnabled = false,
  isCombined = false
}: { 
  table: TableDto;
  displayCellSize: number;
  viewTransform: { scale: number; translateX: number; translateY: number };
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  reservations: ReservationDto[];
  currentReservation: ReservationDto | null;
  showLabels: boolean;
  isDragging?: boolean;
  dragOffset?: { x: number, y: number };
  onStatusChange: (tableId: string, status: TableStatus) => void;
  showInTablesMode?: boolean;
  moveModeEnabled?: boolean;
  isCombined?: boolean;
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
    status,
    seats
  } = table;
  
  const statusColor = TablesService.getStatusColor(status as any);
  
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
    backgroundColor: status === TableStatus.OCCUPIED ? '#EF4444' : 
                    status === TableStatus.RESERVED ? '#F59E0B' :
                    status === TableStatus.CLEANING ? '#3B82F6' :
                    status === TableStatus.OUT_OF_SERVICE ? '#6B7280' : color,
    border: isSelected ? `3px solid #3B82F6` : isCombined ? `2px dashed ${color}` : `2px solid ${color}`,
    boxShadow: isSelected ? `0 0 0 3px rgba(59, 130, 246, 0.3), 0 4px 6px rgba(0,0,0,0.1)` : 
               isCombined ? `0 0 0 2px ${color}40, 0 2px 4px rgba(0,0,0,0.1)` : 'none',
    borderRadius: shape === TableShape.CIRCLE || shape === TableShape.OVAL ? '50%' : '4px',
    cursor: moveModeEnabled ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: isDragging ? 'none' : 'all 0.2s ease-in-out',
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : isSelected ? 10 : (isCombined ? 5 : 1),
    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
  };
  
  if (isDragging) {
    tableStyle.boxShadow = `0 4px 12px rgba(0,0,0,0.3), 0 0 0 2px #3B82F6`;
    tableStyle.transform = 'scale(1.05)';
  }
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Разрешаем перемещение только если включен режим перемещения
    if (moveModeEnabled && e.button === 0) {
      onMouseDown(e);
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
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
        className="hover:opacity-90 transition-all duration-200 group"
        title={`${name} - ${seats} мест, ${TablesService.getStatusLabel(status)}${moveModeEnabled ? ' (Режим перемещения включен)' : ''}${isCombined ? ' (Объединенный стол)' : ''}`}
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
        
        {currentReservation && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}
        
        {isSelected && !isDragging && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}
        
        {/* Индикатор режима перемещения */}
        {moveModeEnabled && !isDragging && (
          <div className="absolute -bottom-2 -right-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <MoveIcon className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
        
        {/* Индикатор объединенного стола */}
        {isCombined && (
          <div className="absolute -bottom-2 -left-2">
            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
              <GitMerge className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>
      
      {isSelected && !isDragging && (
        <div
          className="absolute bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none animate-pulse"
          style={{
            left: `${left + viewTransform.translateX}px`,
            top: `${top + viewTransform.translateY - tableHeight/2 - 35}px`,
            transform: 'translateX(-50%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {name} • {seats} мест • {TablesService.getStatusLabel(status)}
          {moveModeEnabled && ' (Перемещение включено)'}
          {isCombined && ' (Объединенный)'}
        </div>
      )}
    </>
  );
}

// Компонент для отображения стены
function WallComponent({ 
  wall, 
  displayCellSize, 
  viewTransform,
  showInTablesMode = false
}: { 
  wall: WallSegment;
  displayCellSize: number;
  viewTransform: { scale: number; translateX: number; translateY: number };
  showInTablesMode?: boolean;
}) {
  const { x1, y1, x2, y2, isHorizontal, isDiagonal, angle } = wall;
  
  const left = Math.min(x1, x2) * displayCellSize * viewTransform.scale;
  const top = Math.min(y1, y2) * displayCellSize * viewTransform.scale;
  const width = Math.abs(x2 - x1) * displayCellSize * viewTransform.scale;
  const height = Math.abs(y2 - y1) * displayCellSize * viewTransform.scale;
  
  if (isDiagonal) {
    const centerX = (x1 + x2) / 2 * displayCellSize * viewTransform.scale;
    const centerY = (y1 + y2) / 2 * displayCellSize * viewTransform.scale;
    const length = Math.sqrt(width * width + height * height);
    
    return (
      <div
        className="absolute bg-gray-600 rounded-md"
        style={{
          left: `${centerX - length/2 + viewTransform.translateX}px`,
          top: `${centerY - 5 + viewTransform.translateY}px`,
          width: `${length}px`,
          height: '10px',
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'center center',
          opacity: showInTablesMode ? 0.5 : 1,
          pointerEvents: 'none',
        }}
      />
    );
  }
  
  const wallStyle = {
    position: 'absolute' as const,
    left: `${left + viewTransform.translateX}px`,
    top: `${top + viewTransform.translateY}px`,
    width: `${isHorizontal ? width + 10 : 10}px`,
    height: `${isHorizontal ? 10 : height + 10}px`,
    backgroundColor: '#4B5563',
    borderRadius: '4px',
    opacity: showInTablesMode ? 0.5 : 1,
    pointerEvents: 'none',
  };
  
  return <div style={wallStyle} />;
}

// Компонент для отображения двери
function DoorComponent({ 
  door, 
  wall, 
  displayCellSize, 
  viewTransform,
  showInTablesMode = false
}: { 
  door: Door;
  wall: WallSegment;
  displayCellSize: number;
  viewTransform: { scale: number; translateX: number; translateY: number };
  showInTablesMode?: boolean;
}) {
  if (!wall) return null;
  
  const { x1, y1, x2, y2, isDiagonal, angle } = wall;
  const { position, width } = door;
  
  const wallLength = wall.length;
  const t = position / wallLength;
  
  const doorCenterX = x1 + (x2 - x1) * t;
  const doorCenterY = y1 + (y2 - y1) * t;
  
  if (isDiagonal) {
    const doorLengthInGrid = width / (wallLength / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    const halfLength = doorLengthInGrid / 2;
    const dx = (x2 - x1) * halfLength / wallLength;
    const dy = (y2 - y1) * halfLength / wallLength;
    
    const doorX1 = doorCenterX - dx;
    const doorY1 = doorCenterY - dy;
    const doorX2 = doorCenterX + dx;
    const doorY2 = doorCenterY + dy;
    
    const doorCenterXFinal = (doorX1 + doorX2) / 2;
    const doorCenterYFinal = (doorY1 + doorY2) / 2;
    
    const finalWidth = Math.sqrt(Math.pow(doorX2 - doorX1, 2) + Math.pow(doorY2 - doorY1, 2));
    const finalAngle = Math.atan2(doorY2 - doorY1, doorX2 - doorX1) * (180 / Math.PI);
    
    return (
      <div
        className="absolute bg-amber-800 rounded-sm border-2 border-amber-900"
        style={{
          left: `${doorCenterXFinal * displayCellSize * viewTransform.scale - (finalWidth * displayCellSize * viewTransform.scale) / 2 + viewTransform.translateX}px`,
          top: `${doorCenterYFinal * displayCellSize * viewTransform.scale - 10 + viewTransform.translateY}px`,
          width: `${finalWidth * displayCellSize * viewTransform.scale}px`,
          height: `20px`,
          transform: `rotate(${finalAngle}deg)`,
          transformOrigin: 'center center',
          opacity: showInTablesMode ? 0.5 : 1,
          pointerEvents: 'none',
        }}
      />
    );
  }
  
  const { isHorizontal } = wall;
  const doorLength = width / (wall.length / Math.abs(isHorizontal ? x2 - x1 : y2 - y1));
  const doorOffset = position / (wall.length / Math.abs(isHorizontal ? x2 - x1 : y2 - y1));
  
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
    <div
      className="absolute bg-amber-800 rounded-sm border-2 border-amber-900"
      style={{
        left: `${doorLeft + viewTransform.translateX}px`,
        top: `${doorTop + viewTransform.translateY}px`,
        width: `${doorWidth}px`,
        height: `${doorHeight}px`,
        transform: isHorizontal ? 'translateY(-5px)' : 'translateX(-5px)',
        opacity: showInTablesMode ? 0.5 : 1,
        pointerEvents: 'none',
      }}
    />
  );
}

// Компонент для отображения окна
function WindowComponent({ 
  windowItem, 
  wall, 
  displayCellSize, 
  viewTransform,
  showInTablesMode = false
}: { 
  windowItem: Window;
  wall: WallSegment;
  displayCellSize: number;
  viewTransform: { scale: number; translateX: number; translateY: number };
  showInTablesMode?: boolean;
}) {
  if (!wall) return null;
  
  const { x1, y1, x2, y2, isDiagonal, angle } = wall;
  const { position, width } = windowItem;
  
  const wallLength = wall.length;
  const t = position / wallLength;
  
  const windowCenterX = x1 + (x2 - x1) * t;
  const windowCenterY = y1 + (y2 - y1) * t;
  
  if (isDiagonal) {
    const windowLengthInGrid = width / (wallLength / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    const halfLength = windowLengthInGrid / 2;
    const dx = (x2 - x1) * halfLength / wallLength;
    const dy = (y2 - y1) * halfLength / wallLength;
    
    const windowX1 = windowCenterX - dx;
    const windowY1 = windowCenterY - dy;
    const windowX2 = windowCenterX + dx;
    const windowY2 = windowCenterY + dy;
    
    const windowCenterXFinal = (windowX1 + windowX2) / 2;
    const windowCenterYFinal = (windowY1 + windowY2) / 2;
    
    const finalWidth = Math.sqrt(Math.pow(windowX2 - windowX1, 2) + Math.pow(windowY2 - windowY1, 2));
    const finalAngle = Math.atan2(windowY2 - windowY1, windowX2 - windowX1) * (180 / Math.PI);
    
    return (
      <div
        className="absolute bg-white rounded-sm border-2 border-blue-300"
        style={{
          left: `${windowCenterXFinal * displayCellSize * viewTransform.scale - (finalWidth * displayCellSize * viewTransform.scale) / 2 + viewTransform.translateX}px`,
          top: `${windowCenterYFinal * displayCellSize * viewTransform.scale - 7.5 + viewTransform.translateY}px`,
          width: `${finalWidth * displayCellSize * viewTransform.scale}px`,
          height: `15px`,
          transform: `rotate(${finalAngle}deg)`,
          transformOrigin: 'center center',
          opacity: showInTablesMode ? 0.5 : 1,
          pointerEvents: 'none',
        }}
      >
        <div className="absolute inset-1 bg-blue-50 border border-blue-100 rounded-sm"></div>
      </div>
    );
  }
  
  const { isHorizontal } = wall;
  const windowLength = width / (wall.length / Math.abs(isHorizontal ? x2 - x1 : y2 - y1));
  const windowOffset = position / (wall.length / Math.abs(isHorizontal ? x2 - x1 : y2 - y1));
  
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
    <div
      className="absolute bg-white rounded-sm border-2 border-blue-300"
      style={{
        left: `${windowLeft + viewTransform.translateX}px`,
        top: `${windowTop + viewTransform.translateY}px`,
        width: `${windowWidth}px`,
        height: `${windowHeight}px`,
        transform: isHorizontal ? 'translateY(-5px)' : 'translateX(-5px)',
        opacity: showInTablesMode ? 0.5 : 1,
        pointerEvents: 'none',
      }}
    >
      <div className="absolute inset-1 bg-blue-50 border border-blue-100 rounded-sm"></div>
    </div>
  );
}

// Диалог создания/редактирования бронирования
function ReservationDialog({
  open,
  onOpenChange,
  table,
  reservation,
  onSubmit,
  isSubmitting
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableDto | null;
  reservation: ReservationDto | null;
  onSubmit: (data: CreateReservationDto | UpdateReservationDto) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    customerName: reservation?.customerName || '',
    phone: reservation?.phone || '',
    email: reservation?.email || '',
    reservationTime: reservation?.reservationTime ? 
      new Date(reservation.reservationTime) : 
      new Date(Date.now() + 30 * 60 * 1000),
    numberOfPeople: reservation?.numberOfPeople || table?.seats || 2,
    comment: reservation?.comment || '',
    status: reservation?.status || ReservationStatus.PENDING,
  });
  
  const [date, setDate] = useState<Date>(formData.reservationTime);
  const [time, setTime] = useState(
    format(formData.reservationTime, 'HH:mm')
  );
  
  useEffect(() => {
    if (table) {
      // Ограничиваем количество гостей количеством мест за столом
      const maxSeats = table.seats;
      setFormData(prev => ({
        ...prev,
        numberOfPeople: Math.min(prev.numberOfPeople, maxSeats)
      }));
    }
  }, [table]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName.trim()) {
      toast.error('Введите имя клиента');
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error('Введите номер телефона');
      return;
    }
    
    if (!table) {
      toast.error('Стол не выбран');
      return;
    }
    
    // Проверяем количество гостей
    if (formData.numberOfPeople > table.seats) {
      toast.error(`Количество гостей (${formData.numberOfPeople}) превышает количество мест за столом (${table.seats})`);
      return;
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    const reservationTime = new Date(date);
    reservationTime.setHours(hours, minutes, 0, 0);
    
    const reservationData: any = {
      ...formData,
      reservationTime: reservationTime.toISOString(),
      tableId: table.id,
    };
    
    if (reservation) {
      reservationData.id = reservation.id;
    }
    
    onSubmit(reservationData);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {reservation ? 'Редактирование бронирования' : 'Новое бронирование'}
          </DialogTitle>
          <DialogDescription>
            {reservation 
              ? 'Измените данные бронирования' 
              : `Бронирование стола "${table?.name}" на ${table?.seats} мест`}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Имя клиента *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                placeholder="Иван Иванов"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email (необязательно)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="client@example.com"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Дата бронирования</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, 'dd.MM.yyyy', { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Время бронирования</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numberOfPeople">Количество гостей</Label>
            <Select
              value={formData.numberOfPeople.toString()}
              onValueChange={(value) => setFormData({...formData, numberOfPeople: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите количество" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: table?.seats || 12 }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'гость' : num < 5 ? 'гостя' : 'гостей'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {table && (
              <p className="text-xs text-gray-500">
                Максимально: {table.seats} мест
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий (необязательно)</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData({...formData, comment: e.target.value})}
              placeholder="Особые пожелания, аллергии и т.д."
              rows={3}
            />
          </div>
          
          {reservation && (
            <div className="space-y-2">
              <Label>Статус бронирования</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReservationStatus.PENDING}>Ожидает подтверждения</SelectItem>
                  <SelectItem value={ReservationStatus.CONFIRMED}>Подтверждено</SelectItem>
                  <SelectItem value={ReservationStatus.ARRIVED}>Клиент прибыл</SelectItem>
                  <SelectItem value={ReservationStatus.COMPLETED}>Завершено</SelectItem>
                  <SelectItem value={ReservationStatus.CANCELLED}>Отменено</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : reservation ? 'Сохранить изменения' : 'Создать бронирование'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Диалог изменения статуса стола
function TableStatusDialog({
  open,
  onOpenChange,
  table,
  onStatusChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableDto | null;
  onStatusChange: (tableId: string, status: TableStatus) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<TableStatus>(table?.status || TableStatus.AVAILABLE);
  
  const handleSubmit = () => {
    if (table) {
      onStatusChange(table.id, selectedStatus);
      onOpenChange(false);
    }
  };
  
  const statusOptions = [
    { value: TableStatus.AVAILABLE, label: 'Свободен', color: '#10B981', icon: <CheckCircle className="h-4 w-4" /> },
    { value: TableStatus.OCCUPIED, label: 'Занят', color: '#EF4444', icon: <Users className="h-4 w-4" /> },
    { value: TableStatus.RESERVED, label: 'Забронирован', color: '#F59E0B', icon: <Clock className="h-4 w-4" /> },
    { value: TableStatus.CLEANING, label: 'На уборке', color: '#3B82F6', icon: <AlertCircle className="h-4 w-4" /> },
    { value: TableStatus.OUT_OF_SERVICE, label: 'Не обслуживается', color: '#6B7280', icon: <XCircle className="h-4 w-4" /> },
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Изменение статуса стола</DialogTitle>
          <DialogDescription>
            Выберите новый статус для стола "{table?.name}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedStatus === option.value ? "default" : "outline"}
              className="w-full justify-start"
              style={selectedStatus === option.value ? { backgroundColor: option.color } : {}}
              onClick={() => setSelectedStatus(option.value)}
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
              </div>
            </Button>
          ))}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            Изменить статус
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ReservationsPage() {
  const params = useParams();
  const restaurantId = params.id as string;
  
  // Состояния
  const [halls, setHalls] = useState<HallWithLayout[]>([]);
  const [allTables, setAllTables] = useState<TableDto[]>([]);
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [currentHall, setCurrentHall] = useState<HallWithLayout | null>(null);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDto | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCombiningTables, setIsCombiningTables] = useState(false);
  const [isSeparatingTables, setIsSeparatingTables] = useState(false);
  
  // Фильтры
  const [filters, setFilters] = useState({
    date: new Date(),
    hallId: undefined as string | undefined,
    tableStatus: undefined as TableStatus | undefined,
    reservationStatus: undefined as ReservationStatus | undefined,
    search: ""
  });
  
  // Режимы отображения
  const [viewMode, setViewMode] = useState<'plan' | 'list'>('plan');
  const [showStats, setShowStats] = useState(true);
  
  // Состояние для плана
  const [viewTransform, setViewTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [displayCellSize] = useState(40);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Настройки плана
  const [gridSettings, setGridSettings] = useState({
    showGrid: true,
    snapToGrid: true,
    showTableLabels: true,
    snapToTables: false,
  });
  
  // ДИАЛОГИ
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [tableStatusDialogOpen, setTableStatusDialogOpen] = useState(false);
  const [combineDialogOpen, setCombineDialogOpen] = useState(false);
  const [separateDialogOpen, setSeparateDialogOpen] = useState(false);
  const [selectedTableForDialog, setSelectedTableForDialog] = useState<TableDto | null>(null);
  
  // Режим перемещения столов
  const [moveModeEnabled, setMoveModeEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Загрузка данных
  useEffect(() => {
    if (restaurantId) {
      loadData();
    }
  }, [restaurantId, filters.date]);

  useEffect(() => {
    if (currentHall) {
      loadHallLayout(currentHall.id);
    }
  }, [currentHall]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Загружаем залы
      const hallsData = await TablesService.getHallsByRestaurant(restaurantId, false);
      setHalls(hallsData as HallWithLayout[]);
      
      if (hallsData.length > 0 && !currentHall) {
        const firstHall = hallsData[0] as HallWithLayout;
        setCurrentHall(firstHall);
      }
      
      // Загружаем ВСЕ столы ресторана
      const tablesResponse = await TablesService.getTables({
        restaurantId,
        includeInactive: false
      });
      setAllTables(tablesResponse.data);
      
      // Загружаем бронирования
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);
      
      const reservationsResponse = await ReservationsService.getReservations({
        restaurantId,
        hallId: currentHall?.id || filters.hallId || undefined,
        status: filters.reservationStatus,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        onlyActive: false
      });
      
      setReservations(reservationsResponse.data);
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadHallLayout = async (hallId: string) => {
    try {
      const layout = await TablesService.getHallLayout(hallId);
      
      setCurrentHall(prev => prev ? {
        ...prev,
        walls: layout.walls || [],
        doors: layout.doors || [],
        windows: layout.windows || []
      } : null);
      
    } catch (error) {
      console.error('Ошибка загрузки планировки зала:', error);
      // Не показываем ошибку пользователю, так как планировка может отсутствовать
    }
  };
  
  // Получаем столы только выбранного зала
  const getTablesForSelectedHall = useMemo(() => {
    if (!currentHall) return [];
    
    return allTables.filter(table => table.hallId === currentHall.id);
  }, [allTables, currentHall]);
  
  // Проверка является ли стол объединенным
  const isTableCombined = useCallback((table: TableDto) => {
    return !!(table.childTables && table.childTables.length > 0);
  }, []);
  
  // Получение текущего бронирования для стола
  const getCurrentReservationForTable = useCallback((tableId: string): ReservationDto | null => {
    const now = new Date();
    return reservations.find(reservation => 
      reservation.tableId === tableId &&
      new Date(reservation.reservationTime) <= now &&
      now <= new Date(new Date(reservation.reservationTime).getTime() + 2 * 60 * 60 * 1000) &&
      [ReservationStatus.CONFIRMED, ReservationStatus.ARRIVED].includes(reservation.status)
    ) || null;
  }, [reservations]);
  
  // Обработчики для столов в режиме плана
  const handleTableClick = (table: TableDto, e: React.MouseEvent) => {
    if (viewMode === 'plan') {
      e.stopPropagation();
      
      if (e.ctrlKey || e.metaKey) {
        // Добавляем/убираем стол из выбора при зажатом Ctrl/Cmd
        setSelectedTableIds(prev => 
          prev.includes(table.id)
            ? prev.filter(id => id !== table.id)
            : [...prev, table.id]
        );
      } else {
        // Выбираем только этот стол
        setSelectedTableIds([table.id]);
      }
      
      setSelectedReservation(null);
    }
  };
  
  const handleTableMouseDown = (table: TableDto, e: React.MouseEvent) => {
    if (viewMode === 'plan' && e.button === 0) {
      e.stopPropagation();
      // Разрешаем перемещение только если включен режим перемещения
      if (moveModeEnabled) {
        const rect = e.currentTarget.getBoundingClientRect();
        setDraggingTableId(table.id);
        setDragStart({ x: e.clientX, y: e.clientY });
        setDragOffset({ x: 0, y: 0 });
        
        // Если стол не выбран, выбираем его
        if (!selectedTableIds.includes(table.id)) {
          setSelectedTableIds([table.id]);
        }
      }
    }
  };
  
  const handleTableContextMenu = (table: TableDto, e: React.MouseEvent) => {
    if (viewMode === 'plan') {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.ctrlKey || e.metaKey) {
        // Добавляем стол к выбранным при зажатом Ctrl/Cmd
        setSelectedTableIds(prev => 
          prev.includes(table.id)
            ? prev
            : [...prev, table.id]
        );
      } else {
        // Выбираем только этот стол
        setSelectedTableIds([table.id]);
      }
    }
  };
  
  // Обработчики для плана
  const handlePlanMouseMove = (e: React.MouseEvent) => {
    if (draggingTableId) {
      const deltaX = (e.clientX - dragStart.x) / (displayCellSize * viewTransform.scale);
      const deltaY = (e.clientY - dragStart.y) / (displayCellSize * viewTransform.scale);
      setDragOffset({ x: deltaX, y: deltaY });
    } else if (isPanning) {
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
  
  const handlePlanMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !draggingTableId) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      
      // Снимаем выделение со столов при клике на пустое место
      if (!selectedTableIds.length || e.ctrlKey || e.metaKey) {
        // При зажатом Ctrl/Cmd не снимаем выделение
      } else {
        setSelectedTableIds([]);
      }
      setSelectedReservation(null);
    }
  };
  
  const handlePlanMouseUp = () => {
    if (draggingTableId) {
      const table = allTables.find(t => t.id === draggingTableId);
      if (table) {
        const newPositionX = (table.positionX || 0) + dragOffset.x;
        const newPositionY = (table.positionY || 0) + dragOffset.y;
        
        // Обновляем позицию стола
        handleUpdateTablePosition(table.id, newPositionX, newPositionY);
      }
      setDraggingTableId(null);
      setDragOffset({ x: 0, y: 0 });
    }
    setIsPanning(false);
  };
  
  const handleZoomIn = () => {
    setViewTransform(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale + 0.2),
    }));
  };
  
  const handleZoomOut = () => {
    setViewTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, prev.scale - 0.2),
    }));
  };
  
  const handleResetView = () => {
    setViewTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  };
  
  // Работа с бронированиями
  const handleCreateReservation = async (table: TableDto) => {
    setSelectedTableForDialog(table);
    setSelectedReservation(null);
    setReservationDialogOpen(true);
  };
  
  const handleSubmitReservation = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      if (data.id) {
        // Обновление существующего бронирования
        const updated = await ReservationsService.updateReservation(data.id, data);
        setReservations(prev => prev.map(r => r.id === data.id ? updated : r));
        
        // Если статус брони изменился, возможно нужно изменить статус стола
        if (data.status === ReservationStatus.CANCELLED) {
          await handleTableStatusChange(data.tableId, TableStatus.AVAILABLE);
        } else if (data.status === ReservationStatus.ARRIVED) {
          await handleTableStatusChange(data.tableId, TableStatus.OCCUPIED);
        } else if (data.status === ReservationStatus.COMPLETED) {
          await handleTableStatusChange(data.tableId, TableStatus.CLEANING);
        } else if (data.status === ReservationStatus.CONFIRMED) {
          await handleTableStatusChange(data.tableId, TableStatus.RESERVED);
        }
        
        toast.success('Бронирование обновлено');
      } else {
        // Создание нового бронирования
        const newReservation = await ReservationsService.createReservation(data);
        setReservations(prev => [newReservation, ...prev]);
        
        // Меняем статус стола на "Забронирован"
        await handleTableStatusChange(data.tableId, TableStatus.RESERVED);
        
        toast.success('Бронирование создано');
      }
      
      setReservationDialogOpen(false);
      setSelectedTableForDialog(null);
      setSelectedReservation(null);
      
    } catch (error) {
      console.error('Ошибка сохранения бронирования:', error);
      toast.error('Не удалось сохранить бронирование');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelReservation = async (reservation: ReservationDto) => {
    if (!ReservationsService.canCancelReservation(reservation)) {
      toast.error('Это бронирование нельзя отменить');
      return;
    }
    
    if (!confirm('Вы уверены, что хотите отменить это бронирование?')) {
      return;
    }
    
    try {
      const updated = await ReservationsService.cancelReservation(reservation.id);
      setReservations(prev => prev.map(r => r.id === reservation.id ? updated : r));
      
      // Освобождаем стол
      await handleTableStatusChange(reservation.tableId, TableStatus.AVAILABLE);
      
      toast.success('Бронирование отменено');
    } catch (error) {
      console.error('Ошибка отмены бронирования:', error);
      toast.error('Не удалось отменить бронирование');
    }
  };
  
  const handleMarkAsArrived = async (reservation: ReservationDto) => {
    if (!ReservationsService.canMarkAsArrived(reservation)) {
      toast.error('Невозможно отметить как прибывшее');
      return;
    }
    
    try {
      const updated = await ReservationsService.markAsArrived(reservation.id);
      setReservations(prev => prev.map(r => r.id === reservation.id ? updated : r));
      
      // Меняем статус стола на "Занят"
      await handleTableStatusChange(reservation.tableId, TableStatus.OCCUPIED);
      
      toast.success('Клиент отмечен как прибывший');
    } catch (error) {
      console.error('Ошибка отметки прибытия:', error);
      toast.error('Не удалось отметить прибытие');
    }
  };
  
  const handleMarkAsCompleted = async (reservation: ReservationDto) => {
    try {
      const updated = await ReservationsService.completeReservation(reservation.id);
      setReservations(prev => prev.map(r => r.id === reservation.id ? updated : r));
      
      // Определяем следующий статус стола
      const table = allTables.find(t => t.id === reservation.tableId);
      let nextTableStatus = TableStatus.CLEANING;
      
      // Если есть следующее бронирование в ближайшее время, ставим RESERVED
      const nextReservation = reservations.find(r => 
        r.tableId === reservation.tableId &&
        r.id !== reservation.id &&
        new Date(r.reservationTime) > new Date() &&
        [ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(r.status) &&
        new Date(r.reservationTime).getTime() - new Date().getTime() < 60 * 60 * 1000
      );
      
      if (nextReservation) {
        nextTableStatus = TableStatus.RESERVED;
      }
      
      await handleTableStatusChange(reservation.tableId, nextTableStatus);
      
      toast.success('Бронирование завершено');
    } catch (error) {
      console.error('Ошибка завершения бронирования:', error);
      toast.error('Не удалось завершить бронирование');
    }
  };
  
  // Работа со столами
  const handleTableStatusChange = async (tableId: string, status: TableStatus) => {
    try {
      setIsUpdatingStatus(true);
      const updatedTable = await TablesService.updateTableStatus(tableId, status);
      
      // Обновляем стол в общем списке
      setAllTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
      
      toast.success(`Статус стола изменен на "${TablesService.getStatusLabel(status)}"`);
    } catch (error) {
      console.error('Ошибка изменения статуса стола:', error);
      toast.error('Не удалось изменить статус стола');
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const handleUpdateTablePosition = async (tableId: string, positionX: number, positionY: number) => {
    try {
      const table = allTables.find(t => t.id === tableId);
      if (!table) return;
      
      const updatedTable = await TablesService.updateTable(tableId, {
        positionX,
        positionY,
      });
      
      // Обновляем стол в общем списке
      setAllTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
      
      toast.success('Позиция стола обновлена');
    } catch (error) {
      console.error('Ошибка перемещения стола:', error);
      toast.error('Не удалось переместить стол');
    }
  };
  
  // Комбинирование столов (полностью как на странице настроек)
  const handleCombineTables = async (combineData: any) => {
    try {
      setIsCombiningTables(true);
      
      const combinedTable = await TablesService.combineTables(combineData);
      
      // Перезагружаем все столы
      const tablesResponse = await TablesService.getTables({
        restaurantId,
        hallId: currentHall?.id
      });
      
      // Обновляем столы только текущего зала
      const tablesInCurrentHall = tablesResponse.data.filter(table => table.hallId === currentHall?.id);
      setAllTables(prev => [
        ...prev.filter(table => table.hallId !== currentHall?.id),
        ...tablesInCurrentHall
      ]);
      
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
  
  // Разъединение столов (полностью как на странице настроек)
  const handleSeparateTables = async (tableId: string) => {
    try {
      setIsSeparatingTables(true);
      
      const separatedTables = await TablesService.separateTables(tableId);
      
      // Перезагружаем все столы
      const tablesResponse = await TablesService.getTables({
        restaurantId,
        hallId: currentHall?.id
      });
      
      // Обновляем столы только текущего зала
      const tablesInCurrentHall = tablesResponse.data.filter(table => table.hallId === currentHall?.id);
      setAllTables(prev => [
        ...prev.filter(table => table.hallId !== currentHall?.id),
        ...tablesInCurrentHall
      ]);
      
      setSelectedTableIds([]);
      setSeparateDialogOpen(false);
      
      toast.success('Стол успешно разделен');
      
    } catch (error) {
      console.error('Ошибка при разделении столов:', error);
      toast.error('Не удалось разделить стол');
    } finally {
      setIsSeparatingTables(false);
    }
  };
  
  // Функция для получения сетки фона
  const getGridBackground = () => {
    if (!gridSettings.showGrid) return 'none';
    
    const displayCellSizeScaled = displayCellSize * viewTransform.scale;
    const snapGridSize = 4 * viewTransform.scale;
    
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
      ) ${viewTransform.translateX}px ${viewTransform.translateY}px / ${displayCellSizeScaled}px 100%,
      linear-gradient(
        to bottom,
        #9ca3af 2px,
        transparent 2px
      ) ${viewTransform.translateX}px ${viewTransform.translateY}px / 100% ${displayCellSizeScaled}px
    `;
    
    return `${subGrid}, ${mainGrid}`;
  };
  
  // Обработчик выбора зала
  const handleHallSelect = async (hall: HallWithLayout) => {
    setCurrentHall(hall);
    setSelectedTableIds([]);
    setSelectedReservation(null);
    
    // Загружаем планировку нового зала
    await loadHallLayout(hall.id);
    
    // Перезагружаем бронирования для нового зала
    const startDate = new Date(filters.date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(filters.date);
    endDate.setHours(23, 59, 59, 999);
    
    try {
      const reservationsResponse = await ReservationsService.getReservations({
        restaurantId,
        hallId: hall.id,
        status: filters.reservationStatus,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        onlyActive: false
      });
      
      setReservations(reservationsResponse.data);
    } catch (error) {
      console.error('Ошибка загрузки бронирований:', error);
      toast.error('Не удалось загрузить бронирования');
    }
  };
  
  // Удаление зала
  const deleteHall = async (hallId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот зал? Все связанные данные будут удалены.')) {
      return;
    }
    
    try {
      await TablesService.deleteHall(hallId);
      setHalls(prev => prev.filter(h => h.id !== hallId));
      
      // Если удаляем текущий зал, выбираем следующий
      if (currentHall?.id === hallId) {
        const remainingHalls = halls.filter(h => h.id !== hallId);
        if (remainingHalls.length > 0) {
          handleHallSelect(remainingHalls[0]);
        } else {
          setCurrentHall(null);
        }
      }
      
      toast.success('Зал удален');
    } catch (error) {
      console.error('Ошибка удаления зала:', error);
      toast.error('Не удалось удалить зал');
    }
  };
  
  // Получаем стену для двери/окна
  const getWallForElement = (wallId: string) => {
    return currentHall?.walls?.find(wall => wall.id === wallId);
  };
  
  // Функция для включения/выключения режима перемещения
  const toggleMoveMode = () => {
    const newMoveMode = !moveModeEnabled;
    setMoveModeEnabled(newMoveMode);
    
    if (newMoveMode) {
      toast.success('Режим перемещения столов включен. Теперь вы можете перетаскивать столы.');
    } else {
      toast.info('Режим перемещения столов выключен.');
      // Если в режиме перемещения что-то перетаскивали, сбрасываем
      if (draggingTableId) {
        setDraggingTableId(null);
        setDragOffset({ x: 0, y: 0 });
      }
    }
  };
  
  // Обработчик колесика мыши для масштабирования
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
  
  // Привязка события колесика
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);
  
  // Фильтрация данных для режима плана
  const filteredTablesForPlan = useMemo(() => {
    let filtered = getTablesForSelectedHall;
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(table => 
        table.name.toLowerCase().includes(searchLower) ||
        table.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.tableStatus) {
      filtered = filtered.filter(table => table.status === filters.tableStatus);
    }
    
    return filtered;
  }, [getTablesForSelectedHall, filters]);
  
  // Фильтрация данных для режима списка
  const filteredTablesForList = useMemo(() => {
    let filtered = allTables;
    
    // Если выбран текущий зал, показываем только его столы
    if (currentHall) {
      filtered = filtered.filter(table => table.hallId === currentHall.id);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(table => 
        table.name.toLowerCase().includes(searchLower) ||
        table.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.tableStatus) {
      filtered = filtered.filter(table => table.status === filters.tableStatus);
    }
    
    return filtered;
  }, [allTables, currentHall, filters]);
  
  const filteredReservations = useMemo(() => {
    let filtered = reservations;
    
    // Фильтрация по текущему залу
    if (currentHall) {
      // Фильтруем бронирования только для столов текущего зала
      const tablesInCurrentHall = allTables.filter(table => table.hallId === currentHall.id);
      const tableIdsInCurrentHall = tablesInCurrentHall.map(table => table.id);
      
      filtered = filtered.filter(reservation => 
        tableIdsInCurrentHall.includes(reservation.tableId)
      );
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(reservation => 
        reservation.customerName.toLowerCase().includes(searchLower) ||
        reservation.phone.toLowerCase().includes(searchLower) ||
        reservation.table?.name.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.reservationStatus) {
      filtered = filtered.filter(reservation => reservation.status === filters.reservationStatus);
    }
    
    return filtered;
  }, [reservations, currentHall, allTables, filters]);
  
  // Получение выбранного стола
  const selectedTable = selectedTableIds.length === 1 ? allTables.find(t => t.id === selectedTableIds[0]) : null;
  const isSelectedTableCombined = selectedTable ? isTableCombined(selectedTable) : false;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="mt-4 text-gray-900">Загрузка...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Бронирование столов</h1>
          <p className="text-gray-600 mt-2">
            Управление бронированиями и статусами столов
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFilters({...filters, date: subDays(filters.date, 1)})}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !filters.date && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {format(filters.date, "dd MMMM yyyy", { locale: ru })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={filters.date}
                onSelect={(date) => date && setFilters({...filters, date})}
                initialFocus
                locale={ru}
              />
            </PopoverContent>
          </Popover>
          
          <Button
            variant="outline"
            onClick={() => setFilters({...filters, date: addDays(filters.date, 1)})}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {isToday(filters.date) && (
            <Button
              variant="outline"
              onClick={() => setFilters({...filters, date: new Date()})}
            >
              Сегодня
            </Button>
          )}
        </div>
      </div>
      
      <div>
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <Tabs 
                  value={viewMode} 
                  onValueChange={(v) => setViewMode(v as 'plan' | 'list')}
                  className="w-full md:w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="plan" className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      План
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      Список
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Блок выбора зала через кнопки */}
                <div className="flex flex-wrap gap-2">
                  {halls.map(hall => (
                    <Button
                      key={hall.id}
                      variant={currentHall?.id === hall.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleHallSelect(hall)}
                      className="relative group"
                    >
                      {hall.title}
  
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {viewMode === 'plan' && currentHall && (
                  <>
                    {/* Кнопка включения/выключения режима перемещения */}
                    <Button
                      variant={moveModeEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={toggleMoveMode}
                      className={moveModeEnabled ? "bg-blue-600 hover:bg-blue-700" : ""}
                      title={moveModeEnabled ? "Режим перемещения включен" : "Включить режим перемещения столов"}
                    >
                      {moveModeEnabled ? (
                        <>
                          <MoveIcon className="h-4 w-4 mr-2" />
                          Перемещение
                        </>
                      ) : (
                        <>
                          <MousePointer className="h-4 w-4 mr-2" />
                          Перемещение
                        </>
                      )}
                    </Button>
                    
                    <Separator orientation="vertical" className="h-6" />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      title="Уменьшить"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      title="Увеличить"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetView}
                      title="Сбросить вид"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    
                    <Separator orientation="vertical" className="h-6" />
                    
                    {selectedTableIds.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const table = allTables.find(t => t.id === selectedTableIds[0]);
                            if (table) {
                              setSelectedTableForDialog(table);
                              setTableStatusDialogOpen(true);
                            }
                          }}
                        >
                          Изменить статус
                        </Button>
                        
                        {selectedTableIds.length >= 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCombineDialogOpen(true)}
                          >
                            <Combine className="h-4 w-4 mr-2" />
                            Объединить
                          </Button>
                        )}
                        
                        {selectedTableIds.length === 1 && isSelectedTableCombined && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const table = allTables.find(t => t.id === selectedTableIds[0]);
                              if (table) {
                                setSelectedTableForDialog(table);
                                setSeparateDialogOpen(true);
                              }
                            }}
                          >
                            <GitBranch className="h-4 w-4 mr-2" />
                            Разъединить
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Отображение в зависимости от режима */}
        {viewMode === 'plan' ? (
          /* Режим плана зала */
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>План зала</CardTitle>
                    <CardDescription>
                      {currentHall 
                        ? `${currentHall.title} • ${filteredTablesForPlan.length} столов` +
                          (moveModeEnabled ? ' • Режим перемещения включен' : '')
                        : 'Выберите зал'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Индикатор режима перемещения */}
                    {moveModeEnabled && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <MoveIcon className="h-3 w-3 mr-1" />
                        Перемещение
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Свободно: {filteredTablesForPlan.filter(t => t.status === TableStatus.AVAILABLE).length}
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      Занято: {filteredTablesForPlan.filter(t => t.status === TableStatus.OCCUPIED).length}
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      Бронь: {filteredTablesForPlan.filter(t => t.status === TableStatus.RESERVED).length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {currentHall ? (
                  <div
                    ref={containerRef}
                    className="relative border border-gray-300 rounded-lg overflow-hidden bg-white"
                    style={{ 
                      height: "600px",
                      background: getGridBackground(),
                      cursor: isPanning ? 'grabbing' : draggingTableId ? 'grabbing' : moveModeEnabled ? 'grab' : 'default'
                    }}
                    onMouseMove={handlePlanMouseMove}
                    onMouseDown={handlePlanMouseDown}
                    onMouseUp={handlePlanMouseUp}
                    onMouseLeave={() => {
                      setIsPanning(false);
                      if (draggingTableId) {
                        handlePlanMouseUp();
                      }
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {/* Стены */}
                    {currentHall.walls?.map(wall => (
                      <WallComponent
                        key={wall.id}
                        wall={wall}
                        displayCellSize={displayCellSize}
                        viewTransform={viewTransform}
                        showInTablesMode={true}
                      />
                    ))}
                    
                    {/* Двери */}
                    {currentHall.doors?.map(door => {
                      const wall = getWallForElement(door.wallId);
                      if (!wall) return null;
                      
                      return (
                        <DoorComponent
                          key={door.id}
                          door={door}
                          wall={wall}
                          displayCellSize={displayCellSize}
                          viewTransform={viewTransform}
                          showInTablesMode={true}
                        />
                      );
                    })}
                    
                    {/* Окна */}
                    {currentHall.windows?.map(window => {
                      const wall = getWallForElement(window.wallId);
                      if (!wall) return null;
                      
                      return (
                        <WindowComponent
                          key={window.id}
                          windowItem={window}
                          wall={wall}
                          displayCellSize={displayCellSize}
                          viewTransform={viewTransform}
                          showInTablesMode={true}
                        />
                      );
                    })}
                    
                    {/* Столы выбранного зала */}
                    {filteredTablesForPlan.map(table => {
                      const currentReservation = getCurrentReservationForTable(table.id);
                      const isSelected = selectedTableIds.includes(table.id);
                      const isCombined = isTableCombined(table);
                      
                      return (
                        <TableComponent
                          key={table.id}
                          table={table}
                          displayCellSize={displayCellSize}
                          viewTransform={viewTransform}
                          isSelected={isSelected}
                          onClick={(e) => handleTableClick(table, e)}
                          onMouseDown={(e) => handleTableMouseDown(table, e)}
                          onContextMenu={(e) => handleTableContextMenu(table, e)}
                          reservations={reservations}
                          currentReservation={currentReservation}
                          showLabels={gridSettings.showTableLabels}
                          isDragging={draggingTableId === table.id}
                          dragOffset={draggingTableId === table.id ? dragOffset : undefined}
                          onStatusChange={handleTableStatusChange}
                          showInTablesMode={true}
                          moveModeEnabled={moveModeEnabled}
                          isCombined={isCombined}
                        />
                      );
                    })}
                    
                    {/* Сообщение если в зале нет столов */}
                    {filteredTablesForPlan.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border">
                          <TableIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет столов</h3>
                          <p className="text-gray-600">
                            В этом зале еще не добавлены столы
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Сообщение о режиме перемещения */}
                    {moveModeEnabled && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
                        <div className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                          <MoveIcon className="h-4 w-4" />
                          <span>Режим перемещения включен. Перетаскивайте столы для изменения их позиции.</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Подсказка о выборе нескольких столов */}
                    {!moveModeEnabled && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                        <div className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
                          <span>Зажмите Ctrl/Cmd для выбора нескольких столов</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-gray-300 rounded-lg">
                    <TableIcon className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите зал</h3>
                    <p className="text-gray-600 text-center mb-4">
                      Для просмотра плана выберите зал из списка выше
                    </p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 p-3">
                <div className="w-full">
                  <div className="text-xs font-medium text-gray-700 mb-2">Легенда статусов столов:</div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-xs text-gray-600">Свободен</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-xs text-gray-600">Занят</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span className="text-xs text-gray-600">Забронирован</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-xs text-gray-600">На уборке</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded"></div>
                      <span className="text-xs text-gray-600">Не обслуживается</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      <span className="text-xs text-gray-600">Активное бронирование</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-dashed border-purple-500 rounded"></div>
                      <span className="text-xs text-gray-600">Объединенный стол</span>
                    </div>
                    {moveModeEnabled && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <MoveIcon className="w-2 h-2 text-white" />
                        </div>
                        <span className="text-xs text-gray-600">Режим перемещения</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        ) : (
          /* Режим списка */
          <Card>
            <CardHeader>
              <CardTitle>Список столов и бронирований</CardTitle>
              <CardDescription>
                {format(filters.date, 'dd MMMM yyyy', { locale: ru })} • 
                {currentHall 
                  ? `${currentHall.title} • ${filteredTablesForList.length} столов` 
                  : 'Все залы • 0 столов'} • 
                {filteredReservations.length} бронирований
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="tables" className="w-full">
                <TabsList className="grid grid-cols-2 ">
                  <TabsTrigger value="tables">Столы</TabsTrigger>
                  <TabsTrigger value="reservations">Бронирования</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tables" className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <div className="space-y-1 flex-1 min-w-[200px]">
                      <Input
                        placeholder="Поиск столов..."
                        value={filters.search || ""}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                      />
                    </div>
                    
                    <Select
                      value={filters.tableStatus || "all"}
                      onValueChange={(value) => setFilters({...filters, tableStatus: value === "all" ? undefined : value})}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Все статусы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value={TableStatus.AVAILABLE}>Свободен</SelectItem>
                        <SelectItem value={TableStatus.OCCUPIED}>Занят</SelectItem>
                        <SelectItem value={TableStatus.RESERVED}>Забронирован</SelectItem>
                        <SelectItem value={TableStatus.CLEANING}>На уборке</SelectItem>
                        <SelectItem value={TableStatus.OUT_OF_SERVICE}>Не обслуживается</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Стол</TableHead>
                          <TableHead>Зал</TableHead>
                          <TableHead>Мест</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Текущее бронирование</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTablesForList.map(table => {
                          const currentReservation = getCurrentReservationForTable(table.id);
                          const hall = halls.find(h => h.id === table.hallId);
                          const isCombined = isTableCombined(table);
                          
                          return (
                            <TableRow key={table.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded"
                                    style={{ 
                                      backgroundColor: TablesService.getStatusColor(table.status),
                                      border: isCombined ? '2px dashed #8B5CF6' : 'none'
                                    }}
                                  />
                                  {table.name}
                                  {isCombined && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      <GitMerge className="h-3 w-3 mr-1" />
                                      Объединенный
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {hall?.title || 'Не указан'}
                                </Badge>
                              </TableCell>
                              <TableCell>{table.seats}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  style={{ 
                                    backgroundColor: TablesService.getStatusColor(table.status) + '20',
                                    borderColor: TablesService.getStatusColor(table.status),
                                    color: TablesService.getStatusColor(table.status)
                                  }}
                                >
                                  {TablesService.getStatusLabel(table.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {currentReservation ? (
                                  <div className="space-y-1">
                                    <div className="font-medium">{currentReservation.customerName}</div>
                                    <div className="text-xs text-gray-500">
                                      {format(new Date(currentReservation.reservationTime), 'HH:mm')} • {currentReservation.numberOfPeople} чел.
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-sm">Нет активного бронирования</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCreateReservation(table)}
                                    title="Забронировать"
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTableForDialog(table);
                                      setTableStatusDialogOpen(true);
                                    }}
                                    title="Изменить статус"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Дополнительные действия</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => {
                                        const hall = halls.find(h => h.id === table.hallId);
                                        if (hall) {
                                          handleHallSelect(hall);
                                          setViewMode('plan');
                                          setSelectedTableIds([table.id]);
                                        }
                                      }}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Показать на плане
                                      </DropdownMenuItem>
                                      
                                      {isCombined && (
                                        <DropdownMenuItem onClick={() => {
                                          setSelectedTableForDialog(table);
                                          setSeparateDialogOpen(true);
                                        }}>
                                          <GitBranch className="h-4 w-4 mr-2" />
                                          Разъединить
                                        </DropdownMenuItem>
                                      )}
                                      
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => {
                                          if (confirm('Вы уверены, что хотите удалить этот стол?')) {
                                            TablesService.deleteTable(table.id).then(() => {
                                              setAllTables(prev => prev.filter(t => t.id !== table.id));
                                              toast.success('Стол удален');
                                            }).catch(() => {
                                              toast.error('Не удалось удалить стол');
                                            });
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Удалить
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {filteredTablesForList.length === 0 && (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <TableIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Столы не найдены</h3>
                      <p className="text-gray-600">
                        {currentHall 
                          ? `В зале "${currentHall.title}" пока нет столов` 
                          : 'Выберите зал для просмотра столов'}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="reservations" className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <div className="space-y-1 flex-1 min-w-[200px]">
                      <Input
                        placeholder="Поиск бронирований..."
                        value={filters.search || ""}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                      />
                    </div>

                    <Select
                      value={filters.reservationStatus || "all"}
                      onValueChange={(value) => setFilters({...filters, reservationStatus: value === "all" ? undefined : value})}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Все статусы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value={ReservationStatus.PENDING}>Ожидает подтверждения</SelectItem>
                        <SelectItem value={ReservationStatus.CONFIRMED}>Подтверждено</SelectItem>
                        <SelectItem value={ReservationStatus.ARRIVED}>Клиент прибыл</SelectItem>
                        <SelectItem value={ReservationStatus.COMPLETED}>Завершено</SelectItem>
                        <SelectItem value={ReservationStatus.CANCELLED}>Отменено</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Клиент</TableHead>
                          <TableHead>Стол</TableHead>
                          <TableHead>Зал</TableHead>
                          <TableHead>Время</TableHead>
                          <TableHead>Гостей</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Телефон</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReservations.map(reservation => {
                          const table = allTables.find(t => t.id === reservation.tableId);
                          const hall = halls.find(h => h.id === table?.hallId);
                          
                          return (
                            <TableRow key={reservation.id}>
                              <TableCell>
                                <div className="font-medium">{reservation.customerName}</div>
                                {reservation.email && (
                                  <div className="text-xs text-gray-500">{reservation.email}</div>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{table?.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {hall?.title || 'Не указан'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(reservation.reservationTime), 'HH:mm')}
                                <div className="text-xs text-gray-500">
                                  {ReservationsService.getTimeUntilReservation(reservation.reservationTime)}
                                </div>
                              </TableCell>
                              <TableCell>{reservation.numberOfPeople}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  style={{ 
                                    backgroundColor: ReservationsService.getStatusColor(reservation.status) + '20',
                                    borderColor: ReservationsService.getStatusColor(reservation.status),
                                    color: ReservationsService.getStatusColor(reservation.status)
                                  }}
                                >
                                  {ReservationsService.getStatusLabel(reservation.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>{reservation.phone}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {reservation.status === ReservationStatus.CONFIRMED && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsArrived(reservation)}
                                      title="Отметить прибывшим"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </Button>
                                  )}
                                  
                                  {reservation.status === ReservationStatus.ARRIVED && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsCompleted(reservation)}
                                      title="Завершить"
                                    >
                                      <CheckCircle className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  )}
                                  
                                  {ReservationsService.canCancelReservation(reservation) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCancelReservation(reservation)}
                                      title="Отменить"
                                    >
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReservation(reservation);
                                      setSelectedTableForDialog(table || null);
                                      setReservationDialogOpen(true);
                                    }}
                                    title="Редактировать"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {filteredReservations.length === 0 && (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Бронирования не найдены</h3>
                      <p className="text-gray-600">
                        {currentHall 
                          ? `В зале "${currentHall.title}" на выбранную дату нет активных бронирований`
                          : 'Выберите зал для просмотра бронирований'}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Диалог бронирования */}
      <ReservationDialog
        open={reservationDialogOpen}
        onOpenChange={setReservationDialogOpen}
        table={selectedTableForDialog}
        reservation={selectedReservation}
        onSubmit={handleSubmitReservation}
        isSubmitting={isSubmitting}
      />
      
      {/* Диалог изменения статуса стола */}
      <TableStatusDialog
        open={tableStatusDialogOpen}
        onOpenChange={setTableStatusDialogOpen}
        table={selectedTableForDialog}
        onStatusChange={handleTableStatusChange}
      />
      
      {/* Диалог объединения столов (точно как на странице настроек) */}
      <CombineTablesDialog
        open={combineDialogOpen}
        onOpenChange={setCombineDialogOpen}
        tables={getTablesForSelectedHall}
        selectedTableIds={selectedTableIds}
        onCombine={handleCombineTables}
        isCombining={isCombiningTables}
      />
      
      {/* Диалог разделения столов */}
      <SeparateTablesDialog
        open={separateDialogOpen}
        onOpenChange={setSeparateDialogOpen}
        table={selectedTableForDialog}
        onSeparate={handleSeparateTables}
        isSeparating={isSeparatingTables}
      />
      
      {/* Информация о выбранном столе в режиме плана */}
      {selectedTableIds.length > 0 && viewMode === 'plan' && currentHall && (
        <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl border p-4 z-50">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-semibold">
                {selectedTableIds.length === 1 
                  ? allTables.find(t => t.id === selectedTableIds[0])?.name
                  : `Выбрано столов: ${selectedTableIds.length}`}
              </h4>
              <p className="text-sm text-gray-600">
                {selectedTableIds.length === 1 
                  ? `${allTables.find(t => t.id === selectedTableIds[0])?.seats} мест • ${currentHall.title}`
                  : `${selectedTableIds.length} столов в ${currentHall.title}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTableIds([])}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {selectedTableIds.length === 1 && (
              <>
                <div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline"
                      style={{ 
                        backgroundColor: TablesService.getStatusColor(
                          allTables.find(t => t.id === selectedTableIds[0])?.status || TableStatus.AVAILABLE
                        ) + '20',
                        borderColor: TablesService.getStatusColor(
                          allTables.find(t => t.id === selectedTableIds[0])?.status || TableStatus.AVAILABLE
                        ),
                        color: TablesService.getStatusColor(
                          allTables.find(t => t.id === selectedTableIds[0])?.status || TableStatus.AVAILABLE
                        )
                      }}
                    >
                      {TablesService.getStatusLabel(
                        allTables.find(t => t.id === selectedTableIds[0])?.status || TableStatus.AVAILABLE
                      )}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const table = allTables.find(t => t.id === selectedTableIds[0]);
                        if (table) {
                          setSelectedTableForDialog(table);
                          setTableStatusDialogOpen(true);
                        }
                      }}
                    >
                      
                    </Button>
                  </div>
                </div>
                
                {isSelectedTableCombined && (
                  <div className="p-2 bg-purple-50 rounded border border-purple-200">
                    <div className="flex items-center gap-2">
                      <GitMerge className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-700 font-medium">Объединенный стол</span>
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      Этот стол состоит из нескольких столов
                    </p>
                  </div>
                )}
                
                {getCurrentReservationForTable(selectedTableIds[0]) && (
                  <div>
                    <Label className="text-xs text-gray-500">Текущее бронирование</Label>
                    <div className="mt-1 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <div className="font-medium text-sm">
                        {getCurrentReservationForTable(selectedTableIds[0])?.customerName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {format(new Date(getCurrentReservationForTable(selectedTableIds[0])?.reservationTime || new Date()), 'HH:mm')} • 
                        {getCurrentReservationForTable(selectedTableIds[0])?.numberOfPeople} чел.
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {moveModeEnabled && (
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center gap-2">
                  <MoveIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">Режим перемещения включен</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Перетащите стол для изменения его позиции на плане
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              {selectedTableIds.length === 1 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const table = allTables.find(t => t.id === selectedTableIds[0]);
                    if (table) {
                      handleCreateReservation(table);
                    }
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Забронировать
                </Button>
              )}
              
              {selectedTableIds.length >= 2 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setCombineDialogOpen(true)}
                >
                  <Combine className="h-4 w-4 mr-2" />
                  Объединить
                </Button>
              )}
              
              {selectedTableIds.length === 1 && isSelectedTableCombined && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const table = allTables.find(t => t.id === selectedTableIds[0]);
                    if (table) {
                      setSelectedTableForDialog(table);
                      setSeparateDialogOpen(true);
                    }
                  }}
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Разъединить
                </Button>
              )}
            </div>
            
            <div className="pt-2 border-t">
              <Button
                variant={moveModeEnabled ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={toggleMoveMode}
              >
                {moveModeEnabled ? (
                  <>
                    <MoveIcon className="h-4 w-4 mr-2" />
                    Выключить перемещение
                  </>
                ) : (
                  <>
                    <MousePointer className="h-4 w-4 mr-2" />
                    Включить перемещение
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}