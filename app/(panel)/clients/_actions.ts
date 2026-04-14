"use server";

import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { query } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { hashPin } from "@/lib/auth-helpers";
import { addClientSchema, brandProfileSchema } from "@/lib/client-schema";

export interface CreateClientResult {
  ok: boolean;
  fieldErrors?: Record<string, string>;
  formError?: string;
}

export async function createClientAction(
  _prevState: CreateClientResult | null,
  formData: FormData
): Promise<CreateClientResult> {
  // 1. Pull every field out of the FormData and reshape into the nested
  //    structure the Zod schema expects.
  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").replace(/\D/g, ""),
    pin: String(formData.get("pin") ?? "").trim(),
    wordpressUrl: String(formData.get("wordpressUrl") ?? "").trim(),
    wpApiKey: String(formData.get("wpApiKey") ?? "").trim(),
    wpApiSecret: String(formData.get("wpApiSecret") ?? "").trim(),
    profile: {
      businessType: String(formData.get("businessType") ?? "").trim(),
      language: String(formData.get("language") ?? "").trim(),
      tone: String(formData.get("tone") ?? "").trim(),
      brandDescription: String(formData.get("brandDescription") ?? "").trim(),
      whatTheySell: String(formData.get("whatTheySell") ?? "").trim(),
      targetAudience: String(formData.get("targetAudience") ?? "").trim(),
      brandColors: {
        primary: String(formData.get("brandColors.primary") ?? "").trim(),
        secondary: String(formData.get("brandColors.secondary") ?? "").trim(),
        accent: String(formData.get("brandColors.accent") ?? "").trim(),
        background: String(formData.get("brandColors.background") ?? "").trim(),
      },
      imageStyle: String(formData.get("imageStyle") ?? "").trim(),
      doNot: String(formData.get("doNot") ?? "").trim(),
    },
  };

  // 2. Validate.
  const parsed = addClientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const data = parsed.data;

  // 3. Reject duplicate phones before hitting encryption / hashing.
  const existing = await query<{ id: string; name: string }>(
    "SELECT id, name FROM clients WHERE phone_number = $1",
    [data.phone]
  );
  if (existing.rows.length > 0) {
    return {
      ok: false,
      fieldErrors: {
        phone: `Already registered to "${existing.rows[0].name}".`,
      },
    };
  }

  // 4. Encrypt credentials, hash PIN, insert.
  let encKey: string;
  let encSecret: string;
  let pinHash: string;
  try {
    encKey = encrypt(data.wpApiKey);
    encSecret = encrypt(data.wpApiSecret);
    pinHash = await hashPin(data.pin);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, formError: `Encryption/hash failed: ${msg}` };
  }

  let newId: string;
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO clients (
         name,
         phone_number,
         wordpress_url,
         wp_api_key_encrypted,
         wp_api_secret_encrypted,
         security_pin_hash,
         system_prompt_config,
         active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id`,
      [
        data.name,
        data.phone,
        data.wordpressUrl,
        encKey,
        encSecret,
        pinHash,
        JSON.stringify(data.profile),
      ]
    );
    newId = result.rows[0].id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, formError: `Database insert failed: ${msg}` };
  }

  // 5. Success — revalidate the list page so the new row shows up, then
  //    redirect to the newly-created client's detail page.
  revalidatePath("/clients");
  redirect(`/clients/${newId}`);
}

// ============================================================
// UPDATE ACTIONS (Step 7) — inline editing of existing clients
// ============================================================

export interface UpdateResult {
  ok: boolean;
  fieldErrors?: Record<string, string>;
  formError?: string;
}

const identitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "Business name is required"),
  wordpressUrl: z.string().url("Must be a valid URL"),
});

export async function updateIdentityAction(
  _prev: UpdateResult | null,
  formData: FormData
): Promise<UpdateResult> {
  const parsed = identitySchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    wordpressUrl: String(formData.get("wordpressUrl") ?? "").trim(),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path.join(".");
      if (!fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { ok: false, fieldErrors };
  }
  try {
    await query(
      "UPDATE clients SET name = $1, wordpress_url = $2, updated_at = NOW() WHERE id = $3",
      [parsed.data.name, parsed.data.wordpressUrl, parsed.data.id]
    );
  } catch (err) {
    return {
      ok: false,
      formError: err instanceof Error ? err.message : String(err),
    };
  }
  revalidatePath(`/clients/${parsed.data.id}`);
  revalidatePath("/clients");
  return { ok: true };
}

const updateProfileFormSchema = z.object({
  id: z.string().uuid(),
  profile: brandProfileSchema,
});

export async function updateBrandProfileAction(
  _prev: UpdateResult | null,
  formData: FormData
): Promise<UpdateResult> {
  const raw = {
    id: String(formData.get("id") ?? ""),
    profile: {
      businessType: String(formData.get("businessType") ?? "").trim(),
      language: String(formData.get("language") ?? "").trim(),
      tone: String(formData.get("tone") ?? "").trim(),
      brandDescription: String(formData.get("brandDescription") ?? "").trim(),
      whatTheySell: String(formData.get("whatTheySell") ?? "").trim(),
      targetAudience: String(formData.get("targetAudience") ?? "").trim(),
      brandColors: {
        primary: String(formData.get("brandColors.primary") ?? "").trim(),
        secondary: String(formData.get("brandColors.secondary") ?? "").trim(),
        accent: String(formData.get("brandColors.accent") ?? "").trim(),
        background: String(formData.get("brandColors.background") ?? "").trim(),
      },
      imageStyle: String(formData.get("imageStyle") ?? "").trim(),
      doNot: String(formData.get("doNot") ?? "").trim(),
    },
  };
  const parsed = updateProfileFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path.slice(1).join("."); // strip leading "profile"
      if (!fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { ok: false, fieldErrors };
  }
  try {
    await query(
      "UPDATE clients SET system_prompt_config = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(parsed.data.profile), parsed.data.id]
    );
  } catch (err) {
    return {
      ok: false,
      formError: err instanceof Error ? err.message : String(err),
    };
  }
  revalidatePath(`/clients/${parsed.data.id}`);
  return { ok: true };
}

// ============================================================
// OPERATIONAL ACTIONS (Step 8)
// ============================================================

const pinSchema = z.object({
  id: z.string().uuid(),
  pin: z.string().regex(/^\d{4,6}$/, "4–6 digits"),
});

export async function resetPinAction(
  _prev: UpdateResult | null,
  formData: FormData
): Promise<UpdateResult> {
  const parsed = pinSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    pin: String(formData.get("pin") ?? "").trim(),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path.join(".");
      if (!fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { ok: false, fieldErrors };
  }
  try {
    const hash = await hashPin(parsed.data.pin);
    await query(
      `UPDATE clients
         SET security_pin_hash = $1,
             failed_pin_attempts = 0,
             locked_until = NULL,
             updated_at = NOW()
       WHERE id = $2`,
      [hash, parsed.data.id]
    );
  } catch (err) {
    return {
      ok: false,
      formError: err instanceof Error ? err.message : String(err),
    };
  }
  revalidatePath(`/clients/${parsed.data.id}`);
  return { ok: true };
}

const credSchema = z.object({
  id: z.string().uuid(),
  wpApiKey: z.string().min(10, "API key looks too short"),
  wpApiSecret: z.string().min(10, "API secret looks too short"),
});

export async function replaceWpCredentialsAction(
  _prev: UpdateResult | null,
  formData: FormData
): Promise<UpdateResult> {
  const parsed = credSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    wpApiKey: String(formData.get("wpApiKey") ?? "").trim(),
    wpApiSecret: String(formData.get("wpApiSecret") ?? "").trim(),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path.join(".");
      if (!fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { ok: false, fieldErrors };
  }
  try {
    const encKey = encrypt(parsed.data.wpApiKey);
    const encSecret = encrypt(parsed.data.wpApiSecret);
    await query(
      `UPDATE clients
         SET wp_api_key_encrypted = $1,
             wp_api_secret_encrypted = $2,
             updated_at = NOW()
       WHERE id = $3`,
      [encKey, encSecret, parsed.data.id]
    );
  } catch (err) {
    return {
      ok: false,
      formError: err instanceof Error ? err.message : String(err),
    };
  }
  revalidatePath(`/clients/${parsed.data.id}`);
  return { ok: true };
}

const idOnlySchema = z.object({ id: z.string().uuid() });

export async function unlockAccountAction(
  _prev: UpdateResult | null,
  formData: FormData
): Promise<UpdateResult> {
  const parsed = idOnlySchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, formError: "Invalid client id." };
  }
  try {
    await query(
      `UPDATE clients
         SET failed_pin_attempts = 0,
             locked_until = NULL,
             updated_at = NOW()
       WHERE id = $1`,
      [parsed.data.id]
    );
  } catch (err) {
    return {
      ok: false,
      formError: err instanceof Error ? err.message : String(err),
    };
  }
  revalidatePath(`/clients/${parsed.data.id}`);
  return { ok: true };
}

export async function endSessionAction(
  _prev: UpdateResult | null,
  formData: FormData
): Promise<UpdateResult> {
  const parsed = idOnlySchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) return { ok: false, formError: "Invalid client id." };
  try {
    await query(
      `UPDATE clients
         SET session_token = NULL,
             session_expires_at = NULL,
             updated_at = NOW()
       WHERE id = $1`,
      [parsed.data.id]
    );
  } catch (err) {
    return {
      ok: false,
      formError: err instanceof Error ? err.message : String(err),
    };
  }
  revalidatePath(`/clients/${parsed.data.id}`);
  return { ok: true };
}

const toggleActiveSchema = z.object({
  id: z.string().uuid(),
  active: z.enum(["true", "false"]),
});

export async function setActiveAction(
  _prev: UpdateResult | null,
  formData: FormData
): Promise<UpdateResult> {
  const parsed = toggleActiveSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    active: String(formData.get("active") ?? ""),
  });
  if (!parsed.success) return { ok: false, formError: "Invalid payload." };
  try {
    await query(
      "UPDATE clients SET active = $1, updated_at = NOW() WHERE id = $2",
      [parsed.data.active === "true", parsed.data.id]
    );
  } catch (err) {
    return {
      ok: false,
      formError: err instanceof Error ? err.message : String(err),
    };
  }
  revalidatePath(`/clients/${parsed.data.id}`);
  revalidatePath("/clients");
  return { ok: true };
}
