import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const TROUBLE_BUCKET = "make-773fbcdb-trouble-photos";
const PHONES_TABLE = "enx_phones";

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

app.use('*', logger(console.log));

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

// DB row → PhoneEntry 변환
function rowToEntry(row: any) {
  return {
    phone: row.phone,
    registeredAt: row.registered_at,
    expiresAt: row.expires_at,
    planType: row.plan_type,
    planLabel: row.plan_label ?? undefined,
    renewalPrice: row.renewal_price ?? undefined,
    lastAccessedAt: row.last_accessed_at ?? undefined,
    accessHistory: row.access_history ?? [],
  };
}

// PhoneEntry → DB row 변환
function entryToRow(entry: any) {
  return {
    phone: entry.phone,
    registered_at: entry.registeredAt,
    expires_at: entry.expiresAt,
    plan_type: entry.planType,
    plan_label: entry.planLabel ?? null,
    renewal_price: entry.renewalPrice ?? null,
    last_accessed_at: entry.lastAccessedAt ?? null,
    access_history: entry.accessHistory ?? [],
  };
}

// Health check
app.get("/make-server-773fbcdb/health", (c) => {
  return c.json({ status: "ok" });
});

// ━━ 전화번호 관리 API ━━

// 모든 전화번호 목록 조회
app.get("/make-server-773fbcdb/phones", async (c) => {
  try {
    const { data, error } = await supabase.from(PHONES_TABLE).select("*");
    if (error) throw error;
    return c.json({ phones: (data || []).map(rowToEntry) });
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

    const { data: existing } = await supabase
      .from(PHONES_TABLE)
      .select("phone")
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      return c.json({ error: "이미 등록된 전화번호입니다" }, 409);
    }

    const row = entryToRow(body);
    const { data, error } = await supabase
      .from(PHONES_TABLE)
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return c.json({ success: true, entry: rowToEntry(data) });
  } catch (error) {
    console.log("Error adding phone:", error);
    return c.json({ error: `전화번호 등록 실패: ${error}` }, 500);
  }
});

// 전화번호 삭제
app.delete("/make-server-773fbcdb/phones/:phone", async (c) => {
  try {
    const phone = c.req.param("phone");
    const { error } = await supabase
      .from(PHONES_TABLE)
      .delete()
      .eq("phone", phone);
    if (error) throw error;
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

    const { data: existing } = await supabase
      .from(PHONES_TABLE)
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (!existing) {
      return c.json({ error: "등록되지 않은 전화번호입니다" }, 404);
    }

    const { data, error } = await supabase
      .from(PHONES_TABLE)
      .update({ expires_at: newExpiresAt })
      .eq("phone", phone)
      .select()
      .single();

    if (error) throw error;
    return c.json({ success: true, entry: rowToEntry(data) });
  } catch (error) {
    console.log("Error extending phone:", error);
    return c.json({ error: `기간 연장 실패: ${error}` }, 500);
  }
});

// 전화번호 인증 (로그인용)
app.get("/make-server-773fbcdb/phones/:phone/verify", async (c) => {
  try {
    const phone = c.req.param("phone");
    const { data, error } = await supabase
      .from(PHONES_TABLE)
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return c.json({ found: false, error: "등록되지 않은 전화번호입니다" });
    }
    return c.json({ found: true, entry: rowToEntry(data) });
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
      const { data: existing } = await supabase
        .from(PHONES_TABLE)
        .select("phone")
        .eq("phone", entry.phone)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from(PHONES_TABLE)
          .insert(entryToRow(entry));
        if (!error) seeded++;
      }
    }
    return c.json({ success: true, seeded });
  } catch (error) {
    console.log("Error seeding phones:", error);
    return c.json({ error: `시딩 실패: ${error}` }, 500);
  }
});

// ━━ 고장신고 사진 업로드 API ━━

app.post("/make-server-773fbcdb/trouble/upload-photo", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("photo") as File | null;
    const phone = formData.get("phone") as string | null;

    if (!file) {
      return c.json({ error: "사진 파일이 없습니다" }, 400);
    }

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

// ━━ 접속 기록 API ━━
app.put("/make-server-773fbcdb/phones/:phone/touch", async (c) => {
  try {
    const phone = c.req.param("phone");

    const { data: existing } = await supabase
      .from(PHONES_TABLE)
      .select("last_accessed_at, access_history")
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      const now = new Date();
      const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const dateString = kstDate.toISOString().split('T')[0];

      const history: string[] = existing.access_history || [];
      if (!history.includes(dateString)) {
        history.push(dateString);
        if (history.length > 30) history.shift();
      }

      await supabase
        .from(PHONES_TABLE)
        .update({ last_accessed_at: dateString, access_history: history })
        .eq("phone", phone);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log("Error touching phone:", error);
    return c.json({ error: `접속 갱신 실패: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
