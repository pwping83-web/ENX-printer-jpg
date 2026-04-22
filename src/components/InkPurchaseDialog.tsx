import { X, ShoppingCart, ExternalLink, Sparkles, Truck, Package } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface InkPurchaseDialogProps {
  onClose: () => void;
}

export function InkPurchaseDialog({ onClose }: InkPurchaseDialogProps) {
  const handlePurchase = (url: string, type: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    console.log(`${type} 구매 페이지로 이동`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        className="relative w-full max-w-lg bg-white/[0.06] backdrop-blur-2xl border border-white/[0.1] shadow-[0_8px_80px_-20px_rgba(79,70,229,0.35)] rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400/80 to-transparent" />
        
        {/* Shimmer effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12 pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 5, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }}
        />

        {/* Header */}
        <div className="px-6 pt-7 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30"
              whileHover={{ scale: 1.1, rotate: 5 }}
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ShoppingCart className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-orange-200">식용잉크 구매</h2>
              <p className="text-xs text-white/35 font-medium">잉크가 떨어지셨나요?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-white/30 hover:text-white hover:bg-white/8 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-3 space-y-3">
          {/* 국산 잉크 */}
          <motion.div 
            className="group border border-emerald-500/15 rounded-2xl p-5 hover:border-emerald-400/30 hover:bg-emerald-500/[0.04] transition-all duration-300 bg-white/[0.03] relative overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ y: -2 }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3 relative">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🇰🇷</span>
                <h3 className="font-bold text-white/90">국산 식용잉크</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 flex items-center gap-1">
                <Truck className="w-3 h-3" />
                빠른배송
              </span>
            </div>
            <p className="text-sm text-white/35 mb-4 font-medium">네이버 스마트스토어 · 1-2일 배송</p>
            <Button
              onClick={() => handlePurchase('https://smartstore.naver.com/cakeart0701/products/12662938364', '국산 잉크')}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl border-0 shadow-lg shadow-emerald-500/25 transition-all group-hover:shadow-emerald-500/35"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              네이버 구매하기
            </Button>
          </motion.div>

          {/* 수입산 잉크 */}
          <motion.div 
            className="group border border-orange-500/15 rounded-2xl p-5 hover:border-orange-400/30 hover:bg-orange-500/[0.04] transition-all duration-300 bg-white/[0.03] relative overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ y: -2 }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3 relative">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🌍</span>
                <h3 className="font-bold text-white/90">수입산 식용잉크</h3>
              </div>
              <span className="px-2.5 py-1 bg-orange-500/15 text-orange-400 text-xs font-bold rounded-lg border border-orange-500/20 flex items-center gap-1">
                <Package className="w-3 h-3" />
                대량구매
              </span>
            </div>
            <p className="text-sm text-white/35 mb-4 font-medium">Alibaba · 대량 구매 시 저렴</p>
            <Button
              onClick={() => handlePurchase('https://korean.alibaba.com/product-detail/subject-1600617997679.html?from=share&ckvia=share_8f52eaaa764f461e9d0f17eab3419988&needReward=true', '수입산 잉크')}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl border-0 shadow-lg shadow-orange-500/25 transition-all group-hover:shadow-orange-500/35"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Alibaba 구매하기
            </Button>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/[0.06]">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400/60" />
            <p className="text-xs text-white/25 font-medium text-center">
              제품 추천만 제공합니다 (직접 판매 아님)
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full h-11 text-white/30 hover:text-white hover:bg-white/8 font-bold rounded-xl"
          >
            닫기
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
