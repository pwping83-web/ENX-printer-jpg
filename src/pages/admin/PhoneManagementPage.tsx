import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { X, Plus, Phone, Settings, Trash2, Check, Calendar, AlertTriangle, Shield, RefreshCw, Search, Users, Timer, ShoppingCart, Key, Cloud, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { fetchPhones, addPhone, deletePhone, extendPhone, seedPhones } from '../../api/phones';
import type { PhoneEntry } from '../../api/phones';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';

interface PhoneManagementPageProps {
  onClose: () => void;
}

export type { PhoneEntry };

const PLAN_OPTIONS = [
  { value: 'purchase', label: '구매 (1년 무료)', days: 365, description: '프린터 구매 고객 - 1년 무료, 이후 179,000원/년' },
  { value: 'rental_1m', label: '렌탈 1개월', days: 30, description: '렌탈 고객 - 1개월 무료 사용' },
  { value: 'rental_3m', label: '렌탈 3개월', days: 90, description: '렌탈 고객 - 3개월 무료 사용' },
  { value: 'rental_6m', label: '렌탈 6개월', days: 180, description: '렌탈 고객 - 6개월 무료 사용' },
  { value: 'rental_12m', label: '렌탈 12개월', days: 365, description: '렌탈 고객 - 12개월 무료 사용' },
] as const;

function getPlanDays(planType: string): number {
  const plan = PLAN_OPTIONS.find(p => p.value === planType);
  return plan?.days ?? 90;
}

function getPlanLabel(planType: string): string {
  const plan = PLAN_OPTIONS.find(p => p.value === planType);
  return plan?.label ?? '알 수 없음';
}

function getPlanBadgeColor(planType: string): string {
  if (planType === 'purchase') return 'from-violet-500 to-purple-500';
  return 'from-blue-500 to-cyan-500';
}

export function PhoneManagementPage({ onClose }: PhoneManagementPageProps) {
  const [phoneList, setPhoneList] = useState<PhoneEntry[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('purchase');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const ADMIN_PASSWORD = 'kkus2011!!';

  // 모바일 감지 (입장 애니메이션 비활성화용)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  useEffect(() => {
    if (isAuthenticated) {
      loadPhoneList();
    }
  }, [isAuthenticated]);

  const loadPhoneList = async () => {
    setIsLoading(true);
    try {
      const phones = await fetchPhones();
      setPhoneList(phones);
      
      // DB가 비어있으면 초기 데이터 시딩
      if (phones.length === 0) {
        await seedInitialData();
      }
    } catch (error) {
      console.error('전화번호 목록 로드 실패:', error);
      toast.error('서버에서 전화번호 목록을 불러오지 못했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const seedInitialData = async () => {
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setDate(oneYearLater.getDate() + 365);

    const initialPhones: PhoneEntry[] = [
      {
        phone: '01046392673',
        registeredAt: now.toISOString(),
        expiresAt: oneYearLater.toISOString(),
        planType: 'purchase',
      },
      {
        phone: '01084456081',
        registeredAt: now.toISOString(),
        expiresAt: oneYearLater.toISOString(),
        planType: 'purchase',
      },
      {
        phone: '01082463612',
        registeredAt: now.toISOString(),
        expiresAt: oneYearLater.toISOString(),
        planType: 'purchase',
      },
    ];

    try {
      await seedPhones(initialPhones);
      const phones = await fetchPhones();
      setPhoneList(phones);
      toast.success('초기 전화번호 3개가 등록되었습니다');
    } catch (error) {
      console.error('초기 데이터 시딩 실패:', error);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('관리자 인증 성공');
    } else {
      toast.error('비밀번호가 틀렸습니다');
      setAdminPassword('');
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setNewPhone(formatted);
  };

  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numbers = newPhone.replace(/[^\d]/g, '');
    
    if (numbers.length !== 11) {
      toast.error('올바른 전화번호를 입력해주세요 (11자리)');
      return;
    }

    if (phoneList.find(p => p.phone === numbers)) {
      toast.error('이미 등록된 전화번호입니다');
      return;
    }

    setIsSyncing(true);
    try {
      const now = new Date();
      const days = getPlanDays(selectedPlan);
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + days);

      const newEntry: PhoneEntry = {
        phone: numbers,
        registeredAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        planType: selectedPlan as PhoneEntry['planType'],
      };

      await addPhone(newEntry);
      setPhoneList(prev => [...prev, newEntry]);
      setNewPhone('');
      toast.success(`전화번호가 등록되었습니다 (${getPlanLabel(selectedPlan)}, ${days}일)`);
    } catch (error: any) {
      console.error('전화번호 등록 실패:', error);
      toast.error(error.message || '전화번호 등록에 실패했습니다');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRemovePhone = async (phone: string) => {
    setIsSyncing(true);
    try {
      await deletePhone(phone);
      setPhoneList(prev => prev.filter(p => p.phone !== phone));
      toast.success('전화번호가 삭제되었습니다');
    } catch (error: any) {
      console.error('전화번호 삭제 실패:', error);
      toast.error(error.message || '전화번호 삭제에 실패했습니다');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExtendPhone = async (phone: string) => {
    setIsSyncing(true);
    try {
      const entry = phoneList.find(e => e.phone === phone);
      if (!entry) return;

      const days = getPlanDays(entry.planType);
      const baseDate = new Date(entry.expiresAt);
      const now = new Date();
      const startDate = baseDate > now ? baseDate : now;
      const newExpiresAt = new Date(startDate);
      newExpiresAt.setDate(newExpiresAt.getDate() + days);

      await extendPhone(phone, newExpiresAt.toISOString());
      setPhoneList(prev => prev.map(e => 
        e.phone === phone ? { ...e, expiresAt: newExpiresAt.toISOString() } : e
      ));

      const label = entry.planType === 'purchase' ? `${days}일 (179,000원)` : `${days}일`;
      toast.success(`사용 기간이 ${label} 연장되었습니다`);
    } catch (error: any) {
      console.error('기간 연장 실패:', error);
      toast.error(error.message || '기간 연장에 실패했습니다');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const displayPhoneNumber = (phone: string) => {
    if (phone.length === 11) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    }
    return phone;
  };

  const getDaysLeft = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Stats calculations
  const activeCount = phoneList.filter(p => getDaysLeft(p.expiresAt) > 0).length;
  const expiredCount = phoneList.filter(p => getDaysLeft(p.expiresAt) <= 0).length;
  const warningCount = phoneList.filter(p => { const d = getDaysLeft(p.expiresAt); return d > 0 && d <= 30; }).length;
  const purchaseCount = phoneList.filter(p => p.planType === 'purchase').length;
  const rentalCount = phoneList.filter(p => p.planType?.startsWith('rental')).length;

  // 오늘 날짜 (KST 기준)
  const getTodayKst = () => {
    const now = new Date();
    return new Date(now.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
  };
  const todayStr = getTodayKst();

  // Filtered list
  const filteredList = phoneList.filter(entry => {
    if (!searchQuery) return true;
    return displayPhoneNumber(entry.phone).includes(searchQuery) || entry.phone.includes(searchQuery.replace(/[^\d]/g, ''));
  }).sort((a, b) => getDaysLeft(a.expiresAt) - getDaysLeft(b.expiresAt));

  // Admin login screen
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f1e] transform-gpu" style={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #141937 30%, #1a1f4e 50%, #0d1333 70%, #0a0f1e 100%)',
      }}>
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/12 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none transform-gpu will-change-transform"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/12 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none transform-gpu will-change-transform"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />

        <motion.div
          initial={isMobile ? false : { opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="relative w-full max-w-md bg-white/[0.06] sm:backdrop-blur-2xl backdrop-blur-md border border-white/[0.1] shadow-[0_8px_60px_-15px_rgba(79,70,229,0.3)] rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
            
            <CardHeader className="text-center pt-8 pb-4">
              <motion.div
                className="mx-auto w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4"
                initial={isMobile ? false : { rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Settings className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-amber-200">
                관리자 인증
              </CardTitle>
              <p className="text-sm text-white/35 mt-1.5">관리자 비밀번호를 입력하세요</p>
            </CardHeader>
            <CardContent className="pb-8 px-7">
              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div>
                  <Label htmlFor="password" className="text-sm font-bold text-white/45 ml-1 mb-2 block">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="관리자 비밀번호"
                    className="h-14 text-lg bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20 focus:bg-white/[0.1] focus:border-amber-400/40 rounded-xl ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 text-white/40 hover:text-white hover:bg-white/8 rounded-xl">
                    <X className="w-4 h-4 mr-2" />
                    닫기
                  </Button>
                  <Button type="submit" className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 rounded-xl shadow-lg shadow-amber-500/25 font-bold">
                    <Check className="w-4 h-4 mr-2" />
                    인증
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main admin panel
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-[#0a0f1e] transform-gpu" style={{
      background: 'linear-gradient(135deg, #0a0f1e 0%, #141937 30%, #1a1f4e 50%, #0d1333 70%, #0a0f1e 100%)',
    }}>
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/12 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none transform-gpu will-change-transform"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/12 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none transform-gpu will-change-transform"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
      />

      <motion.div
        initial={isMobile ? false : { opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-3xl"
      >
        <Card className="relative my-8 bg-white/[0.06] sm:backdrop-blur-2xl backdrop-blur-md border border-white/[0.1] shadow-[0_8px_80px_-20px_rgba(79,70,229,0.35)] rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent" />
          
          {/* Header */}
          <CardHeader className="border-b border-white/[0.06] pb-5 pt-7 px-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Shield className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                    전화번호 관리
                  </CardTitle>
                  <p className="text-sm text-white/25 mt-0.5 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400/70 font-medium">Supabase Cloud</span>
                    <span className="text-white/15">연동</span>
                    {isSyncing && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={loadPhoneList} className="text-white/30 hover:text-white hover:bg-white/8 rounded-xl" disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose} className="text-white/30 hover:text-white hover:bg-white/8 rounded-xl">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-7 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/30">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mb-4" />
                <p className="text-sm">서버에서 데이터를 불러오는 중...</p>
              </div>
            ) : (
              <>
                {/* Stats dashboard — Desktop: 5 cards / Mobile: compact pill bar */}
                {/* Mobile compact stats */}
                <motion.div
                  className="sm:hidden bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-xs font-bold text-white/40">총 {phoneList.length}명</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span className="text-xs font-bold text-emerald-400">{activeCount}</span>
                      </span>
                      <span className="text-white/10">|</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                        <span className="text-[11px] text-white/35">구매</span>
                        <span className="text-xs font-bold text-violet-400">{purchaseCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <span className="text-[11px] text-white/35">렌탈</span>
                        <span className="text-xs font-bold text-blue-400">{rentalCount}</span>
                      </span>
                      {(warningCount > 0 || expiredCount > 0) && (
                        <>
                          <span className="text-white/10">|</span>
                          {warningCount > 0 && (
                            <span className="flex items-center gap-1 bg-amber-500/15 px-1.5 py-0.5 rounded-lg">
                              <Timer className="w-3 h-3 text-amber-400" />
                              <span className="text-xs font-bold text-amber-400">{warningCount}</span>
                            </span>
                          )}
                          {expiredCount > 0 && (
                            <span className="flex items-center gap-1 bg-red-500/15 px-1.5 py-0.5 rounded-lg">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span className="text-xs font-bold text-red-400">{expiredCount}</span>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Desktop stats cards */}
                <div className="hidden sm:grid sm:grid-cols-5 gap-3">
                  <motion.div 
                    className="bg-emerald-500/[0.08] border border-emerald-500/15 rounded-2xl p-3 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Users className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
                    <div className="text-xl font-extrabold text-emerald-400">{activeCount}</div>
                    <div className="text-[10px] text-emerald-400/60 font-bold mt-0.5">활성</div>
                  </motion.div>
                  <motion.div 
                    className="bg-violet-500/[0.08] border border-violet-500/15 rounded-2xl p-3 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <ShoppingCart className="w-4 h-4 text-violet-400 mx-auto mb-1.5" />
                    <div className="text-xl font-extrabold text-violet-400">{purchaseCount}</div>
                    <div className="text-[10px] text-violet-400/60 font-bold mt-0.5">구매</div>
                  </motion.div>
                  <motion.div 
                    className="bg-blue-500/[0.08] border border-blue-500/15 rounded-2xl p-3 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Key className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
                    <div className="text-xl font-extrabold text-blue-400">{rentalCount}</div>
                    <div className="text-[10px] text-blue-400/60 font-bold mt-0.5">렌탈</div>
                  </motion.div>
                  <motion.div 
                    className="bg-amber-500/[0.08] border border-amber-500/15 rounded-2xl p-3 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Timer className="w-4 h-4 text-amber-400 mx-auto mb-1.5" />
                    <div className="text-xl font-extrabold text-amber-400">{warningCount}</div>
                    <div className="text-[10px] text-amber-400/60 font-bold mt-0.5">임박</div>
                  </motion.div>
                  <motion.div 
                    className="bg-red-500/[0.08] border border-red-500/15 rounded-2xl p-3 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 mx-auto mb-1.5" />
                    <div className="text-xl font-extrabold text-red-400">{expiredCount}</div>
                    <div className="text-[10px] text-red-400/60 font-bold mt-0.5">만료</div>
                  </motion.div>
                </div>

                {/* Add phone number */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                  <form onSubmit={handleAddPhone} className="space-y-3">
                    <Label htmlFor="newPhone" className="text-sm font-bold text-indigo-300/70 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      새 전화번호 등록
                    </Label>
                    
                    {/* Plan selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-white/30 mb-1.5 block ml-0.5">플랜 선택</Label>
                        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                          <SelectTrigger className="h-12 bg-white/[0.05] border-white/[0.08] text-white rounded-xl focus:border-indigo-400/40 ring-0 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900/95 backdrop-blur-2xl border-white/10 rounded-xl">
                            {PLAN_OPTIONS.map(plan => (
                              <SelectItem key={plan.value} value={plan.value} className="text-white/80 rounded-lg focus:bg-white/10 focus:text-white">
                                <span className="flex items-center gap-2">
                                  {plan.value === 'purchase' ? (
                                    <ShoppingCart className="w-3.5 h-3.5 text-violet-400 inline" />
                                  ) : (
                                    <Key className="w-3.5 h-3.5 text-blue-400 inline" />
                                  )}
                                  {plan.label} ({plan.days}일)
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-white/30 mb-1.5 block ml-0.5">화번호</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                            <Input
                              id="newPhone"
                              type="tel"
                              value={newPhone}
                              onChange={handlePhoneChange}
                              placeholder="010-1234-5678"
                              maxLength={13}
                              className="pl-10 h-12 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:bg-white/[0.08] focus:border-indigo-400/40 rounded-xl ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </div>
                          <Button type="submit" disabled={isSyncing} className="h-12 px-5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 rounded-xl shadow-lg shadow-indigo-500/25 font-bold">
                            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                            등록
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Selected plan description */}
                    <div className="text-xs text-white/25 bg-white/[0.02] rounded-xl px-3 py-2 border border-white/[0.04]">
                      {PLAN_OPTIONS.find(p => p.value === selectedPlan)?.description}
                    </div>
                  </form>
                </div>

                {/* Search and phone list */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white/40 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      등록된 번호 ({phoneList.length})
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        안전
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                        <div className="w-2 h-2 bg-amber-400 rounded-full" />
                        30일
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                        <div className="w-2 h-2 bg-orange-400 rounded-full" />
                        2주
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                        <div className="w-2 h-2 bg-rose-400 rounded-full" />
                        1주
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        만료
                      </span>
                    </div>
                  </div>

                  {phoneList.length > 3 && (
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <Input
                        type="text"
                        placeholder="전화번호 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/15 focus:bg-white/[0.06] focus:border-indigo-400/30 rounded-xl text-sm ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  )}

                  {phoneList.length === 0 ? (
                    <div className="text-center py-12 text-white/15">
                      <Phone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">등록된 전화번호가 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] sm:max-h-[420px] max-sm:max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                      <AnimatePresence>
                        {filteredList.map((entry, index) => {
                          const daysLeft = getDaysLeft(entry.expiresAt);
                          const isExpired = daysLeft <= 0;
                          const isWeek = !isExpired && daysLeft <= 7;
                          const isTwoWeeks = !isExpired && daysLeft > 7 && daysLeft <= 14;
                          const isWarning = !isExpired && daysLeft > 14 && daysLeft <= 30;

                          const statusColor = isExpired ? 'bg-red-500/[0.08] border-red-500/15' :
                            isWeek ? 'bg-rose-500/[0.08] border-rose-500/15' :
                            isTwoWeeks ? 'bg-orange-500/[0.06] border-orange-500/15' :
                            isWarning ? 'bg-amber-500/[0.06] border-amber-500/15' :
                            'bg-white/[0.02] border-white/[0.06]';

                          const badgeColor = isExpired ? 'from-red-600 to-red-500' :
                            isWeek ? 'from-rose-500 to-pink-500' :
                            isTwoWeeks ? 'from-orange-500 to-amber-500' :
                            isWarning ? 'from-amber-400 to-yellow-400' :
                            'from-emerald-500 to-teal-500';

                          const ddayTextColor = isExpired ? 'text-red-100' :
                            isWeek ? 'text-rose-100' :
                            isTwoWeeks ? 'text-orange-100' :
                            isWarning ? 'text-amber-900' :
                            'text-white';

                          const planBadge = getPlanBadgeColor(entry.planType);
                          const planLabel = entry.planType === 'purchase' ? '구매' : 
                            entry.planType === 'rental_1m' ? '렌탈 1M' :
                            entry.planType === 'rental_3m' ? '렌탈 3M' :
                            entry.planType === 'rental_6m' ? '렌탈 6M' :
                            entry.planType === 'rental_12m' ? '렌탈 12M' : '기타';

                          const renewalInfo = entry.planType === 'purchase' && isExpired ? '179,000원/년 갱신 필요' : null;

                          return (
                            <motion.div 
                              key={entry.phone}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20, height: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`rounded-2xl border ${statusColor} transition-all hover:bg-white/[0.04] group overflow-hidden`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="font-mono text-lg font-bold text-white/85 tracking-wide group-hover:text-white/95 transition-colors">
                                      {displayPhoneNumber(entry.phone)}
                                    </span>
                                    {/* Plan type badge */}
                                    <span className={`bg-gradient-to-r ${planBadge} text-white text-[10px] font-bold px-2 py-0.5 rounded-lg`}>
                                      {planLabel}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <Calendar className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                                    <span className="text-xs text-white/30">
                                      {formatDate(entry.registeredAt)} ~ {formatDate(entry.expiresAt)}
                                    </span>
                                    
                                    {/* 접속 날짜 뱃지 & 히스토리 팝업 */}
                                    {entry.lastAccessedAt && (
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all hover:opacity-80 ${
                                            entry.lastAccessedAt === todayStr 
                                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                                              : 'bg-white/5 text-white/40 border-white/10'
                                          }`}>
                                            <Calendar className="w-3 h-3 opacity-70" />
                                            {entry.lastAccessedAt === todayStr ? '오늘 접속' : `${entry.lastAccessedAt} 접속`}
                                          </button>
                                        </PopoverTrigger>
                                        
                                        <PopoverContent className="w-48 p-0 bg-zinc-900 border-zinc-700 shadow-xl" sideOffset={5}>
                                          <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-800/50">
                                            <h4 className="text-xs font-bold text-white/90">최근 접속 기록</h4>
                                          </div>
                                          <div className="p-1 max-h-[160px] overflow-y-auto custom-scrollbar">
                                            {entry.accessHistory && entry.accessHistory.length > 0 ? (
                                              [...entry.accessHistory].reverse().map((date, idx) => (
                                                <div key={idx} className="flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-white/5">
                                                  <span className="text-white/80 font-mono tracking-wider">{date}</span>
                                                  {date === todayStr && (
                                                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                      오늘
                                                    </span>
                                                  )}
                                                </div>
                                              ))
                                            ) : (
                                              <div className="flex items-center justify-between px-2 py-1.5 text-xs rounded">
                                                <span className="text-white/80 font-mono tracking-wider">{entry.lastAccessedAt}</span>
                                              </div>
                                            )}
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    )}

                                    {renewalInfo && (
                                      <span className="text-[10px] text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded-lg">
                                        {renewalInfo}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              
                                <div className="flex items-center gap-2 sm:gap-3 sm:ml-4">
                                  {/* D-day badge */}
                                  <div className={`bg-gradient-to-r ${badgeColor} ${ddayTextColor} px-3 py-1.5 rounded-xl text-center min-w-[70px] shadow-sm ${isWeek ? 'animate-pulse' : ''}`}>
                                    <div className="text-sm font-bold leading-none">
                                      {isExpired ? '만료' : `D-${daysLeft}`}
                                    </div>
                                    {!isExpired && (
                                      <div className="text-[9px] opacity-70 mt-0.5">
                                        {isWeek ? '긴급' : isTwoWeeks ? '2주 이내' : `${daysLeft}일 남음`}
                                      </div>
                                    )}
                                    {isExpired && (
                                      <div className="text-[9px] opacity-70 mt-0.5">{formatDate(entry.expiresAt)}</div>
                                    )}
                                  </div>
                                
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/8 rounded-xl font-bold text-xs"
                                    onClick={() => handleExtendPhone(entry.phone)}
                                    disabled={isSyncing}
                                    title={entry.planType === 'purchase' ? '1년 연장 (179,000원)' : `${getPlanDays(entry.planType)}일 연장`}
                                  >
                                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                    연장
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0 text-red-400/40 hover:text-red-400 hover:bg-red-500/8 rounded-xl"
                                  onClick={() => handleRemovePhone(entry.phone)}
                                  disabled={isSyncing}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {filteredList.length === 0 && searchQuery && (
                        <div className="text-center py-8 text-white/20">
                          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">검색 결과가 없습니다</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pricing info — 하단 배치 */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-violet-500/[0.06] border border-violet-500/15 rounded-2xl p-3 sm:p-4 text-center">
                    <ShoppingCart className="w-5 h-5 text-violet-400 mx-auto mb-1.5" />
                    <p className="text-[11px] sm:text-sm font-bold text-violet-300">구매 고객</p>
                    <p className="text-lg sm:text-xl font-extrabold text-white mt-1">179,000<span className="text-[11px] text-violet-300/50 font-medium">/년</span></p>
                    <p className="text-[10px] text-white/25 mt-0.5">1년 무료 후 갱신</p>
                  </div>
                  <div className="bg-blue-500/[0.06] border border-blue-500/15 rounded-2xl p-3 sm:p-4 text-center">
                    <Key className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                    <p className="text-[11px] sm:text-sm font-bold text-blue-300">렌탈 고객</p>
                    <p className="text-lg sm:text-xl font-extrabold text-white mt-1">무료</p>
                    <p className="text-[10px] text-white/25 mt-0.5">렌탈 기간 내 무료</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-7 py-4">
            <p className="text-xs text-white/15 text-center">
              구매: 1년 무료 + 179,000원/년 갱신 &middot; 렌탈: 사용 기간 중 무료
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}