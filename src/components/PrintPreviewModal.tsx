import { useEffect } from 'react';
import { Button } from './ui/button';
import { X, Printer, Download, Maximize, ZoomIn } from 'lucide-react';
import { motion } from 'motion/react';

interface PrintPreviewModalProps {
  canvasDataUrl: string;
  paperSize: string;
  actualWidth: number;
  actualHeight: number;
  onClose: () => void;
  onPrint: () => void;
  onDownloadPNG: () => void;
}

export function PrintPreviewModal({
  canvasDataUrl,
  paperSize,
  actualWidth,
  actualHeight,
  onClose,
  onPrint,
  onDownloadPNG,
}: PrintPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/85 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Floating toolbar */}
      <motion.div 
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/[0.08] backdrop-blur-2xl border border-white/[0.1] rounded-2xl px-2.5 py-2 shadow-[0_8px_40px_-10px_rgba(0,0,0,0.4)]"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        {/* Paper info badge */}
        <div className="bg-white/[0.06] px-3.5 py-2 rounded-xl text-xs font-bold text-white/50 flex items-center gap-1.5 border border-white/[0.06]">
          <Maximize className="w-3 h-3" />
          {paperSize} ({actualWidth}&times;{actualHeight}mm)
        </div>

        <div className="w-px h-6 bg-white/8" />

        {/* PNG Download */}
        <Button
          size="sm"
          onClick={onDownloadPNG}
          className="h-9 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 rounded-xl shadow-md shadow-emerald-500/20 font-bold text-xs group"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 group-hover:translate-y-0.5 transition-transform" />
          PNG
        </Button>

        {/* Print */}
        <Button
          size="sm"
          onClick={onPrint}
          className="h-9 px-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 rounded-xl shadow-md shadow-indigo-500/20 font-bold text-xs"
        >
          <Printer className="w-3.5 h-3.5 mr-1.5" />
          인쇄
        </Button>

        <div className="w-px h-6 bg-white/8" />

        {/* Close */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-9 w-9 p-0 text-white/40 hover:text-white hover:bg-white/8 rounded-xl"
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Preview area */}
      <div 
        className="flex-1 overflow-auto p-6 pt-20 pb-16 cursor-pointer"
        onClick={onClose}
      >
        <div className="min-h-full flex items-start justify-center">
          <motion.div
            className="bg-white rounded-xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.5)] max-w-[85vw] overflow-hidden ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={canvasDataUrl}
              alt="인쇄 미리보기"
              className="w-full h-auto object-contain"
              draggable={false}
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom hint */}
      <motion.div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/15 font-medium flex items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <ZoomIn className="w-3 h-3" />
        아무 곳이나 클릭하거나 ESC 키를 눌러 닫기
      </motion.div>
    </motion.div>
  );
}