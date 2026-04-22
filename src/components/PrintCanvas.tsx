import { useRef, useEffect, useState } from 'react';

interface PrintCanvasProps {
  image: HTMLImageElement | null;
  circleCount: number;
}

export function PrintCanvas({ image, circleCount }: PrintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);

  const DPI = 300;
  const MM_TO_PX = DPI / 25.4;
  const PAPER_WIDTH_MM = 285; 
  const PAPER_HEIGHT_MM = 420; 
  const CIRCLE_DIAMETER_MM = 50; 

  // 🌟 핵심 해결: 원이 들어가는 '사각 캔버스(셀)'의 크기를 살짝 늘려서 닿거나 짤리지 않게 함
  const CELL_PADDING_MM = 4; // 원 바깥의 사각 여백 (4mm)
  const CELL_SIZE_MM = CIRCLE_DIAMETER_MM + CELL_PADDING_MM;

  const PAPER_WIDTH_PX = Math.round(PAPER_WIDTH_MM * MM_TO_PX);
  const PAPER_HEIGHT_PX = Math.round(PAPER_HEIGHT_MM * MM_TO_PX);
  
  const CIRCLE_DIAMETER_PX = Math.round(CIRCLE_DIAMETER_MM * MM_TO_PX);
  const CIRCLE_RADIUS_PX = CIRCLE_DIAMETER_PX / 2;
  const CELL_SIZE_PX = Math.round(CELL_SIZE_MM * MM_TO_PX);

  useEffect(() => {
    const maxWidth = window.innerWidth * 0.8;
    const maxHeight = window.innerHeight * 0.8;
    const scaleX = maxWidth / PAPER_WIDTH_PX;
    const scaleY = maxHeight / PAPER_HEIGHT_PX;
    setScale(Math.min(scaleX, scaleY, 0.3)); 
  }, [PAPER_WIDTH_PX, PAPER_HEIGHT_PX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = PAPER_WIDTH_PX;
    canvas.height = PAPER_HEIGHT_PX;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PAPER_WIDTH_PX, PAPER_HEIGHT_PX);

    // 여백이 추가된 사각 셀 크기를 기준으로 행과 열 계산
    const cols = Math.floor(PAPER_WIDTH_MM / CELL_SIZE_MM);
    const rows = Math.floor(PAPER_HEIGHT_MM / CELL_SIZE_MM);
    
    const totalWidth = cols * CELL_SIZE_PX;
    const totalHeight = rows * CELL_SIZE_PX;
    const marginX = (PAPER_WIDTH_PX - totalWidth) / 2;
    const marginY = (PAPER_HEIGHT_PX - totalHeight) / 2;

    const totalCircles = Math.min(circleCount, cols * rows);
    
    const LINE_WIDTH = 4;
    // 그리기 반지름도 안전하게 줄여서 안착시킴
    const DRAW_RADIUS = Math.max(1, CIRCLE_RADIUS_PX - (LINE_WIDTH / 2));
    
    for (let i = 0; i < totalCircles; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      if (row >= rows) break;

      // x, y는 각 사각 셀(늘어난 캔버스 영역)의 정확한 정중앙
      const x = marginX + col * CELL_SIZE_PX + (CELL_SIZE_PX / 2);
      const y = marginY + row * CELL_SIZE_PX + (CELL_SIZE_PX / 2);

      if (image) {
        ctx.save();
        
        ctx.beginPath();
        ctx.arc(x, y, DRAW_RADIUS, 0, Math.PI * 2);
        ctx.clip();

        const imgAspect = image.width / image.height;
        const circleAspect = 1; 
        
        let drawWidth, drawHeight, drawX, drawY;
        
        // 이미지는 여백 포함 전체 지름에 맞춰 그림
        if (imgAspect > circleAspect) {
          drawHeight = DRAW_RADIUS * 2;
          drawWidth = drawHeight * imgAspect;
          drawX = x - drawWidth / 2;
          drawY = y - drawHeight / 2;
        } else {
          drawWidth = DRAW_RADIUS * 2;
          drawHeight = drawWidth / imgAspect;
          drawX = x - drawWidth / 2;
          drawY = y - drawHeight / 2;
        }

        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(x, y, DRAW_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = '#cbd5e1'; 
      ctx.lineWidth = LINE_WIDTH; 
      ctx.stroke();
    }
  }, [image, circleCount, PAPER_WIDTH_PX, PAPER_HEIGHT_PX, CIRCLE_RADIUS_PX, PAPER_WIDTH_MM, PAPER_HEIGHT_MM, CELL_SIZE_MM, CELL_SIZE_PX]);

  return (
    <div className="flex items-start justify-center p-6 bg-slate-50/80 overflow-auto min-h-full">
      <div 
        className="bg-white rounded-sm shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-200 relative"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        <canvas ref={canvasRef} className="block" />
      </div>
    </div>
  );
}