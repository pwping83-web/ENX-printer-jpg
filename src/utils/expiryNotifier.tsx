import emailjs from '@emailjs/browser';
import { fetchPhones } from '../api/phones';
import type { PhoneEntry } from '../api/phones';

// EmailJS 설정 (고장 신고와 동일한 서비스)
const EMAILJS_SERVICE_ID = 'service_yde5guq';
const EMAILJS_TEMPLATE_ID = 'template_8dglgra';
const EMAILJS_PUBLIC_KEY = '7-EF2vKlS3sc_N5rp';

const NOTIFICATION_KEY = 'enx-expiry-notification-sent';
const THRESHOLD_DAYS = 2; // 2일 이하 남으면 알림

function getDaysLeft(expiresAt: string): number {
  const expires = new Date(expiresAt);
  const now = new Date();
  return Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function displayPhone(phone: string): string {
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  }
  return phone;
}

function getPlanLabel(planType: string): string {
  if (planType === 'purchase') return '구매';
  if (planType === 'rental_1m') return '렌탈 1개월';
  if (planType === 'rental_3m') return '렌탈 3개월';
  if (planType === 'rental_6m') return '렌탈 6개월';
  if (planType === 'rental_12m') return '렌탈 12개월';
  return '기타';
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** 앱 로드 시 호출 — 만료 임박(2일 이하) 고객이 있으면 이메일 알림 전송 */
export async function checkAndNotifyExpiry(): Promise<void> {
  try {
    // 오늘 이미 알림을 보냈으면 스킵
    const todayKey = getTodayKey();
    const lastSent = localStorage.getItem(NOTIFICATION_KEY);
    if (lastSent === todayKey) {
      console.log('📧 만료 알림: 오늘 이미 발송됨, 스킵');
      return;
    }

    // 서버에서 전화번호 목록 가져오기
    const phones: PhoneEntry[] = await fetchPhones();
    if (!phones.length) return;

    // 2일 이하 남은 고객 필터링
    const urgentEntries = phones.filter(p => {
      const days = getDaysLeft(p.expiresAt);
      return days >= 0 && days <= THRESHOLD_DAYS;
    });

    // 이미 만료된 고객도 포함
    const expiredEntries = phones.filter(p => getDaysLeft(p.expiresAt) < 0);

    if (urgentEntries.length === 0 && expiredEntries.length === 0) {
      console.log('📧 만료 알림: 임박/만료 고객 없음');
      return;
    }

    // 알림 내용 구성
    const now = new Date();
    const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 임박 고객 목록 텍스트
    const urgentList = urgentEntries.map(p => {
      const days = getDaysLeft(p.expiresAt);
      return `⚠️ ${displayPhone(p.phone)} (${getPlanLabel(p.planType)}) — ${days === 0 ? '오늘 만료' : `${days}일 남음`}`;
    }).join('\n');

    // 만료된 고객 목록 텍스트
    const expiredList = expiredEntries.map(p => {
      const days = Math.abs(getDaysLeft(p.expiresAt));
      return `❌ ${displayPhone(p.phone)} (${getPlanLabel(p.planType)}) — ${days}일 전 만료`;
    }).join('\n');

    const totalCount = urgentEntries.length + expiredEntries.length;

    // EmailJS 템플릿에 맞게 파라미터 구성
    const templateParams = {
      phone: '010-4639-2673',
      date: dateStr,
      time: timeStr,
      symptom_tags: `만료 임박 ${urgentEntries.length}건, 만료됨 ${expiredEntries.length}건`,
      symptom_count: String(totalCount),
      urgency: urgentEntries.length > 0 ? '긴급' : '주의',
      issue_type: '📅 구독 만료 자동 알림',
      memo: [
        urgentList ? `[만료 임박 (${THRESHOLD_DAYS}일 이내)]\n${urgentList}` : '',
        expiredList ? `[이미 만료됨]\n${expiredList}` : '',
        '',
        `총 ${phones.length}명 중 ${totalCount}명 조치 필요`,
      ].filter(Boolean).join('\n\n'),
      has_memo: 'true',
      hw_action: '',
      sw_action: '',
    };

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);

    // 오늘 발송 기록
    localStorage.setItem(NOTIFICATION_KEY, todayKey);
    console.log(`📧 만료 알림 전송 완료: 임박 ${urgentEntries.length}건, 만료 ${expiredEntries.length}건`);
  } catch (error) {
    console.error('📧 만료 알림 전송 실패:', error);
    // 알림 실패해도 앱 동작에는 영향 없음
  }
}
