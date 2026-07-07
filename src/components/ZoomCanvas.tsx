import React, { useRef, useEffect, useState } from 'react';
import { Shape, UploadedImage } from '../types';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { ZoomIn, ZoomOut, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * ZoomCanvas component - Displays shape #1 in zoomed view for detailed editing
 * ZoomCanvas 컴포넌트 - 1번 도형을 확대하여 상세 편집 가능
 */
interface ZoomCanvasProps {
  shapes: Shape[];
  images: UploadedImage[];
  paperSize: 'A2' | 'A3' | 'A4' | 'A5';
  zoomMode: boolean;
  onZoomModeToggle: () => void;
  onImageMove: (shapeId: string, offsetX: number, offsetY: number) => void;
  onImageScaleChange: (scale: number) => void;
  onTextOffsetChange?: (offsetX: number, offsetY: number) => void;
  onCenterImageVertical?: () => void;
  onCenterImageHorizontal?: () => void;
  onCenterTextVertical?: () => void;
  onCenterTextHorizontal?: () => void;
}

// Paper sizes in millimeters
// 용지 크기 (밀리미터)
const PAPER_SIZES = {
  A2: { width: 420, height: 594 },
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 160, height: 160 },
};

export function ZoomCanvas({
  shapes,
  images,
  paperSize,
  zoomMode,
  onZoomModeToggle,
  onImageMove,
  onImageScaleChange,
  onTextOffsetChange,
  onCenterImageVertical,
  onCenterImageHorizontal,
  onCenterTextVertical,
  onCenterTextHorizontal,
}: ZoomCanvasProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentScale, setCurrentScale] = useState(1);
  const [isHoverText, setIsHoverText] = useState(false); // Hover state for text area / 텍스트 영역 호버 여부
  const [isDraggingText, setIsDraggingText] = useState(false); // 텍스트 드래그 중 상태
  
  // Use useRef for drag state management (prevent useEffect re-execution)
  // useRef로 드래그 상태 관리 (useEffect 재실행 방지)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragModeRef = useRef<'image' | 'text'>('image');
  
  // Track latest firstShape value with useRef
  // firstShape의 최신 값을 useRef로 추적
  const firstShapeRef = useRef<Shape | undefined>(shapes[0]);
  const imagesRef = useRef<UploadedImage[]>(images);

  const DPI = 150;
  const MM_TO_PX = DPI / 25.4;

  // Get first shape (shape #1)
  // 첫 번째 도형 가져오기
  const firstShape = shapes[0];
  
  // Update refs when data changes
  // ref 업데이트
  useEffect(() => {
    firstShapeRef.current = firstShape;
    imagesRef.current = images;
  }, [firstShape, images]);

  // Canvas drawing function
  // 캔버스 그리기 함수
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    image: UploadedImage | undefined,
    scale: number = 1,
    highlight: boolean = false
  ) => {
    const displayX = shape.x * scale;
    const displayY = shape.y * scale;
    const width = shape.width * scale;
    const height = shape.height * scale;

    if (shape.type === 'circle') {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(1, Math.min(width, height) / 2); // 최소값 1로 보호

      // 이미지
      if (image?.image) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();

        const imgScale = (shape.imageScale || 100) / 100;
        const imgOffsetX = (shape.imageOffsetX || 0) * scale;
        const imgOffsetY = (shape.imageOffsetY || 0) * scale;

        const imgAspect = image.image.width / image.image.height;
        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > 1) {
          drawHeight = height * imgScale;
          drawWidth = drawHeight * imgAspect;
        } else {
          drawWidth = width * imgScale;
          drawHeight = drawWidth / imgAspect;
        }

        drawX = centerX - drawWidth / 2 + imgOffsetX;
        drawY = centerY - drawHeight / 2 + imgOffsetY;

        ctx.drawImage(image.image, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      }

      // 텍스트
      if (shape.text) {
        const fontSize = (shape.fontSize || 24) * scale;
        const textColor = shape.textColor || '#000000';
        const fontFamily = shape.fontFamily || 'Nanum Gothic';
        const textCurved = shape.textCurved || false;

        // 텍스트도 원형 클리핑 적용
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();

        ctx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
        ctx.fillStyle = textColor;

        if (textCurved) {
          const text = shape.text.replace(/\n/g, ' ');
          const curveAmount = (shape.textCurveAmount || 20) / 100;
          const spreadAngle = Math.PI * 1.5 * curveAmount;
          const anglePerChar = spreadAngle / text.length;
          const startAngle = -Math.PI / 2 - (anglePerChar * text.length) / 2;

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const textOffX = (shape.textOffsetX || 0) * scale;
          const textOffY = (shape.textOffsetY || 0) * scale;

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
          const textOffX = (shape.textOffsetX || 0) * scale;
          const textOffY = (shape.textOffsetY || 0) * scale;
          const startY = centerY - totalHeight / 2 + lineHeight / 2 + textOffY;

          lines.forEach((line, index) => {
            ctx.fillText(line, centerX + textOffX, startY + index * lineHeight);
          });
        }
        
        ctx.restore(); // 클리핑 해제
      }

      // 테두리
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = highlight ? '#3B82F6' : '#CCCCCC';
      ctx.lineWidth = highlight ? 4 * scale : 2 * scale;
      ctx.stroke();
    } else {
      // 사각형
      if (image?.image) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(displayX, displayY, width, height);
        ctx.clip();

        const imgScale = (shape.imageScale || 100) / 100;
        const imgOffsetX = (shape.imageOffsetX || 0) * scale;
        const imgOffsetY = (shape.imageOffsetY || 0) * scale;

        const imgAspect = image.image.width / image.image.height;
        const shapeAspect = width / height;
        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > shapeAspect) {
          drawHeight = height * imgScale;
          drawWidth = drawHeight * imgAspect;
        } else {
          drawWidth = width * imgScale;
          drawHeight = drawWidth / imgAspect;
        }

        const centerX = displayX + width / 2;
        const centerY = displayY + height / 2;
        drawX = centerX - drawWidth / 2 + imgOffsetX;
        drawY = centerY - drawHeight / 2 + imgOffsetY;

        ctx.drawImage(image.image, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      }

      if (shape.text) {
        const fontSize = (shape.fontSize || 24) * scale;
        const textColor = shape.textColor || '#000000';
        const fontFamily = shape.fontFamily || 'Nanum Gothic';
        const centerX = displayX + width / 2;
        const centerY = displayY + height / 2;

        ctx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lines = shape.text.split('\n');
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const textOffX = (shape.textOffsetX || 0) * scale;
        const textOffY = (shape.textOffsetY || 0) * scale;
        const startY = centerY - totalHeight / 2 + lineHeight / 2 + textOffY;

        lines.forEach((line, index) => {
          ctx.fillText(line, centerX + textOffX, startY + index * lineHeight);
        });
      }

      ctx.strokeStyle = highlight ? '#3B82F6' : '#CCCCCC';
      ctx.lineWidth = highlight ? 4 * scale : 2 * scale;
      ctx.strokeRect(displayX, displayY, width, height);
    }
  };

  // 메인 캔버스 그리기 (확대 모드)
  useEffect(() => {
    if (!zoomMode || !firstShape) return;

    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const redraw = () => {
      // 화면 크기 가져오기 (툴바와 여백 고려)
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 모바일 여부 확인
      const isMobile = viewportWidth < 640; // sm breakpoint
      
      // 모바일: 상단 메뉴바(44px) + 툴바(44px) + 하단네비(70px) + 여백(20px) = 178px
      // 데스크톱: 상단 메뉴바(44px) + 여백(60px) = 104px
      const availableHeight = isMobile ? viewportHeight - 178 : viewportHeight - 104;
      const availableWidth = viewportWidth - 24; // 좌우 여백 최소화

      // 🎯 너비와 높이를 각각 가져옵니다!
      const shapeWidth = firstShape.width;
      const shapeHeight = firstShape.height;

      // 🎯 가로, 세로에 대해 모두 비율을 계산합니다!
      const scaleByWidth = availableWidth / shapeWidth;
      const scaleByHeight = availableHeight / shapeHeight;
      const optimalScale = Math.min(scaleByWidth, scaleByHeight) * 0.95;

      const scaledWidth = shapeWidth * optimalScale;
      const scaledHeight = shapeHeight * optimalScale;

      // 🎯 테두리(lineWidth)가 원 바깥으로 절반 나가므로 패딩 추가
      const borderLineWidth = 4 * optimalScale;
      const ZOOM_PAD = Math.ceil(borderLineWidth / 2) + 6;

      // 🎯 직사각형에 맞춰 캔버스 크기 지정
      canvas.width = scaledWidth + ZOOM_PAD * 2;
      canvas.height = scaledHeight + ZOOM_PAD * 2;

      // 배경 - 투명
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 흰색 배경 (캔버스 자체)
      ctx.fillStyle = '#F9FAFB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 패딩만큼 이동하여 도형이 캔버스 안에 완전히 들어오도록 그리기
      ctx.save();
      ctx.translate(ZOOM_PAD, ZOOM_PAD);

      // 🎯 직사각형 사이즈를 온전히 반영하여 렌더링
      const zoomedShape = {
        ...firstShape,
        x: 0,
        y: 0,
        width: shapeWidth,
        height: shapeHeight,
      };

      const image = images.find((img) => img.id === firstShape.imageId);
      drawShape(ctx, zoomedShape, image, optimalScale, true);
      ctx.restore();
      
      // 현재 스케일 업데이트
      setCurrentScale(optimalScale);
    };

    // 초기 그리기 — 레이아웃 확정 후 캔버스를 그려 로그인 직후 하얀 화면 방지
    let rafId = 0;
    const scheduleRedraw = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          redraw();
        });
      });
    };

    scheduleRedraw();

    // 리사이즈 이벤트 핸들러
    const handleResize = () => {
      scheduleRedraw();
    };

    window.addEventListener('resize', handleResize);

    const container = canvas.parentElement;
    const resizeObserver = container
      ? new ResizeObserver(() => scheduleRedraw())
      : null;
    if (resizeObserver && container) {
      resizeObserver.observe(container);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomMode, firstShape, images, shapes]);

  // 마우스/터치 이벤트 핸들러
  useEffect(() => {
    if (!zoomMode || !firstShape) return;

    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const image = images.find((img) => img.id === firstShape.imageId);

    // 화면 크기에 따른 스케일 계산
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 640;
    const availableHeight = isMobile ? viewportHeight - 178 : viewportHeight - 104;
    const availableWidth = viewportWidth - 24;
    // 🎯 이벤트 핸들러 스케일도 너비/높이 분리
    const shapeWidth = firstShape.width;
    const shapeHeight = firstShape.height;
    const scaleByWidth = availableWidth / shapeWidth;
    const scaleByHeight = availableHeight / shapeHeight;
    const optimalScale = Math.min(scaleByWidth, scaleByHeight) * 0.95; // drawing과 동일한 스케일
    
    setCurrentScale(optimalScale);

    // 캔버스 상의 마우스 좌표 계산
    const getCanvasCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      // CSS 표시 크기와 캔버스 내부 상도 비율 보정
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };
    
    // 텍스트 영역 확인 함수 - 실제 텍스트 바운딩 박스 기반
    const isInTextArea = (canvasX: number, canvasY: number) => {
      const currentShape = firstShapeRef.current;
      if (!currentShape || !currentShape.text) return false;
      
      // 캔버스 중심 = 도형 중심 (캔버스 크기에서 직접 계산)
      const shapeCenterX = canvas.width / 2;
      const shapeCenterY = canvas.height / 2;
      
      // 실제 캔버스에 그려진 스케일 계산 (drawing useEffect와 동일하게)
      const availH = isMobile ? window.innerHeight - 178 : window.innerHeight - 104;
      const availW = window.innerWidth - 24;
      // 🎯 텍스트 드래그 위치 계산 스케일도 너비/높이 분리
      const drawScale = Math.min(availW / currentShape.width, availH / currentShape.height) * 0.95;
      
      const fontSize = (currentShape.fontSize || 24) * drawScale;
      const fontFamily = currentShape.fontFamily || 'Nanum Gothic';
      const textOffX = (currentShape.textOffsetX || 0) * drawScale;
      const textOffY = (currentShape.textOffsetY || 0) * drawScale;
      
      // measureText 실제 텍스트 너비 계산
      const tempCtx = canvas.getContext('2d');
      if (!tempCtx) return false;
      
      tempCtx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
      
      const lines = currentShape.text.split('\n');
      const lineHeight = fontSize * 1.2;
      const totalHeight = lines.length * lineHeight;
      
      // 각 줄의 최대 너비 계산
      let maxWidth = 0;
      lines.forEach((line) => {
        const metrics = tempCtx.measureText(line);
        if (metrics.width > maxWidth) maxWidth = metrics.width;
      });
      
      // 최소 히트 영역 보장 (fontSize 기반)
      maxWidth = Math.max(maxWidth, fontSize * 2);
      const hitHeight = Math.max(totalHeight, fontSize * 2);
      
      // 텍스트 바운딩 박스 (여유 패딩 추가)
      const pad = fontSize * 0.5;
      const textLeft = shapeCenterX + textOffX - maxWidth / 2 - pad;
      const textRight = shapeCenterX + textOffX + maxWidth / 2 + pad;
      const textTop = shapeCenterY + textOffY - hitHeight / 2 - pad;
      const textBottom = shapeCenterY + textOffY + hitHeight / 2 + pad;
      
      return canvasX >= textLeft && canvasX <= textRight && canvasY >= textTop && canvasY <= textBottom;
    };

    const handleStart = (clientX: number, clientY: number) => {
      const coords = getCanvasCoords(clientX, clientY);
      
      // 텍스트가 있고 텍스트 영역 클릭 시 텍스트 드래그 모드
      if (firstShape.text && isInTextArea(coords.x, coords.y)) {
        dragModeRef.current = 'text';
        setIsHoverText(true);
        setIsDraggingText(true);
      } else {
        // 그 외에는 이미지 드래그 모드
        dragModeRef.current = 'image';
        setIsHoverText(false);
        setIsDraggingText(false);
      }
      
      isDraggingRef.current = true;
      dragStartRef.current = { x: clientX, y: clientY };
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) {
        // 호버 감지
        const coords = getCanvasCoords(clientX, clientY);
        if (firstShape.text && isInTextArea(coords.x, coords.y)) {
          setIsHoverText(true);
        } else {
          setIsHoverText(false);
        }
        return;
      }

      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      // 스케일을 고려한 실제 이동량 계산
      const actualDeltaX = deltaX / optimalScale;
      const actualDeltaY = deltaY / optimalScale;

      // 최신 firstShape 값 사용
      const currentShape = firstShapeRef.current;
      if (!currentShape) return;

      if (dragModeRef.current === 'text') {
        // 텍스트 이동
        const currentOffsetX = currentShape.textOffsetX || 0;
        const currentOffsetY = currentShape.textOffsetY || 0;

        let newOffsetX = currentOffsetX + actualDeltaX;
        let newOffsetY = currentOffsetY + actualDeltaY;

        // 텍스트 이동 범위: 도형 크기 기반으로 자유롭게 이동 가능
        const maxOffset = currentShape.width;
        newOffsetX = Math.max(-maxOffset, Math.min(maxOffset, newOffsetX));
        newOffsetY = Math.max(-maxOffset, Math.min(maxOffset, newOffsetY));

        if (onTextOffsetChange) {
          onTextOffsetChange(newOffsetX, newOffsetY);
        }
      } else {
        // 이미지 이동 (모든 방향)
        const currentOffsetX = currentShape.imageOffsetX || 0;
        const currentOffsetY = currentShape.imageOffsetY || 0;

        let newOffsetX = currentOffsetX + actualDeltaX;
        let newOffsetY = currentOffsetY + actualDeltaY;

        onImageMove(currentShape.id, newOffsetX, newOffsetY);
      }

      dragStartRef.current = { x: clientX, y: clientY };
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      setIsDraggingText(false);
    };

    // 마우스 이벤트
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleStart(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        handleMove(e.clientX, e.clientY);
      } else {
        // 호버 감지
        handleMove(e.clientX, e.clientY);
      }
    };

    const onMouseUp = () => {
      handleEnd();
    };

    // 터치 이벤트
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    // 이벤트 리스너 등록
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [zoomMode, firstShape, images, onImageMove, onTextOffsetChange]);

  if (!zoomMode) return null;

  return (
    <div className="relative flex-1 bg-slate-100/80 dark:bg-slate-900/80 overflow-hidden flex items-center justify-center p-1 sm:p-12">
      {/* Zoomed shape #1 */}
      <div className="relative transition-transform duration-300">
        <canvas
          ref={mainCanvasRef}
          className={`ring-1 ring-indigo-400/20 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(79,70,229,0.3)] rounded-2xl bg-white max-w-full max-h-full ${isDraggingText ? 'cursor-grabbing' : isHoverText ? 'cursor-grab' : 'cursor-move'}`}
          style={{ touchAction: 'none' }}
        />
      </div>
      
      {/* Alignment controls - Floating pill */}
      {(images.length > 0 && firstShape?.imageId || firstShape?.text) && (
        <div className="absolute top-6 left-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-3.5 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-black/40 pointer-events-auto z-10 hidden sm:block">
          <div className="sr-only">빠른 정렬</div>
          <div className="flex flex-col gap-3">
            {/* Image alignment */}
            {images.length > 0 && firstShape?.imageId && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 w-10" style={{ fontWeight: 700 }}>이미지</span>
                <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/50 rounded-xl p-1">
                  <button
                    onClick={onCenterImageVertical}
                    className="bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-all text-xs shadow-sm"
                    style={{ fontWeight: 700 }}
                    title="이미지 위아래 중앙정렬"
                  >
                    ↕
                  </button>
                  <button
                    onClick={onCenterImageHorizontal}
                    className="bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-all text-xs shadow-sm"
                    style={{ fontWeight: 700 }}
                    title="이미지 양옆 중앙정렬"
                  >
                    ↔
                  </button>
                </div>
              </div>
            )}
            
            {/* Text alignment */}
            {firstShape?.text && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 w-10" style={{ fontWeight: 700 }}>텍스트</span>
                <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/50 rounded-xl p-1">
                  <button
                    onClick={onCenterTextVertical}
                    className="bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 border border-slate-200/60 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-all text-xs shadow-sm"
                    style={{ fontWeight: 700 }}
                    title="텍스트 위아래 중앙정렬"
                  >
                    ↕
                  </button>
                  <button
                    onClick={onCenterTextHorizontal}
                    className="bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 border border-slate-200/60 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-all text-xs shadow-sm"
                    style={{ fontWeight: 700 }}
                    title="텍스트 양옆 중앙정렬"
                  >
                    ↔
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Mode indicator - Floating pill */}
      {firstShape?.text && (
        <div className={`absolute top-6 right-6 backdrop-blur-xl border px-4 py-2.5 rounded-2xl pointer-events-none transition-all duration-300 ${
          isHoverText 
            ? 'bg-violet-500/90 dark:bg-violet-600/90 border-violet-400/40 text-white shadow-lg shadow-violet-500/20' 
            : 'bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 shadow-lg shadow-slate-200/30 dark:shadow-black/30'
        }`}>
          <span className="text-xs flex items-center gap-1.5" style={{ fontWeight: 800 }}>
            {isHoverText ? <><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> 텍스트 드래그 이동</> : '이미지 드래그 이동'}
          </span>
        </div>
      )}
    </div>
  );
}