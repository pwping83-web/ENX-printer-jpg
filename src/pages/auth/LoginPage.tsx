import { useState, useMemo } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Lock, Phone, Shield, Sparkles, ArrowRight, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { verifyPhone } from '../../api/phones';
import type { PhoneEntry } from '../../api/phones';

interface LoginPageProps {
  onLogin: (phone: string, entry?: PhoneEntry) => void;
  onAdminPageOpen?: () => void;
}

// Floating particle component
function FloatingParticles() {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.3 + 0.05,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function LoginPage({ onLogin, onAdminPageOpen }: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      toast.error('전화번호를 입력해주세요');
      return;
    }
    const numbers = phoneNumber.replace(/[^\d]/g, '');
    if (numbers.length !== 11) {
      toast.error('올바른 전화번호를 입력해주세요 (11자리)');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyPhone(numbers);

      if (result.found && result.entry) {
        const phoneEntry = result.entry;
        const expiresAt = new Date(phoneEntry.expiresAt);
        const now = new Date();
        if (now > expiresAt) {
          const renewalMsg = phoneEntry.planType === 'purchase' 
            ? '갱신이 필요합니다 (179,000원/년)' 
            : '렌탈 기간이 종료되었습니다';
          toast.error(`사용 기간이 만료되었습니다. ${renewalMsg}`);
          setPhoneNumber('');
          setIsLoading(false);
          return;
        }
        const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const planLabel = phoneEntry.planType === 'purchase' ? '구매' : 
          phoneEntry.planType === 'rental_1m' ? '렌탈 1개월' :
          phoneEntry.planType === 'rental_3m' ? '렌탈 3개월' :
          phoneEntry.planType === 'rental_6m' ? '렌탈 6개월' :
          phoneEntry.planType === 'rental_12m' ? '렌탈 12개월' : '이용';
        
        if (daysLeft <= 7) {
          toast.warning(`사용 기간이 ${daysLeft}일 남았습니다! 갱신을 준비해 주세요.`);
        } else if (daysLeft <= 30) {
          toast.warning(`[${planLabel}] 남은 기간: ${daysLeft}일`);
        } else {
          toast.success(`[${planLabel}] 남은 기간: ${daysLeft}일`);
        }
        onLogin(numbers, phoneEntry);
      } else {
        toast.error('등록되지 않은 전화번호입니다');
        setPhoneNumber('');
      }
    } catch (error) {
      console.error('로그인 인증 실패:', error);
      toast.error('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 1. min-h-screen을 min-h-[100dvh]로 변경하고, bg-[#0a0f1e]를 추가해 흰색 깜빡임을 차단
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden p-4 bg-[#0a0f1e] transform-gpu"
      style={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #141937 20%, #1a1f4e 40%, #0d1333 60%, #0a0f1e 80%, #111640 100%)',
      }}
    >
      {/* Floating particles */}
      <FloatingParticles />

      {/* 2. 모바일에서는 blur 수치를 낮추고(80px), transform-gpu를 추가하여 렌더링 최적화 */}
      <motion.div 
        className="absolute top-[-20%] left-[-15%] w-[55%] h-[55%] bg-indigo-600/15 rounded-full blur-[80px] sm:blur-[140px] pointer-events-none transform-gpu will-change-transform"
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-[-20%] right-[-15%] w-[55%] h-[55%] bg-violet-600/15 rounded-full blur-[80px] sm:blur-[140px] pointer-events-none transform-gpu will-change-transform"
        animate={{ scale: [1, 1.15, 1], x: [0, -15, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div 
        className="absolute top-[30%] right-[5%] w-[35%] h-[35%] bg-blue-600/10 rounded-full blur-[60px] sm:blur-[120px] pointer-events-none transform-gpu will-change-transform"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div 
        className="absolute bottom-[20%] left-[10%] w-[25%] h-[25%] bg-cyan-500/8 rounded-full blur-[50px] sm:blur-[100px] pointer-events-none transform-gpu will-change-transform"
        animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="relative w-full max-w-md bg-white/[0.06] backdrop-blur-2xl border border-white/[0.1] shadow-[0_8px_80px_-20px_rgba(79,70,229,0.35)] rounded-3xl overflow-hidden">
          {/* Top gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent" />
          
          {/* Shimmer effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12 pointer-events-none"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 5, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }}
          />
          
          <CardHeader className="space-y-5 text-center pt-10 pb-4">
            {/* Animated Logo */}
            <motion.div 
              className="mx-auto relative"
              initial={{ scale: 0.5, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 via-violet-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40 hover:scale-110 transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/50">
                <Shield className="w-10 h-10 text-white drop-shadow-md" />
              </div>
              {/* Glow ring */}
              <motion.div 
                className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-xl -z-10"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Orbiting dot */}
              <motion.div
                className="absolute w-2 h-2 bg-indigo-400 rounded-full shadow-lg shadow-indigo-400/50"
                animate={{
                  x: [0, 30, 0, -30, 0],
                  y: [-30, 0, 30, 0, -30],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                style={{ top: '50%', left: '50%' }}
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <CardTitle className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-white tracking-tight">
                ENX 프린터
              </CardTitle>
              <p className="text-sm text-indigo-300/70 font-medium mt-2.5 tracking-wide">
                등록된 전화번호로 로그인하세요
              </p>
            </motion.div>
          </CardHeader>

          <CardContent className="pb-10 px-7">
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-bold text-indigo-200/60 ml-1 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5" />
                  전화번호
                </Label>
                <div className={`relative group rounded-xl transition-all duration-500 ${isFocused ? 'ring-2 ring-indigo-400/30 shadow-lg shadow-indigo-500/10' : ''}`}>
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400/40 group-focus-within:text-indigo-300 transition-colors duration-300" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="010-1234-5678"
                    maxLength={13}
                    className="pl-12 h-14 text-lg bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus:bg-white/[0.1] focus:border-indigo-400/40 transition-all rounded-xl ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="relative w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 border-0 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                disabled={isLoading}
              >
                {/* Button shimmer */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                />
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    확인 중...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    입장하기
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.form>

            {/* Divider */}
            <div className="mt-6 text-center">
              <motion.button
                type="button"
                onClick={() => {
                  toast.success('체험 모드로 입장합니다');
                  onLogin('TEST_MODE');
                }}
                className="inline-flex items-center justify-center text-[11px] text-indigo-300/40 hover:text-indigo-300 transition-colors duration-300 group"
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-3 h-3 mr-1.5 opacity-50 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
                체험 모드
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom area */}
      <div className="fixed bottom-5 text-center w-full">
        <p className="text-xs font-medium text-indigo-300/15 pointer-events-none tracking-wider">
          ENX Printer System
        </p>
      </div>
      {/* 관리자 진입 - 우하단 극소 도트 */}
      {onAdminPageOpen && (
        <button
          onClick={onAdminPageOpen}
          className="fixed bottom-2 right-2 w-3 h-3 rounded-full opacity-[0.04] hover:opacity-20 bg-white transition-opacity z-50"
          aria-label="admin"
        />
      )}
    </div>
  );
}