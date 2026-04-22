import {
  Upload,
  FileDown,
  Printer,
  Eye,
  Grid3X3,
  ZoomIn,
  Pen,
  RotateCcw,
  Undo,
  Redo,
  Eraser,
} from 'lucide-react';
import { UploadedImage } from '../types';
import { processFiles, ACCEPTED_FILE_TYPES } from '../utils/pdfToImage';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface MobileBottomNavProps {
  showGridView: boolean;
  showBorder: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onToggleGridView: () => void;
  onImageUpload: (images: UploadedImage[]) => void;
  onSave: (format?: 'png' | 'jpg' | 'pdf') => void;
  onPrint: () => void;
  onPrintPreview: () => void;
  onToggleBorder: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRemoveBackground?: () => void;
  isRemovingBg?: boolean;
  hasImages?: boolean;
}

export function MobileBottomNav({
  showGridView,
  showBorder,
  canUndo,
  canRedo,
  onToggleGridView,
  onImageUpload,
  onSave,
  onPrint,
  onPrintPreview,
  onToggleBorder,
  onUndo,
  onRedo,
  onRemoveBackground,
  isRemovingBg,
  hasImages,
}: MobileBottomNavProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // FileList를 먼저 배열로 복사 (value 초기화 시 FileList가 비워지므로)
    const fileArray = Array.from(files);

    // 같은 파일 재선택 시에도 onChange 발생하도록 초기화
    e.target.value = '';

    processFiles(fileArray, onImageUpload);
  };

  const navItems = [
    {
      icon: Undo,
      label: '되돌리기',
      onClick: onUndo,
      active: false,
      color: canUndo ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600',
      activeColor: '',
      disabled: !canUndo,
    },
    ...(hasImages && onRemoveBackground ? [{
      icon: Eraser,
      label: isRemovingBg ? '제거중...' : '누끼',
      onClick: onRemoveBackground,
      active: false,
      color: isRemovingBg ? 'text-violet-400 dark:text-violet-500 animate-pulse' : 'text-violet-500 dark:text-violet-400',
      activeColor: '',
      disabled: isRemovingBg,
    }] : [{
      icon: Redo,
      label: '앞으로',
      onClick: onRedo,
      active: false,
      color: canRedo ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600',
      activeColor: '',
      disabled: !canRedo,
    }]),
    {
      icon: Upload,
      label: '업로드',
      onClick: () => document.getElementById('mobile-bottom-upload')?.click(),
      active: false,
      color: 'text-white',
      activeColor: '',
      isPrimary: true,
    },
    {
      icon: Pen,
      label: '테두리',
      onClick: onToggleBorder,
      active: showBorder,
      color: showBorder ? 'text-pink-500 dark:text-pink-400' : 'text-slate-500 dark:text-slate-400',
      activeColor: 'text-pink-500',
    },
    {
      icon: FileDown,
      label: 'PNG',
      onClick: () => onSave('png'),
      active: false,
      color: 'text-emerald-500 dark:text-emerald-400',
      activeColor: '',
    },
  ];

  return (
    <>
      <input
        id="mobile-bottom-upload"
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Mobile Bottom Navigation - visible only on small screens */}
      <motion.nav
        className="print:hidden sm:hidden fixed bottom-0 left-0 right-0 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Frosted glass background */}
        <div className="premium-glass-bottom">
          {/* Safe area for iOS */}
          <div className="grid grid-cols-5 items-end px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {navItems.map((item, index) => {
              const Icon = item.icon;

              if (item.isPrimary) {
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="flex flex-col items-center justify-end gap-0.5 -mt-4 relative"
                  >
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center"
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <motion.button
                  key={index}
                  onClick={item.disabled ? undefined : item.onClick}
                  className={`flex flex-col items-center justify-end gap-0.5 py-1 rounded-xl transition-colors ${
                    item.disabled ? 'opacity-40 cursor-not-allowed' : 'active:bg-slate-100 dark:active:bg-slate-800'
                  }`}
                  whileTap={item.disabled ? undefined : { scale: 0.9 }}
                >
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <span className={`text-[10px] ${item.color} whitespace-nowrap`}>{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </>
  );
}