import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { FileDown, X, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface ExportDialogProps {
  onExport: (filename: string) => void;
  onClose: () => void;
}

export function ExportDialog({ onExport, onClose }: ExportDialogProps) {
  const [filename, setFilename] = useState('');

  const handleExport = () => {
    const finalFilename = filename.trim() || '내보내기';
    onExport(finalFilename);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/60 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden p-7"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20"
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <FileDown className="w-5 h-5 text-white" />
            </motion.div>
            <h2 className="text-lg font-extrabold text-slate-900">PNG 내보내기</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <motion.div 
          className="space-y-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div>
            <label className="text-sm font-bold text-slate-500 mb-2 block ml-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              파일 이름
            </label>
            <Input
              type="text"
              placeholder="파일 이름을 입력하세요..."
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExport();
                if (e.key === 'Escape') onClose();
              }}
              autoFocus
              className="h-12 bg-slate-50/50 border-slate-200 focus:border-emerald-400 rounded-xl text-base ring-0 focus-visible:ring-emerald-400/30"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1 h-12 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl font-bold">
              취소
            </Button>
            <Button 
              onClick={handleExport}
              className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 rounded-xl shadow-md shadow-emerald-500/20 font-bold group"
            >
              <FileDown className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
              저장하기
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
