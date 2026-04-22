import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Supabase client for storage
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const TROUBLE_BUCKET = "make-773fbcdb-trouble-photos";

// Idempotently create the bucket on startup
(async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b: any) => b.name === TROUBLE_BUCKET);
    if (!bucketExists) {
      await supabase.storage.createBucket(TROUBLE_BUCKET, { public: false });
      console.log("Created bucket:", TROUBLE_BUCKET);
    }
  } catch (e) {
    console.log("Bucket init error (non-fatal):", e);
  }
})();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-773fbcdb/health", (c) => {
  return c.json({ status: "ok" });
});

// ━━ 전화번호 관리 API ━━

// 모든 전화번호 목록 조회
app.get("/make-server-773fbcdb/phones", async (c) => {
  try {
    const phones = await kv.getByPrefix("phone:");
    return c.json({ phones: phones || [] });
  } catch (error) {
    console.log("Error fetching phone list:", error);
    return c.json({ error: `전화번호 목록 조회 실패: ${error}` }, 500);
  }
});

// 전화번호 등록
app.post("/make-server-773fbcdb/phones", async (c) => {
  try {
    const body = await c.req.json();
    const { phone, registeredAt, expiresAt, planType } = body;
    if (!phone || !registeredAt || !expiresAt || !planType) {
      return c.json({ error: "필수 필드 누락: phone, registeredAt, expiresAt, planType" }, 400);
    }
    // 중복 체크
    const existing = await kv.get(`phone:${phone}`);
    if (existing) {
      return c.json({ error: "이미 등록된 전화번호입니다" }, 409);
    }
    const entry = { phone, registeredAt, expiresAt, planType };
    await kv.set(`phone:${phone}`, entry);
    return c.json({ success: true, entry });
  } catch (error) {
    console.log("Error adding phone:", error);
    return c.json({ error: `전화번호 등록 실패: ${error}` }, 500);
  }
});

// 전화번호 삭제
app.delete("/make-server-773fbcdb/phones/:phone", async (c) => {
  try {
    const phone = c.req.param("phone");
    await kv.del(`phone:${phone}`);
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting phone:", error);
    return c.json({ error: `전화번호 삭제 실패: ${error}` }, 500);
  }
});

// 전화번호 기간 연장
app.put("/make-server-773fbcdb/phones/:phone/extend", async (c) => {
  try {
    const phone = c.req.param("phone");
    const body = await c.req.json();
    const { newExpiresAt } = body;
    if (!newExpiresAt) {
      return c.json({ error: "newExpiresAt 필드 필요" }, 400);
    }
    const existing = await kv.get(`phone:${phone}`);
    if (!existing) {
      return c.json({ error: "등록되지 않은 전화번호입니다" }, 404);
    }
    const updated = { ...existing, expiresAt: newExpiresAt };
    await kv.set(`phone:${phone}`, updated);
    return c.json({ success: true, entry: updated });
  } catch (error) {
    console.log("Error extending phone:", error);
    return c.json({ error: `기간 연장 실패: ${error}` }, 500);
  }
});

// 전화번호 인증 (로그인용)
app.get("/make-server-773fbcdb/phones/:phone/verify", async (c) => {
  try {
    const phone = c.req.param("phone");
    const entry = await kv.get(`phone:${phone}`);
    if (!entry) {
      return c.json({ found: false, error: "등록되지 않은 전화번호입니다" });
    }
    return c.json({ found: true, entry });
  } catch (error) {
    console.log("Error verifying phone:", error);
    return c.json({ error: `전화번호 인증 실패: ${error}` }, 500);
  }
});

// 초기 데이터 시딩 (이미 있으면 스킵)
app.post("/make-server-773fbcdb/phones/seed", async (c) => {
  try {
    const body = await c.req.json();
    const { phones } = body;
    if (!phones || !Array.isArray(phones)) {
      return c.json({ error: "phones 배열 필요" }, 400);
    }
    let seeded = 0;
    for (const entry of phones) {
      const existing = await kv.get(`phone:${entry.phone}`);
      if (!existing) {
        await kv.set(`phone:${entry.phone}`, entry);
        seeded++;
      }
    }
    return c.json({ success: true, seeded });
  } catch (error) {
    console.log("Error seeding phones:", error);
    return c.json({ error: `시딩 실패: ${error}` }, 500);
  }
});

// ━━ 고장신고 사진 업로드 API ━━

// 사진 업로드 (multipart/form-data)
app.post("/make-server-773fbcdb/trouble/upload-photo", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("photo") as File | null;
    const phone = formData.get("phone") as string | null;

    if (!file) {
      return c.json({ error: "사진 파일이 없습니다" }, 400);
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: "파일 크기가 10MB를 초과합니다" }, 400);
    }

    const timestamp = Date.now();
    const sanitizedPhone = (phone || "unknown").replace(/[^0-9]/g, "");
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${sanitizedPhone}/${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(TROUBLE_BUCKET)
      .upload(filePath, uint8Array, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.log("Storage upload error:", uploadError);
      return c.json({ error: `사진 업로드 실패: ${uploadError.message}` }, 500);
    }

    // 7일 유효 서명 URL 생성
    const { data: signedData, error: signedError } = await supabase.storage
      .from(TROUBLE_BUCKET)
      .createSignedUrl(filePath, 60 * 60 * 24 * 7);

    if (signedError) {
      console.log("Signed URL error:", signedError);
      return c.json({ error: `서명 URL 생성 실패: ${signedError.message}` }, 500);
    }

    return c.json({ success: true, url: signedData.signedUrl, path: filePath });
  } catch (error) {
    console.log("Error uploading trouble photo:", error);
    return c.json({ error: `사진 업로드 오류: ${error}` }, 500);
  }
});

// ━━ 접속 기록 API (히스토리 배열 저장 방식) ━━
app.put("/make-server-773fbcdb/phones/:phone/touch", async (c) => {
  try {
    const phone = c.req.param("phone");
    const existing = await kv.get(`phone:${phone}`);
    
    if (existing) {
      // 한국 시간(KST) 오늘 날짜 추출
      const now = new Date();
      const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const dateString = kstDate.toISOString().split('T')[0];
      
      existing.lastAccessedAt = dateString;
      
      // 접속 기록 히스토리(배열)가 없으면 생성
      if (!existing.accessHistory) {
        existing.accessHistory = [];
      }
      
      // 오늘 날짜가 히스토리에 없으면 추가
      if (!existing.accessHistory.includes(dateString)) {
        existing.accessHistory.push(dateString);
        
        // 데이터가 무거워지지 않게 최대 30일치만 보관 (오래된 것 삭제)
        if (existing.accessHistory.length > 30) {
          existing.accessHistory.shift();
        }
      }

      await kv.set(`phone:${phone}`, existing);
    }
    return c.json({ success: true });
  } catch (error) {
    console.log("Error touching phone:", error);
    return c.json({ error: `접속 갱신 실패: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
