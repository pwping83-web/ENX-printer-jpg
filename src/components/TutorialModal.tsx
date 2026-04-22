import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Youtube } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';

interface TutorialModalProps {
  onClose: () => void;
}

const steps = [
  {
    emoji: '⭕',
    title: '도형·크기 선택',
    action: '도형 고르고 ➕ ➖ 개수 조절',
    visual: '원 또는 사각형 선택 → 크기 맞추기',
    bg: 'from-blue-500/10 to-indigo-500/10',
    accent: 'text-blue-600',
    ring: 'ring-blue-200',
  },
  {
    emoji: '🔲',
    title: '테두리 인쇄',
    action: '테두리 ON → 인쇄',
    visual: '캔버스에 위치 표시용 테두리만 먼저 인쇄!',
    bg: 'from-amber-500/10 to-orange-500/10',
    accent: 'text-amber-600',
    ring: 'ring-amber-200',
  },
  {
    emoji: '🎨',
    title: '사진·글자 넣기',
    action: '테두리 OFF → 사진 업로드',
    visual: '테두리 끄고 사진이나 글자 넣기!',
    bg: 'from-violet-500/10 to-purple-500/10',
    accent: 'text-violet-600',
    ring: 'ring-violet-200',
  },
  {
    emoji: '💾',
    title: '저장 또는 인쇄',
    action: '📥 저장하기 / 🖨️ 인쇄',
    visual: '저장하거나 인쇄하면 완성!',
    bg: 'from-pink-500/10 to-rose-500/10',
    accent: 'text-pink-600',
    ring: 'ring-pink-200',
  },
];

export function TutorialModal({ onClose }: TutorialModalProps) {
  const [page, setPage] = useState(0);
  const totalPages = steps.length;

  const goNext = () => setPage((p) => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setPage((p) => Math.max(p - 1, 0));
  const isLast = page === totalPages - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <motion.div
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl rounded-[28px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* YouTube 영상으로 보기 버튼 */}
        <div className="px-6 pt-6 pb-0">
          <a
            href="https://youtu.be/2m1VFhp4ul8"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 transition-all active:scale-[0.98]"
            style={{ fontWeight: 800 }}
          >
            <Youtube className="w-5 h-5" />
            <span className="text-sm">영상으로 보기</span>
          </a>
        </div>

        {/* Page indicator dots */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === page
                  ? 'w-7 bg-indigo-500'
                  : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Card content */}
        <div className="px-6 pt-2 pb-4 min-h-[340px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              {/* Big Emoji */}
              <div className="flex justify-center mt-2 mb-4">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${steps[page].bg} flex items-center justify-center ring-2 ${steps[page].ring} dark:ring-slate-700`}>
                  <span className="text-5xl">{steps[page].emoji}</span>
                </div>
              </div>

              {/* Step number */}
              <div className="flex justify-center mb-2">
                <span className={`text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 ${steps[page].accent} dark:text-indigo-400`} style={{ fontWeight: 800 }}>
                  STEP {page + 1}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-center text-2xl text-slate-900 dark:text-white mb-5 tracking-tight" style={{ fontWeight: 900 }}>
                {steps[page].title}
              </h2>

              {/* Action card */}
              <div className={`rounded-2xl bg-gradient-to-br ${steps[page].bg} border border-slate-100 dark:border-slate-800 p-5 mb-3`}>
                <div className="text-center mb-3">
                  <span className="text-lg" style={{ fontWeight: 800 }}>{steps[page].action}</span>
                </div>
                <div className="text-center">
                  {steps[page].visual.split('\n').map((line, i) => (
                    <p key={i} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed" style={{ fontWeight: 600 }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <Button
            onClick={goPrev}
            disabled={page === 0}
            variant="outline"
            className="h-12 w-12 p-0 rounded-2xl border-slate-200 dark:border-slate-700 disabled:opacity-30 shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={isLast ? onClose : goNext}
            className="flex-1 h-12 rounded-2xl text-base bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/20 border-0 transition-all active:scale-[0.98]"
            style={{ fontWeight: 800 }}
          >
            {isLast ? '시작하기! 🎉' : '다음'}
            {!isLast && <ChevronRight className="w-5 h-5 ml-1" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}