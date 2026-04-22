import { useEffect, useRef } from 'react';
import { Shape, UploadedImage } from '../types';

interface ShapeCountPanelProps {
  shapes: Shape[];
  images: UploadedImage[];
  paperSize: 'A2' | 'A3' | 'A4' | 'A5';
}

const PAPER_SIZES = {
  A2: { width: 420, height: 594 },
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 160, height: 160 },
};

export function ShapeCountPanel({ shapes, images, paperSize }: ShapeCountPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const DPI = 150;
  const MM_TO_PX = DPI / 25.4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 0.067;
    const paperWidthPx = Math.round(PAPER_SIZES[paperSize].width * MM_TO_PX);
    const paperHeightPx = Math.round(PAPER_SIZES[paperSize].height * MM_TO_PX);
    
    canvas.width = paperWidthPx * scale;
    canvas.height = paperHeightPx * scale;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw shapes
    shapes.forEach((shape) => {
      const x = shape.x * scale;
      const y = shape.y * scale;
      const width = shape.width * scale;
      const height = shape.height * scale;

      if (shape.type === 'circle') {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.max(1, width / 2);

        // Gradient fill for circles
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#a5b4fc');
        gradient.addColorStop(1, '#6366f1');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, '#a5b4fc');
        gradient.addColorStop(1, '#6366f1');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
      }
    });
  }, [shapes, images, paperSize, MM_TO_PX]);

  return (
    <div className="print:hidden fixed bottom-16 right-2 sm:bottom-6 sm:right-6 z-20 opacity-25 hover:opacity-100 transition-all duration-500 scale-75 sm:scale-100 pb-safe group">
      {/* Count badge and paper info */}
      <div className="flex items-center justify-center gap-1.5 mb-1.5">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-sm rounded-xl px-2.5 py-1 text-center flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-indigo-600">{shapes.length}</span>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400">개</span>
          <div className="w-px h-3 bg-slate-200" />
          <span className="text-[10px] sm:text-xs font-bold text-slate-400">{paperSize}</span>
        </div>
      </div>

      {/* Minimap */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-lg group-hover:shadow-xl rounded-xl p-1.5 sm:p-2 transition-all">
        <canvas
          ref={canvasRef}
          className=""
          style={{
            maxWidth: '80px',
            height: 'auto',
          }}
        />
      </div>
    </div>
  );
}