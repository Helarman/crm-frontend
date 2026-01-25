// app/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Square, Ruler, Trash2, Download, Grid, MousePointer, ZoomIn, ZoomOut, Move, Minus, Plus, Maximize2 } from "lucide-react";

// Типы
type WallSegment = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  isHorizontal: boolean;
};

type GridSettings = {
  cellSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
};

type DrawingMode = "wall" | "select" | "measure";
type ViewTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

// Компонент стены
function Wall({ wall, cellSize, isSelected, onClick, viewTransform }: { 
  wall: WallSegment; 
  cellSize: number; 
  isSelected: boolean; 
  onClick: () => void;
  viewTransform: ViewTransform;
}) {
  const { x1, y1, x2, y2, isHorizontal } = wall;
  
  // Вычисляем координаты для отрисовки с учетом трансформации
  const left = Math.min(x1, x2) * cellSize * viewTransform.scale;
  const top = Math.min(y1, y2) * cellSize * viewTransform.scale;
  const width = isHorizontal ? Math.abs(x2 - x1) * cellSize * viewTransform.scale + 10 : 10;
  const height = isHorizontal ? 10 : Math.abs(y2 - y1) * cellSize * viewTransform.scale + 10;
  
  // Определяем центр для метки длины
  const centerX = left + (width / 2);
  const centerY = top + (height / 2);
  
  return (
    <>
      <div
        className={`absolute bg-gray-800 hover:bg-gray-700 cursor-pointer rounded-md transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
        style={{
          left: `${left + viewTransform.translateX}px`,
          top: `${top + viewTransform.translateY}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
        onClick={onClick}
      />
      
      {/* Метка с длиной */}
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
    </>
  );
}

// Компонент временной стены при рисовании
function TempWall({ startX, startY, endX, endY, cellSize, viewTransform }: { 
  startX: number; startY: number; endX: number; endY: number; cellSize: number;
  viewTransform: ViewTransform;
}) {
  const isHorizontal = Math.abs(endX - startX) > Math.abs(endY - startY);
  
  // Корректируем координаты для горизонтальных/вертикальных стен
  let x1 = startX;
  let y1 = startY;
  let x2 = endX;
  let y2 = endY;
  
  if (isHorizontal) {
    y2 = startY;
  } else {
    x2 = startX;
  }
  
  const left = Math.min(x1, x2) * cellSize * viewTransform.scale;
  const top = Math.min(y1, y2) * cellSize * viewTransform.scale;
  const width = isHorizontal ? Math.abs(x2 - x1) * cellSize * viewTransform.scale + 10 : 10;
  const height = isHorizontal ? 10 : Math.abs(y2 - y1) * cellSize * viewTransform.scale + 10;
  
  const length = isHorizontal 
    ? Math.abs(x2 - x1) * cellSize / 40 
    : Math.abs(y2 - y1) * cellSize / 40;
  
  const centerX = left + (width / 2);
  const centerY = top + (height / 2);
  
  return (
    <>
      <div
        className="absolute bg-gray-600 opacity-70 rounded-md"
        style={{
          left: `${left + viewTransform.translateX}px`,
          top: `${top + viewTransform.translateY}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
      
      {/* Метка с длиной для временной стены */}
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
    </>
  );
}

export default function RoomDesignerPage() {
  // Состояния
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    cellSize: 40,
    showGrid: true,
    snapToGrid: true,
  });
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("wall");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWallStart, setCurrentWallStart] = useState<{ x: number; y: number } | null>(null);
  const [tempWallEnd, setTempWallEnd] = useState<{ x: number; y: number } | null>(null);
  const [roomDimensions, setRoomDimensions] = useState({ width: 10, length: 8 });
  
  // Состояния для навигации
  const [viewTransform, setViewTransform] = useState<ViewTransform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Размеры сетки
  const gridWidth = 30;
  const gridHeight = 20;

  // Преобразование координат мыши в координаты сетки с учетом масштаба и смещения
  const getGridCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Учитываем трансформацию вида
    const gridX = (x - viewTransform.translateX) / (gridSettings.cellSize * viewTransform.scale);
    const gridY = (y - viewTransform.translateY) / (gridSettings.cellSize * viewTransform.scale);
    
    return {
      x: Math.floor(gridX),
      y: Math.floor(gridY),
    };
  }, [viewTransform, gridSettings.cellSize]);

  // Начать рисование стены
  const startDrawingWall = (gridX: number, gridY: number) => {
    if (drawingMode === "wall") {
      setCurrentWallStart({ x: gridX, y: gridY });
      setIsDrawing(true);
      setTempWallEnd({ x: gridX, y: gridY });
    }
  };

  // Обновление временной стены при движении мыши
  const updateTempWall = (gridX: number, gridY: number) => {
    if (isDrawing && currentWallStart) {
      setTempWallEnd({ x: gridX, y: gridY });
    }
  };

  // Завершить рисование стены
  const finishDrawingWall = (gridX: number, gridY: number) => {
    if (isDrawing && currentWallStart) {
      const { x: startX, y: startY } = currentWallStart;
      const isHorizontal = Math.abs(gridX - startX) > Math.abs(gridY - startY);
      
      // Определяем конечные точки
      let endX = gridX;
      let endY = gridY;
      
      if (gridSettings.snapToGrid) {
        if (isHorizontal) {
          endY = startY;
        } else {
          endX = startX;
        }
      }
      
      // Рассчитываем длину (примерный масштаб: 40px = 1 метр)
      const cellSize = gridSettings.cellSize;
      const length = isHorizontal 
        ? Math.abs(endX - startX) * cellSize / 40 
        : Math.abs(endY - startY) * cellSize / 40;
      
      const newWall: WallSegment = {
        id: `wall-${Date.now()}`,
        x1: startX,
        y1: startY,
        x2: endX,
        y2: endY,
        length: Math.max(0.5, length),
        isHorizontal,
      };
      
      setWalls([...walls, newWall]);
      setCurrentWallStart(null);
      setIsDrawing(false);
      setTempWallEnd(null);
    }
  };

  // Обработчик клика по сетке
  const handleGridClick = (e: React.MouseEvent) => {
    if (isPanning) return;
    
    const { x: gridX, y: gridY } = getGridCoordinates(e.clientX, e.clientY);
    
    // Проверяем, что клик в пределах сетки
    if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
      if (!isDrawing) {
        // Начинаем рисование новой стены
        startDrawingWall(gridX, gridY);
      } else {
        // Завершаем рисование текущей стены
        finishDrawingWall(gridX, gridY);
      }
    }
  };

  // Обработчик движения мыши
  const handleMouseMove = (e: React.MouseEvent) => {
    const { x: gridX, y: gridY } = getGridCoordinates(e.clientX, e.clientY);
    
    // Проверяем, что в пределах сетки
    if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
      if (isDrawing) {
        updateTempWall(gridX, gridY);
      }
    }
    
    // Панорамирование
    if (isPanning && !isDrawing) {
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
    if (drawingMode !== "wall" && !isDrawing) {
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
    
    // Масштабирование относительно курсора
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

  // Отмена рисования
  const cancelDrawing = () => {
    setCurrentWallStart(null);
    setIsDrawing(false);
    setTempWallEnd(null);
  };

  // Удаление выбранной стены
  const deleteSelectedWall = () => {
    if (selectedWallId) {
      setWalls(walls.filter(wall => wall.id !== selectedWallId));
      setSelectedWallId(null);
    }
  };

  // Сброс всех стен
  const resetWalls = () => {
    setWalls([]);
    setSelectedWallId(null);
    setCurrentWallStart(null);
    setIsDrawing(false);
    setTempWallEnd(null);
  };

  // Экспорт проекта
  const exportProject = () => {
    const projectData = {
      walls,
      gridSettings,
      roomDimensions,
      createdAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `room-design-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Расчет общей площади
  const calculateArea = () => {
    return (roomDimensions.width * roomDimensions.length).toFixed(1);
  };

  // Расчет периметра
  const calculatePerimeter = () => {
    let perimeter = 0;
    walls.forEach(wall => {
      perimeter += wall.length;
    });
    return perimeter.toFixed(1);
  };

  // Обработка нажатия клавиши ESC для отмены рисования
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawing) {
        cancelDrawing();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing]);

  // Добавляем обработчик колеса мыши
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Конструктор помещений</h1>
        <p className="text-gray-600 mt-2">Сетка с настройкой размера. Рисуйте наружные стены, указывайте длину.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Панель управления */}
        <Card className="lg:w-80 flex-shrink-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Панель управления
            </CardTitle>
            <CardDescription>Настройте сетку и рисуйте стены</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Tabs defaultValue="tools" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="tools">Инструменты</TabsTrigger>
                <TabsTrigger value="settings">Настройки</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tools" className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-medium">Режим рисования</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={drawingMode === "wall" ? "default" : "outline"}
                      onClick={() => setDrawingMode("wall")}
                      className="flex flex-col h-auto py-3"
                    >
                      <Square className="h-5 w-5 mb-1" />
                      <span className="text-xs">Стена</span>
                    </Button>
                    
                    <Button
                      variant={drawingMode === "select" ? "default" : "outline"}
                      onClick={() => {
                        setDrawingMode("select");
                        cancelDrawing();
                      }}
                      className="flex flex-col h-auto py-3"
                    >
                      <MousePointer className="h-5 w-5 mb-1" />
                      <span className="text-xs">Выбор</span>
                    </Button>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-sm text-gray-500">
                      <strong>Как рисовать стены:</strong>
                    </p>
                    <ol className="text-xs text-gray-500 mt-1 space-y-1">
                      <li>1. Выберите режим "Стена"</li>
                      <li>2. Кликните на сетке для начала стены</li>
                      <li>3. Переместите мышь и кликните для завершения</li>
                      <li>4. Нажмите ESC для отмены рисования</li>
                    </ol>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">Навигация</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={zoomIn}
                      title="Приблизить"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetView}
                      title="Сбросить вид"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={zoomOut}
                      title="Отдалить"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    • Колесо мыши: масштабирование
                    <br/>
                    • Зажатая правая кнопка: панорамирование
                    <br/>
                    • Текущий масштаб: {Math.round(viewTransform.scale * 100)}%
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">Управление стенами</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={deleteSelectedWall}
                      disabled={!selectedWallId}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить выбранную
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetWalls}
                      className="flex-1"
                    >
                      Сбросить все
                    </Button>
                  </div>
                  
                  {isDrawing && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={cancelDrawing}
                      className="w-full"
                    >
                      Отменить рисование (ESC)
                    </Button>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cellSize">Размер ячейки сетки: {gridSettings.cellSize}px</Label>
                  
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showGrid">Показать сетку</Label>
                    <Switch
                      id="showGrid"
                      checked={gridSettings.showGrid}
                      onCheckedChange={(checked) => setGridSettings({...gridSettings, showGrid: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="snapToGrid">Привязка к сетке</Label>
                    <Switch
                      id="snapToGrid"
                      checked={gridSettings.snapToGrid}
                      onCheckedChange={(checked) => setGridSettings({...gridSettings, snapToGrid: checked})}
                    />
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <h3 className="font-medium">Размеры помещения</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="width">Ширина (м)</Label>
                      <Input
                        id="width"
                        type="number"
                        min="1"
                        max="50"
                        value={roomDimensions.width}
                        onChange={(e) => setRoomDimensions({...roomDimensions, width: parseFloat(e.target.value) || 1})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="length">Длина (м)</Label>
                      <Input
                        id="length"
                        type="number"
                        min="1"
                        max="50"
                        value={roomDimensions.length}
                        onChange={(e) => setRoomDimensions({...roomDimensions, length: parseFloat(e.target.value) || 1})}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="pt-4 border-t">
              <div className="space-y-3">
                <h3 className="font-medium">Статистика</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-xs text-blue-600">Периметр</p>
                    <p className="text-lg font-bold">{calculatePerimeter()} м</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-xs text-green-600">Площадь</p>
                    <p className="text-lg font-bold">{calculateArea()} м²</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-600">Количество стен</p>
                  <p className="text-lg font-bold">{walls.length}</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={exportProject} 
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Экспортировать проект
            </Button>
          </CardContent>
        </Card>

        {/* Область рисования */}
        <Card className="flex-1">
          <CardHeader>
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Grid className="h-5 w-5" />
                  Область проектирования
                </CardTitle>
                <CardDescription>
                  {isDrawing 
                    ? "Рисуйте стену: кликните для начала, переместите, кликните для завершения" 
                    : "Кликните на сетке, чтобы начать рисовать стену"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
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
                <div className="text-sm text-gray-500">
                  Сетка: {gridWidth} × {gridHeight}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div 
              ref={containerRef}
              className="relative border border-gray-300 rounded-md bg-white overflow-hidden cursor-crosshair"
              style={{ 
                height: "600px",
                backgroundSize: `${gridSettings.cellSize * viewTransform.scale}px ${gridSettings.cellSize * viewTransform.scale}px`,
                backgroundImage: gridSettings.showGrid 
                  ? `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)` 
                  : 'none',
                backgroundPosition: `${viewTransform.translateX}px ${viewTransform.translateY}px`,
                cursor: isPanning ? 'grabbing' : 'crosshair'
              }}
              onClick={handleGridClick}
              onMouseMove={handleMouseMove}
              onMouseDown={startPanning}
              onMouseUp={stopPanning}
              onMouseLeave={stopPanning}
              onContextMenu={(e) => e.preventDefault()} // Отключаем контекстное меню для правой кнопки
            >
              {/* Нарисованные стены */}
              {walls.map(wall => (
                <Wall
                  key={wall.id}
                  wall={wall}
                  cellSize={gridSettings.cellSize}
                  isSelected={selectedWallId === wall.id}
                  onClick={() => {
                    if (drawingMode === "select") {
                      setSelectedWallId(wall.id);
                    }
                  }}
                  viewTransform={viewTransform}
                />
              ))}
              
              {/* Точка начала рисования */}
              {currentWallStart && (
                <div
                  className="absolute w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow z-10"
                  style={{
                    left: `${currentWallStart.x * gridSettings.cellSize * viewTransform.scale + viewTransform.translateX - 6}px`,
                    top: `${currentWallStart.y * gridSettings.cellSize * viewTransform.scale + viewTransform.translateY - 6}px`,
                  }}
                />
              )}
              
              {/* Временная стена при рисовании */}
              {isDrawing && currentWallStart && tempWallEnd && (
                <TempWall
                  startX={currentWallStart.x}
                  startY={currentWallStart.y}
                  endX={tempWallEnd.x}
                  endY={tempWallEnd.y}
                  cellSize={gridSettings.cellSize}
                  viewTransform={viewTransform}
                />
              )}
              
              {/* Подсказка */}
              {walls.length === 0 && !isDrawing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center p-6 bg-white/90 rounded-lg max-w-md shadow-lg">
                    <Grid className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-medium text-lg mb-2">Начните проектирование</h3>
                    <p className="text-gray-600 mb-4">
                      Выберите режим "Стена" и кликните на сетке, чтобы нарисовать первую стену.
                    </p>
                    <div className="text-sm text-gray-500 text-left inline-block">
                      <p>• Выберите инструмент "Стена"</p>
                      <p>• Кликните на сетке для начала стены</p>
                      <p>• Переместите мышь и кликните для завершения</p>
                      <p>• ESC - отмена рисования</p>
                      <p>• Колесо мыши - масштабирование</p>
                      <p>• Правая кнопка мыши - панорамирование</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Подсказка при рисовании */}
              {isDrawing && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                  <p className="text-sm font-medium">Рисование стены</p>
                  <p className="text-xs">Кликните для завершения • ESC для отмены</p>
                </div>
              )}
              
              {/* Индикатор панорамирования */}
              {isPanning && (
                <div className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Move className="h-4 w-4 animate-pulse" />
                  Панорамирование...
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                {selectedWallId 
                  ? `Выбрана стена длиной ${walls.find(w => w.id === selectedWallId)?.length.toFixed(1)} м` 
                  : isDrawing
                  ? "Рисуется новая стена..."
                  : "Выберите стену или начните рисовать"}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-3 bg-gray-800 rounded"></div>
                  <span>Готовая стена</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-3 bg-gray-600 opacity-70 rounded"></div>
                  <span>Рисуемая стена</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span>Начало стены</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <footer className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>Конструктор помещений • Только наружные стены • Версия 1.1</p>
        <p className="mt-1">Управление: колесо мыши - масштабирование, правая кнопка - панорамирование, ESC - отмена</p>
      </footer>
    </div>
  );
}