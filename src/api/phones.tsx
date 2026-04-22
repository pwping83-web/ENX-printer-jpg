import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-773fbcdb`;
const LOCAL_PHONES_KEY = 'enx-registered-phones';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

function readLocalPhones(): PhoneEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PHONES_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeLocalPhones(phones: PhoneEntry[]): void {
  localStorage.setItem(LOCAL_PHONES_KEY, JSON.stringify(phones));
}

function shouldFallbackToLocal(errorBody: any, status?: number): boolean {
  return status === 404 || errorBody?.code === 'NOT_FOUND' || errorBody?.message === 'Requested function was not found';
}

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
    if (shouldFallbackToLocal(err, res.status)) {
      return readLocalPhones();
    }
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
    if (shouldFallbackToLocal(err, res.status)) {
      const phones = readLocalPhones();
      if (phones.some((p) => p.phone === entry.phone)) {
        throw new Error('이미 등록된 전화번호입니다');
      }
      phones.push(entry);
      writeLocalPhones(phones);
      return entry;
    }
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
    if (shouldFallbackToLocal(err, res.status)) {
      const phones = readLocalPhones().filter((p) => p.phone !== phone);
      writeLocalPhones(phones);
      return;
    }
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
    if (shouldFallbackToLocal(err, res.status)) {
      const phones = readLocalPhones();
      const index = phones.findIndex((p) => p.phone === phone);
      if (index < 0) {
        throw new Error('등록되지 않은 전화번호입니다');
      }
      const updated = { ...phones[index], expiresAt: newExpiresAt };
      phones[index] = updated;
      writeLocalPhones(phones);
      return updated;
    }
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
    if (shouldFallbackToLocal(err, res.status)) {
      const entry = readLocalPhones().find((p) => p.phone === phone);
      return entry ? { found: true, entry } : { found: false };
    }
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
    if (shouldFallbackToLocal(err, res.status)) {
      const existing = readLocalPhones();
      const existingSet = new Set(existing.map((p) => p.phone));
      const toAdd = phones.filter((p) => !existingSet.has(p.phone));
      if (toAdd.length > 0) {
        writeLocalPhones([...existing, ...toAdd]);
      }
      return toAdd.length;
    }
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