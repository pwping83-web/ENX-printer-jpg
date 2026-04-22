import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { verifyPhone } from '../api/phones';

interface ExpiryNoticeProps {
  userPhone: string;
}

export function ExpiryNotice({ userPhone }: ExpiryNoticeProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [planName, setPlanName] = useState<string>('');

  useEffect(() => {
    if (userPhone === 'TEST_MODE') return;

    const fetchExpiry = async () => {
      try {
        const result = await verifyPhone(userPhone);
        if (result.found && result.entry) {
          const userEntry = result.entry;
          const expires = new Date(userEntry.expiresAt);
          const now = new Date();
          const diffTime = expires.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          setDaysLeft(diffDays);
          setExpiryDate(expires.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }));
          
          const planLabel = userEntry.planType === 'purchase' ? '구매 고객' : 
                            userEntry.planType?.startsWith('rental') ? '렌탈 고객' : '일반 고객';
          setPlanName(planLabel);
        }
      } catch (error) {
        console.error('ExpiryNotice: 만료 정보 조회 실패:', error);
      }
    };
    fetchExpiry();
  }, [userPhone]);

  if (daysLeft === null || userPhone === 'TEST_MODE') return null;

  const isExpired = daysLeft < 0;
  const isUrgent = daysLeft <= 10 && daysLeft > 0;
  const isWarning = daysLeft <= 30 && daysLeft > 10;

  const getBadgeStyle = () => {
    if (isExpired) return {
      bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800/50',
      text: 'text-red-600 dark:text-red-400', icon: <AlertTriangle className="w-3.5 h-3.5" />
    };
    if (isUrgent) return {
      bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800/50',
      text: 'text-orange-600 dark:text-orange-400', icon: <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
    };
    if (isWarning) return {
      bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-600 dark:text-amber-400', icon: <Clock className="w-3.5 h-3.5" />
    };
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/50',
      text: 'text-emerald-600 dark:text-emerald-400', icon: <Shield className="w-3.5 h-3.5" />
    };
  };

  const style = getBadgeStyle();

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border cursor-help transition-colors shadow-sm ${style.bg} ${style.border} ${style.text}`} style={{ fontWeight: 700 }}>
            {style.icon}
            <span>{isExpired ? '만료됨' : `D-${daysLeft}`}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="rounded-lg text-xs shadow-lg border-slate-200">
          <p style={{ fontWeight: 700 }} className="mb-0.5">{planName}</p>
          <p className="text-slate-500">{expiryDate} 까지 사용 가능</p>
          {isUrgent && <p className="text-orange-500 mt-1">곧 갱신이 필요합니다!</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
