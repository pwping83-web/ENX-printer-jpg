import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-773fbcdb`;
const LOCAL_PHONES_KEY = 'enx-registered-phones';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

function mergePhones(primary: PhoneEntry[], secondary: PhoneEntry[]): PhoneEntry[] {
  const map = new Map<string, PhoneEntry>();
  for (const item of secondary) {
    map.set(item.phone, item);
  }
  for (const item of primary) {
    map.set(item.phone, item);
  }
  return Array.from(map.values());
}

function getMissingPhones(source: PhoneEntry[], target: PhoneEntry[]): PhoneEntry[] {
  const targetSet = new Set(target.map((p) => p.phone));
  return source.filter((p) => !targetSet.has(p.phone));
}

async function syncMissingPhonesToServer(entries: PhoneEntry[]): Promise<void> {
  for (const entry of entries) {
    try {
      const res = await fetch(`${BASE_URL}/phones`, {
        method: 'POST',
        headers,
        body: JSON.stringify(entry),
      });
      if (!res.ok && res.status !== 409) {
        const err = await res.json().catch(() => ({}));
        console.error('syncMissingPhonesToServer error:', err);
      }
    } catch (error) {
      if (!isNetworkFetchError(error)) {
        console.error('syncMissingPhonesToServer failed:', error);
      }
    }
  }
}

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

function isNetworkFetchError(error: unknown): boolean {
  return error instanceof TypeError || String(error).includes('Failed to fetch');
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
  try {
    const localPhones = readLocalPhones();
    const res = await fetch(`${BASE_URL}/phones`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (shouldFallbackToLocal(err, res.status)) {
        return localPhones;
      }
      console.error('fetchPhones error:', err);
      throw new Error(err.error || '전화번호 목록 조회 실패');
    }
    const data = await res.json();
    const remotePhones = data.phones || [];
    const mergedPhones = mergePhones(remotePhones, localPhones);
    writeLocalPhones(mergedPhones);

    const missingOnServer = getMissingPhones(localPhones, remotePhones);
    if (missingOnServer.length > 0) {
      syncMissingPhonesToServer(missingOnServer).catch((e) => {
        console.error('백그라운드 서버 동기화 실패:', e);
      });
    }

    return mergedPhones;
  } catch (error) {
    if (isNetworkFetchError(error)) {
      return readLocalPhones();
    }
    throw error;
  }
}

// 전화번호 등록
export async function addPhone(entry: PhoneEntry): Promise<PhoneEntry> {
  try {
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
    const savedEntry = data.entry || entry;
    const merged = mergePhones([savedEntry], readLocalPhones());
    writeLocalPhones(merged);
    return savedEntry;
  } catch (error) {
    if (isNetworkFetchError(error)) {
      const phones = readLocalPhones();
      if (phones.some((p) => p.phone === entry.phone)) {
        throw new Error('이미 등록된 전화번호입니다');
      }
      phones.push(entry);
      writeLocalPhones(phones);
      return entry;
    }
    throw error;
  }
}

// 전화번호 삭제
export async function deletePhone(phone: string): Promise<void> {
  try {
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
    const phones = readLocalPhones().filter((p) => p.phone !== phone);
    writeLocalPhones(phones);
  } catch (error) {
    if (isNetworkFetchError(error)) {
      const phones = readLocalPhones().filter((p) => p.phone !== phone);
      writeLocalPhones(phones);
      return;
    }
    throw error;
  }
}

// 전화번호 기간 연장
export async function extendPhone(phone: string, newExpiresAt: string): Promise<PhoneEntry> {
  try {
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
    const updatedEntry = data.entry;
    if (updatedEntry) {
      const phones = readLocalPhones();
      const index = phones.findIndex((p) => p.phone === phone);
      if (index >= 0) {
        phones[index] = updatedEntry;
      } else {
        phones.push(updatedEntry);
      }
      writeLocalPhones(phones);
    }
    return updatedEntry;
  } catch (error) {
    if (isNetworkFetchError(error)) {
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
    throw error;
  }
}

// 전화번호 인증 (로그인용)
export async function verifyPhone(phone: string): Promise<{ found: boolean; entry?: PhoneEntry }> {
  try {
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
    const data = await res.json();
    if (data?.found && data?.entry) {
      const merged = mergePhones([data.entry], readLocalPhones());
      writeLocalPhones(merged);
      return data;
    }

    // 서버에서 유실된 경우 로컬 백업으로 인증 허용
    const localEntry = readLocalPhones().find((p) => p.phone === phone);
    if (localEntry) {
      syncMissingPhonesToServer([localEntry]).catch((e) => {
        console.error('verifyPhone 동기화 실패:', e);
      });
      return { found: true, entry: localEntry };
    }

    return data;
  } catch (error) {
    if (isNetworkFetchError(error)) {
      const entry = readLocalPhones().find((p) => p.phone === phone);
      return entry ? { found: true, entry } : { found: false };
    }
    throw error;
  }
}

// 초기 데이터 시딩
export async function seedPhones(phones: PhoneEntry[]): Promise<number> {
  try {
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
    const merged = mergePhones(phones, readLocalPhones());
    writeLocalPhones(merged);
    return data.seeded;
  } catch (error) {
    if (isNetworkFetchError(error)) {
      const existing = readLocalPhones();
      const existingSet = new Set(existing.map((p) => p.phone));
      const toAdd = phones.filter((p) => !existingSet.has(p.phone));
      if (toAdd.length > 0) {
        writeLocalPhones([...existing, ...toAdd]);
      }
      return toAdd.length;
    }
    throw error;
  }
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