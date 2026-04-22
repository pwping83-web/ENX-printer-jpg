import { useState, useRef } from 'react';
import { X, Send, CheckCircle, Phone, Loader2, Camera, ImagePlus, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import emailjs from '@emailjs/browser';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface TroubleReportModalProps {
  onClose: () => void;
  userPhone: string;
}

const EMAILJS_SERVICE_ID = 'service_yde5guq';
const EMAILJS_TEMPLATE_ID = 'template_8dglgra';
const EMAILJS_PUBLIC_KEY = '7-EF2vKlS3sc_N5rp';
const UPLOAD_URL = `https://${projectId}.supabase.co/functions/v1/make-server-773fbcdb/trouble/upload-photo`;

const SYMPTOMS = [
  { id: 'smear', label: '인쇄물 번짐', icon: '💦' },
  { id: 'line', label: '줄 생김', icon: '📄' },
  { id: 'no-ink', label: '잉크 안나옴', icon: '💧' },
  { id: 'color', label: '색상 이상', icon: '🎨' },
  { id: 'error', label: '에러 표시', icon: '⚠️' },
  { id: 'position', label: '위치 안맞음', icon: '🎯' },
  { id: 'jam', label: '용지 걸림', icon: '📑' },
  { id: 'power', label: '전원 안됨', icon: '🔌' },
  { id: 'noise', label: '이상한 소리', icon: '🔊' },
  { id: 'connect', label: '연결 안됨', icon: '🔗' },
  { id: 'program', label: '프로그램 오류', icon: '💻' },
  { id: 'other', label: '기타', icon: '❓' },
];

interface PhotoItem {
  file: File;
  preview: string;
  uploadedUrl?: string;
  uploading?: boolean;
}

export function TroubleReportModal({ onClose, userPhone }: TroubleReportModalProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MAX_PHOTOS = 3;

  const displayPhone = userPhone.length === 11
    ? `${userPhone.slice(0, 3)}-${userPhone.slice(3, 7)}-${userPhone.slice(7)}`
    : userPhone;

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) { toast.error(`최대 ${MAX_PHOTOS}장까지`); return; }
    const newPhotos: PhotoItem[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) { toast.error('10MB 이하만 가능'); continue; }
      newPhotos.push({ file, preview: URL.createObjectURL(file) });
    }
    if (newPhotos.length > 0) setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (photo.uploadedUrl) { urls.push(photo.uploadedUrl); continue; }
      setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, uploading: true } : p));
      try {
        const formData = new FormData();
        formData.append('photo', photo.file);
        formData.append('phone', userPhone);
        const res = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          body: formData,
        });
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || '업로드 실패'); }
        const data = await res.json();
        urls.push(data.url);
        setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, uploadedUrl: data.url, uploading: false } : p));
      } catch (error) {
        console.error('Photo upload failed:', error);
        setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, uploading: false } : p));
        throw error;
      }
    }
    return urls;
  };

  const handleSend = async () => {
    if (checked.size === 0) { toast.error('증상을 선택해주세요'); return; }
    setIsSending(true);
    try {
      let photoUrls: string[] = [];
      if (photos.length > 0) photoUrls = await uploadPhotos();

      const selectedSymptoms = SYMPTOMS.filter(s => checked.has(s.id));
      const now = new Date();
      const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

      const symptomTags = selectedSymptoms
        .map(s => {
          const isSW = ['program', 'connect', 'error'].includes(s.id);
          const bgColor = isSW ? '#EEF2FF' : '#FFF7ED';
          const textColor = isSW ? '#4F46E5' : '#C2410C';
          const borderColor = isSW ? '#C7D2FE' : '#FED7AA';
          return `<span style="display:inline-block;padding:6px 14px;margin:4px;background:${bgColor};color:${textColor};border:1px solid ${borderColor};border-radius:20px;font-size:14px;font-weight:600;">${s.icon} ${s.label}</span>`;
        }).join('');

      const photoHtml = photoUrls.length > 0
        ? photoUrls.map((url, i) => `<a href="${url}" target="_blank" style="display:inline-block;margin:4px;padding:8px 16px;background:#EEF2FF;color:#4F46E5;border:1px solid #C7D2FE;border-radius:12px;font-size:13px;font-weight:600;text-decoration:none;">📷 사진 ${i + 1} 보기</a>`).join('')
        : '';

      const hwSymptoms = selectedSymptoms.filter(s => ['power', 'jam', 'noise', 'line', 'no-ink', 'color', 'position'].includes(s.id));
      const swSymptoms = selectedSymptoms.filter(s => ['program', 'connect', 'error'].includes(s.id));
      const urgencyLabel = selectedSymptoms.length >= 3 ? '🔴 긴급' : selectedSymptoms.length >= 2 ? '🟡 보통' : '🟢 경미';
      const typeLabel = hwSymptoms.length > 0 && swSymptoms.length > 0 ? 'HW + SW 복합'
        : hwSymptoms.length > 0 ? 'HW (하드웨어)' : swSymptoms.length > 0 ? 'SW (소프트웨어)' : '기타';

      const memoWithPhotos = [
        note.trim(),
        photoUrls.length > 0 ? `\n[첨부 사진 ${photoUrls.length}장]\n${photoUrls.join('\n')}` : '',
      ].filter(Boolean).join('\n');

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        phone: displayPhone,
        date: dateStr,
        time: timeStr,
        symptom_tags: symptomTags + (photoHtml ? `<br/><br/>${photoHtml}` : ''),
        symptom_count: String(selectedSymptoms.length),
        urgency: urgencyLabel,
        issue_type: typeLabel,
        memo: memoWithPhotos || '',
        has_memo: memoWithPhotos ? 'true' : '',
        hw_action: hwSymptoms.length > 0 ? 'true' : '',
        sw_action: swSymptoms.length > 0 ? 'true' : '',
      }, EMAILJS_PUBLIC_KEY);

      const reports = JSON.parse(localStorage.getItem('enx-trouble-reports') || '[]');
      reports.push({ phone: userPhone, symptoms: Array.from(checked), note: note.trim(), photoCount: photos.length, date: now.toISOString() });
      localStorage.setItem('enx-trouble-reports', JSON.stringify(reports));

      setIsSending(false);
      setIsSent(true);
      toast.success('접수 완료!');
    } catch (error) {
      console.error('고장신고 전송 실패:', error);
      setIsSending(false);
      toast.error('전송 실패. 다시 시도해주세요.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* 헤더 */}
          <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600">
            {/* Drag handle (모바일) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/30 sm:hidden" />
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-3xl">🔧</span>
              <div>
                <h2 className="text-white text-lg leading-tight" style={{ fontWeight: 800 }}>고장신고</h2>
                <p className="text-white/60 text-xs mt-0.5" style={{ fontWeight: 500 }}>증상만 터치하면 바로 접수!</p>
              </div>
            </div>
          </div>

          {isSent ? (
            /* 완료 화면 */
            <div className="p-10 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              >
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
              </motion.div>
              <div>
                <p className="text-xl text-slate-800 dark:text-white" style={{ fontWeight: 800 }}>접수 완료!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1" style={{ fontWeight: 500 }}>바로 연락드릴게요 📞</p>
              </div>
              <Button onClick={onClose} className="h-12 px-10 bg-indigo-500 hover:bg-indigo-600 text-white border-0 rounded-2xl text-base" style={{ fontWeight: 700 }}>
                확인
              </Button>
            </div>
          ) : (
            /* 신고 폼 */
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-100px)]">

              {/* 증상 선택 */}
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 px-0.5" style={{ fontWeight: 700 }}>
                  어떤 증상인가요?
                  {checked.size > 0 && <span className="ml-1.5 text-indigo-500">{checked.size}개 선택</span>}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {SYMPTOMS.map((item) => {
                    const on = checked.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        className={`relative flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all active:scale-[0.93] ${
                          on
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500 shadow-sm shadow-indigo-500/10'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-2xl leading-none">{item.icon}</span>
                        <span className={`text-[10px] leading-tight text-center ${
                          on ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'
                        }`} style={{ fontWeight: on ? 700 : 500 }}>
                          {item.label}
                        </span>
                        {on && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm"
                          >
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 사진 첨부 */}
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 px-0.5" style={{ fontWeight: 700 }}>
                  📷 사진 첨부 <span className="text-slate-300 dark:text-slate-600" style={{ fontWeight: 400 }}>(선택)</span>
                  {photos.length > 0 && <span className="ml-1 text-indigo-500">{photos.length}/{MAX_PHOTOS}</span>}
                </p>

                {/* 첨부된 사진 미리보기 */}
                {photos.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {photos.map((photo, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-700 shrink-0"
                      >
                        <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                        {photo.uploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        )}
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* 촬영/앨범 버튼 */}
                {photos.length < MAX_PHOTOS && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200/60 dark:border-slate-700/40 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all active:scale-[0.97]"
                    >
                      <Camera className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500" style={{ fontWeight: 600 }}>촬영</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200/60 dark:border-slate-700/40 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all active:scale-[0.97]"
                    >
                      <ImagePlus className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500" style={{ fontWeight: 600 }}>앨범</span>
                    </button>
                  </div>
                )}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
              </div>

              {/* 메모 */}
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="추가 설명 (선택)"
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/30 rounded-xl text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none focus:ring-1 focus:ring-indigo-300/40"
              />

              {/* 보내기 버튼 */}
              <Button
                onClick={handleSend}
                disabled={checked.size === 0 || isSending}
                className="w-full h-13 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 rounded-2xl shadow-lg shadow-indigo-500/15 disabled:opacity-30 disabled:shadow-none text-base"
                style={{ fontWeight: 800 }}
              >
                {isSending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{photos.length > 0 ? '사진 업로드 중...' : '전송 중...'}</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />신고 보내기{photos.length > 0 ? ` (📷${photos.length})` : ''}</>
                )}
              </Button>

              {/* 바로 연락 */}
              <div className="flex gap-2">
                <a
                  href="https://open.kakao.com/o/suzPp27h"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] transition-all active:scale-[0.97]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm" style={{ fontWeight: 700 }}>카톡 문의</span>
                </a>
                <a
                  href="tel:010-4639-2673"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-all active:scale-[0.97]"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm" style={{ fontWeight: 700 }}>전화 문의</span>
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}