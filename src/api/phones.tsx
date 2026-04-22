import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-773fbcdb`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

export interface PhoneEntry {
  phone: string;
  registeredAt: string;
  expiresAt: string;
  planType: 'purchase' | 'rental_1m' | 'rental_3m' | 'rental_6m' | 'rental_12m';
  planLabel?: string;
  renewalPrice?: number;
  lastAccessedAt?: string;
  accessHistory?: string[];
}

// 모든 전화번호 목록 조회
export async function fetchPhones(): Promise<PhoneEntry[]> {
  const res = await fetch(`${BASE_URL}/phones`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('fetchPhones error:', err);
    throw new Error(err.error || '전화번호 목록 조회 실패');
  }
  const data = await res.json();
  return data.phones || [];
}

// 전화번호 등록
export async function addPhone(entry: PhoneEntry): Promise<PhoneEntry> {
  const res = await fetch(`${BASE_URL}/phones`, {
    method: 'POST',
    headers,
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('addPhone error:', err);
    throw new Error(err.error || '전화번호 등록 실패');
  }
  const data = await res.json();
  return data.entry;
}

// 전화번호 삭제
export async function deletePhone(phone: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/phones/${phone}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('deletePhone error:', err);
    throw new Error(err.error || '전화번호 삭제 실패');
  }
}

// 전화번호 기간 연장
export async function extendPhone(phone: string, newExpiresAt: string): Promise<PhoneEntry> {
  const res = await fetch(`${BASE_URL}/phones/${phone}/extend`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ newExpiresAt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('extendPhone error:', err);
    throw new Error(err.error || '기간 연장 실패');
  }
  const data = await res.json();
  return data.entry;
}

// 전화번호 인증 (로그인용)
export async function verifyPhone(phone: string): Promise<{ found: boolean; entry?: PhoneEntry }> {
  const res = await fetch(`${BASE_URL}/phones/${phone}/verify`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('verifyPhone error:', err);
    throw new Error(err.error || '전화번호 인증 실패');
  }
  return await res.json();
}

// 초기 데이터 시딩
export async function seedPhones(phones: PhoneEntry[]): Promise<number> {
  const res = await fetch(`${BASE_URL}/phones/seed`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phones }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('seedPhones error:', err);
    throw new Error(err.error || '시딩 실패');
  }
  const data = await res.json();
  return data.seeded;
}

export async function touchPhone(phone: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/phones/${phone}/touch`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      }
    });
  } catch (e) {
    console.error('touchPhone error:', e);
  }
}