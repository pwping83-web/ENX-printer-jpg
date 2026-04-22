import { useRef, useEffect, useState } from 'react';
import { Shape, UploadedImage } from '../types';

/**
 * Canvas component - Displays all shapes in a grid layout
 * 캔버스 컴포넌트 - 모든 도형을 격자 형태로 표시
 */
interface CanvasProps {
  shapes: Shape[];
  images: UploadedImage[];
  selectedShapeId: string | null;
  canvasOffsetX: number; // Origin offset X (mm)
  canvasOffsetY: number; // Origin offset Y (mm)
  imageScale: number; // Image scale percentage
  paperSize: 'A2' | 'A3' | 'A4' | 'A5';
  zoomMode?: boolean;
  onShapeClick: (shapeId: string) => void;
  onImageMove: (shapeId: string, offsetX: number, offsetY: number) => void;
  onImageScaleChange: (scale: number) => void;
}

// Paper sizes in millimeters
// 용지 크기 (밀리미터)
const PAPER_SIZES = {
  A2: { width: 420, height: 594 },
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 160, height: 160 },
};

export function Canvas({ 
  shapes, 
  images, 
  selectedShapeId, 
  canvasOffsetX, 
  canvasOffsetY, 
  imageScale,
  paperSize,
  zoomMode,
  onShapeClick, 
  onImageMove,
  onImageScaleChange,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Drag state for image movement
  // 이미지 이동을 위한 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Pinch zoom state for mobile
  // 모바일 핀치 줌 상태 (캔버스 뷰 확대/축소)
  const [isPinching, setIsPinching] = useState(false);
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  
  // Canvas view zoom state for mobile
  // 모바일 캔버스 뷰 줌 상태
  const [viewZoom, setViewZoom] = useState(1);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [initialViewOffset, setInitialViewOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse wheel scaling state
  // 마우스 휠 스케일링 상태
  const [isScaling, setIsScaling] = useState(false); 
  const [scaleStart, setScaleStart] = useState({ x: 0, y: 0, scale: 100 });

  // DPI and paper size constants
  // DPI 및 용지 크기 상수
  const DPI = 150;
  const MM_TO_PX = DPI / 25.4;
  const PAPER_WIDTH_PX = Math.round(PAPER_SIZES[paperSize].width * MM_TO_PX);
  const PAPER_HEIGHT_PX = Math.round(PAPER_SIZES[paperSize].height * MM_TO_PX);

  // Draw canvas with shapes
  // 도형과 함께 캔버스 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = PAPER_WIDTH_PX;
    canvas.height = PAPER_HEIGHT_PX;

    // White background
    // 흰색 배경
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PAPER_WIDTH_PX, PAPER_HEIGHT_PX);

    // Start point marker for printer recognition (top-left black pixel)
    // 프린터 인식용 시작점 표시 (좌상단 검은 픽셀)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1, 1);

    // Draw grid lines
    // 격자선 그리기
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < PAPER_WIDTH_PX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, PAPER_HEIGHT_PX);
      ctx.stroke();
    }
    for (let y = 0; y < PAPER_HEIGHT_PX; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(PAPER_WIDTH_PX, y);
      ctx.stroke();
    }

    // Draw all shapes
    // 모든 도형 그리기
    shapes.forEach((shape) => {
      const image = images.find((img) => img.id === shape.imageId);
      const isSelected = shape.id === selectedShapeId;
      
      const displayX = shape.x;
      const displayY = shape.y;

      const strokeColor = isSelected ? '#4f46e5' : '#e2e8f0'; 
      const lineWidth = isSelected ? 3 : 1.5;

      if (shape.type === 'circle') {
        const centerX = displayX + shape.width / 2;
        const centerY = displayY + shape.height / 2;
        const radius = Math.max(1, shape.width / 2); 

        if (image?.image) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.clip();

          const scale = (shape.imageScale || 100) / 100;
          const imgOffsetX = shape.imageOffsetX || 0;
          const imgOffsetY = shape.imageOffsetY || 0;
          
          const imgAspect = image.image.width / image.image.height;
          let drawWidth, drawHeight;
          const targetSize = radius * 2;
          
          if (imgAspect > 1) {
            drawHeight = targetSize * scale;
            drawWidth = drawHeight * imgAspect;
          } else {
            drawWidth = targetSize * scale;
            drawHeight = drawWidth / imgAspect;
          }

          const drawX = centerX - drawWidth / 2 + imgOffsetX;
          const drawY = centerY - drawHeight / 2 + imgOffsetY;

          ctx.drawImage(image.image, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        }

        if (shape.text) {
          const fontSize = shape.fontSize || 24;
          const textColor = shape.textColor || '#000000';
          const fontFamily = shape.fontFamily || 'Nanum Gothic';
          const textCurved = shape.textCurved || false;
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.clip();
          
          ctx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
          ctx.fillStyle = textColor;
          
          ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          if (textCurved && shape.type === 'circle') {
            const text = shape.text.replace(/\n/g, ' '); 
            const curveAmount = (shape.textCurveAmount || 20) / 100; 
            const spreadAngle = Math.PI * 1.5 * curveAmount; 
            const anglePerChar = spreadAngle / text.length; 
            const startAngle = -Math.PI / 2 - (anglePerChar * text.length) / 2;
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textOffX = shape.textOffsetX || 0;
            const textOffY = shape.textOffsetY || 0;
            
            for (let i = 0; i < text.length; i++) {
              const angle = startAngle + anglePerChar * i;
              const x = centerX + textOffX + Math.cos(angle) * (radius - fontSize / 2);
              const y = centerY + textOffY + Math.sin(angle) * (radius - fontSize / 2);
              
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(angle + Math.PI / 2);
              ctx.fillText(text[i], 0, 0);
              ctx.restore();
            }
          } else {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const lines = shape.text.split('\n');
            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;
            
            const textOffX = shape.textOffsetX || 0;
            const textOffY = shape.textOffsetY || 0;
            const startY = centerY - totalHeight / 2 + lineHeight / 2 + textOffY;
            
            lines.forEach((line, index) => {
              ctx.fillText(line, centerX + textOffX, startY + index * lineHeight);
            });
          }
          
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

      } else {
        // 사각형 — 내보내기와 동일하게 전체 shape 영역 사용
        if (image?.image) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(displayX, displayY, shape.width, shape.height);
          ctx.clip();

          const scale = (shape.imageScale || 100) / 100;
          const imgOffsetX = shape.imageOffsetX || 0;
          const imgOffsetY = shape.imageOffsetY || 0;
          
          const imgAspect = image.image.width / image.image.height;
          const shapeAspect = shape.width / shape.height;
          let drawWidth, drawHeight, imgDrawX, imgDrawY;

          if (imgAspect > shapeAspect) {
            drawHeight = shape.height * scale;
            drawWidth = drawHeight * imgAspect;
          } else {
            drawWidth = shape.width * scale;
            drawHeight = drawWidth / imgAspect;
          }

          const centerX = displayX + shape.width / 2;
          const centerY = displayY + shape.height / 2;
          imgDrawX = centerX - drawWidth / 2 + imgOffsetX;
          imgDrawY = centerY - drawHeight / 2 + imgOffsetY;

          ctx.drawImage(image.image, imgDrawX, imgDrawY, drawWidth, drawHeight);
          ctx.restore();
        }

        if (shape.text) {
          const fontSize = shape.fontSize || 24;
          const textColor = shape.textColor || '#000000';
          const fontFamily = shape.fontFamily || 'Nanum Gothic';
          const centerX = displayX + shape.width / 2;
          const centerY = displayY + shape.height / 2;
          
          ctx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const lines = shape.text.split('\n');
          const lineHeight = fontSize * 1.2;
          const totalHeight = lines.length * lineHeight;
          
          const textOffX = shape.textOffsetX || 0;
          const textOffY = shape.textOffsetY || 0;
          const startY = centerY - totalHeight / 2 + lineHeight / 2 + textOffY;
          
          lines.forEach((line, index) => {
            ctx.fillText(line, centerX + textOffX, startY + index * lineHeight);
          });
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(displayX, displayY, shape.width, shape.height);
      }
      
      if (isSelected && image?.image) {
        const handleSize = 24; 
        const handleX = displayX + shape.width - handleSize / 2;
        const handleY = displayY + shape.height - handleSize / 2;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(handleX + handleSize / 2, handleY + handleSize / 2, handleSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const centerX = handleX + handleSize / 2;
        const centerY = handleY + handleSize / 2;
        
        ctx.beginPath();
        ctx.arc(centerX - 1.5, centerY - 1.5, 4.5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + 2, centerY + 2);
        ctx.lineTo(centerX + 6, centerY + 6);
        ctx.stroke();
      }
    });
  }, [shapes, images, selectedShapeId, canvasOffsetX, canvasOffsetY, PAPER_WIDTH_PX, PAPER_HEIGHT_PX, MM_TO_PX]);

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const findShapeAtPosition = (x: number, y: number): Shape | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.type === 'circle') {
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;
        const radius = shape.width / 2;
        if (Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) <= radius) return shape;
      } else {
        if (x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height) return shape;
      }
    }
    return null;
  };

  const isOnScaleHandle = (x: number, y: number, shape: Shape): boolean => {
    const handleSize = 24; 
    const handleX = shape.x + shape.width;
    const handleY = shape.y + shape.height;
    return (
      x >= handleX - handleSize && x <= handleX + handleSize &&
      y >= handleY - handleSize && y <= handleY + handleSize
    );
  };

  const handleStart = (clientX: number, clientY: number) => {
    const { x, y } = getCanvasCoordinates(clientX, clientY);
    if (selectedShapeId) {
      const selectedShape = shapes.find(s => s.id === selectedShapeId);
      if (selectedShape && selectedShape.imageId && isOnScaleHandle(x, y, selectedShape)) {
        setIsScaling(true);
        setScaleStart({ x, y, scale: selectedShape.imageScale || 100 });
        return;
      }
    }
    const shape = findShapeAtPosition(x, y);
    if (shape) {
      onShapeClick(shape.id);
      setIsDragging(true);
      setDragStart({ x, y });
    } else {
      onShapeClick('');
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (isScaling && selectedShapeId) {
      const { x, y } = getCanvasCoordinates(clientX, clientY);
      const deltaX = x - scaleStart.x;
      const deltaY = y - scaleStart.y;
      const scaleChange = ((deltaX + deltaY) / 2) * 0.2;
      onImageScaleChange(Math.max(50, Math.min(200, scaleStart.scale + scaleChange)));
    } else if (isDragging && selectedShapeId) {
      const { x, y } = getCanvasCoordinates(clientX, clientY);
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      const selectedShape = shapes.find(s => s.id === selectedShapeId);
      if (selectedShape) {
        onImageMove(selectedShapeId, (selectedShape.imageOffsetX || 0) + deltaX, (selectedShape.imageOffsetY || 0) + deltaY);
      }
      setDragStart({ x, y });
    }
  };

  const handleEnd = () => { setIsDragging(false); setIsPinching(false); setIsScaling(false); setIsPanning(false); };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      // 줌 상태에서 한 손가락: 도형 위면 드래그, 아니면 패닝
      if (viewZoom > 1) {
        const { x, y } = getCanvasCoordinates(e.touches[0].clientX, e.touches[0].clientY);
        const shape = findShapeAtPosition(x, y);
        if (shape) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        } else {
          setIsPanning(true);
          setPanStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
          setInitialViewOffset({ ...viewOffset });
        }
      } else {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    } else if (e.touches.length === 2) {
      // 두 손가락: 캔버스 뷰 확대/축소
      setIsPinching(true);
      setIsDragging(false);
      setIsPanning(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialPinchDistance(dist);
      setInitialScale(viewZoom);
      // 핀치 중심점 저장
      setPanStart({
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      });
      setInitialViewOffset({ ...viewOffset });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 1 && !isPinching) {
      if (isPanning && viewZoom > 1) {
        // 패닝 (확대 상태에서 한 손가락으로 이동)
        const dx = e.touches[0].clientX - panStart.x;
        const dy = e.touches[0].clientY - panStart.y;
        setViewOffset({
          x: initialViewOffset.x + dx,
          y: initialViewOffset.y + dy,
        });
      } else {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    } else if (e.touches.length === 2 && isPinching) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newZoom = Math.max(1, Math.min(5, (dist / initialPinchDistance) * initialScale));
      setViewZoom(newZoom);

      // 핀치 중심점 이동 추적
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setViewOffset({
        x: initialViewOffset.x + (midX - panStart.x),
        y: initialViewOffset.y + (midY - panStart.y),
      });
    }
  };

  // 줌 초기화
  const resetZoom = () => {
    setViewZoom(1);
    setViewOffset({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-slate-100/80 dark:bg-slate-900/80 overflow-hidden p-1 sm:p-12 flex items-center justify-center custom-scrollbar relative"
    >
      {/* 줌 레벨 표시 & 초기화 버튼 (모바일, 줌 상태일 때만) */}
      {viewZoom > 1 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 sm:hidden">
          <button
            onClick={resetZoom}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <span>{Math.round(viewZoom * 100)}%</span>
            <span className="opacity-60">×</span>
          </button>
        </div>
      )}
      
      {/* 종이가 책상 위에 떠 있는 듯한 깊은 그림자 및 테두리 효과 적용 */}
      <div 
        className="relative bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-slate-200/60 dark:ring-slate-700/50 m-auto transition-shadow duration-300"
        style={{
          transform: `scale(${viewZoom}) translate(${viewOffset.x / viewZoom}px, ${viewOffset.y / viewZoom}px)`,
          transformOrigin: 'center center',
        }}
      >
        <canvas
          ref={canvasRef}
          className="touch-none block"
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleEnd}
        />
      </div>
    </div>
  );
}