"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, TextInput, TextArea, ColorInput } from "@/components/form-primitives";
import { StatusBadge, SessionBadge } from "@/components/status-badge";
import {
  resolveStatus,
  hasLiveSession,
  type ClientSummary,
} from "@/lib/clients-shared";
import {
  updateIdentityAction,
  updateBrandProfileAction,
  resetPinAction,
  replaceWpCredentialsAction,
  unlockAccountAction,
  endSessionAction,
  setActiveAction,
  type UpdateResult,
} from "@/app/(panel)/clients/_actions";

// The serializable shape a server component can pass us (no Date objects —
// they come over the wire as strings already).
export interface EditableClient extends ClientSummary {
  system_prompt_config: Record<string, unknown>;
  wp_credentials_present: boolean;
  pin_hash_present: boolean;
}

interface Props {
  client: EditableClient;
}

const initialState: UpdateResult | null = null;

export function EditableClient({ client }: Props) {
  const status = resolveStatus(client);
  const live = hasLiveSession(client);
  const profile = (client.system_prompt_config ?? {}) as Record<string, unknown>;
  const brandColors =
    (profile.brandColors as Record<string, string> | undefined) ?? {
      primary: "#000000",
      secondary: "#000000",
      accent: "#000000",
      background: "#ffffff",
    };

  return (
    <div className="space-y-8">
      {/* Header card with quick status + "kill session" button */}
      <div className="rounded-md border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={status} />
            <SessionBadge live={live} />
            <span className="text-xs text-muted-foreground">
              ID: <code className="text-[10px]">{client.id}</code>
            </span>
          </div>
          {live && (
            <EndSessionButton clientId={client.id} />
          )}
        </div>
      </div>

      {/* ==================== IDENTITY ==================== */}
      <IdentitySection client={client} />

      {/* ==================== BRAND PROFILE ==================== */}
      <BrandProfileSection client={client} profile={profile} brandColors={brandColors} />

      {/* ==================== CREDENTIALS ==================== */}
      <CredentialsSection client={client} />

      {/* ==================== PIN ==================== */}
      <PinSection client={client} />

      {/* ==================== STATUS CONTROLS ==================== */}
      <StatusSection client={client} />

      {/* ==================== DANGER ZONE ==================== */}
      <DangerZone client={client} />
    </div>
  );
}

// ============================================================
// SECTION: IDENTITY
// ============================================================

function IdentitySection({ client }: { client: EditableClient }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    updateIdentityAction,
    initialState
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && editing) {
      setEditing(false);
      router.refresh();
    }
  }, [state, editing, router]);

  if (!editing) {
    return (
      <SectionCard
        title="Identity"
        action={
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Edit
          </button>
        }
      >
        <DL>
          <Row label="Name">{client.name}</Row>
          <Row label="Phone">
            <code className="text-xs">{client.phone_number}</code>
          </Row>
          <Row label="WordPress URL">
            <a
              href={client.wordpress_url}
              target="_blank"
              rel="noreferrer"
              className="break-all text-xs hover:underline"
            >
              {client.wordpress_url}
            </a>
          </Row>
          <Row label="Created">
            {new Date(client.created_at).toLocaleString()}
          </Row>
          <Row label="Updated">
            {new Date(client.updated_at).toLocaleString()}
          </Row>
        </DL>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Identity (editing)">
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={client.id} />
        <Field label="Business name" name="name" error={state?.fieldErrors?.name} required>
          <TextInput name="name" defaultValue={client.name} required />
        </Field>
        <Field
          label="WordPress URL"
          name="wordpressUrl"
          error={state?.fieldErrors?.wordpressUrl}
          required
        >
          <TextInput
            name="wordpressUrl"
            type="url"
            defaultValue={client.wordpress_url}
            required
          />
        </Field>
        <FormActions onCancel={() => setEditing(false)} pending={pending} error={state?.formError} />
      </form>
    </SectionCard>
  );
}

// ============================================================
// SECTION: BRAND PROFILE
// ============================================================

function BrandProfileSection({
  client,
  profile,
  brandColors,
}: {
  client: EditableClient;
  profile: Record<string, unknown>;
  brandColors: Record<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    updateBrandProfileAction,
    initialState
  );
  const [colors, setColors] = useState(brandColors);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && editing) {
      setEditing(false);
      router.refresh();
    }
  }, [state, editing, router]);

  if (!editing) {
    return (
      <SectionCard
        title="Brand profile"
        action={
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Edit
          </button>
        }
      >
        <DL>
          <Row label="Business type">
            {(profile.businessType as string) ?? <Missing />}
          </Row>
          <Row label="Language">
            {(profile.language as string) ?? <Missing />}
          </Row>
          <Row label="Tone">
            {(profile.tone as string) ?? <Missing />}
          </Row>
          <Row label="Brand description" multiline>
            {(profile.brandDescription as string) ?? <Missing />}
          </Row>
          <Row label="What they sell" multiline>
            {(profile.whatTheySell as string) ?? <Missing />}
          </Row>
          <Row label="Target audience" multiline>
            {(profile.targetAudience as string) ?? <Missing />}
          </Row>
          <Row label="Image style" multiline>
            {(profile.imageStyle as string) ?? <Missing />}
          </Row>
          <Row label="Do not" multiline>
            {(profile.doNot as string) ?? <Missing />}
          </Row>
          <Row label="Brand colors">
            <ColorSwatches colors={brandColors} />
          </Row>
        </DL>
      </SectionCard>
    );
  }

  const err = state?.fieldErrors ?? {};
  return (
    <SectionCard title="Brand profile (editing)">
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={client.id} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Business type" name="businessType" error={err.businessType}>
            <TextInput
              name="businessType"
              defaultValue={(profile.businessType as string) ?? ""}
            />
          </Field>
          <Field label="Language" name="language" error={err.language}>
            <TextInput
              name="language"
              defaultValue={(profile.language as string) ?? ""}
            />
          </Field>
        </div>
        <Field label="Tone" name="tone" error={err.tone}>
          <TextInput
            name="tone"
            defaultValue={(profile.tone as string) ?? ""}
          />
        </Field>
        <Field label="Brand description" name="brandDescription" error={err.brandDescription}>
          <TextArea
            name="brandDescription"
            rows={4}
            defaultValue={(profile.brandDescription as string) ?? ""}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="What they sell" name="whatTheySell" error={err.whatTheySell}>
            <TextArea
              name="whatTheySell"
              rows={3}
              defaultValue={(profile.whatTheySell as string) ?? ""}
            />
          </Field>
          <Field label="Target audience" name="targetAudience" error={err.targetAudience}>
            <TextArea
              name="targetAudience"
              rows={3}
              defaultValue={(profile.targetAudience as string) ?? ""}
            />
          </Field>
        </div>
        <Field label="Image style" name="imageStyle" error={err.imageStyle}>
          <TextArea
            name="imageStyle"
            rows={3}
            defaultValue={(profile.imageStyle as string) ?? ""}
          />
        </Field>
        <Field label="Do not" name="doNot" error={err.doNot}>
          <TextArea
            name="doNot"
            rows={3}
            defaultValue={(profile.doNot as string) ?? ""}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(["primary", "secondary", "accent", "background"] as const).map((k) => (
            <Field
              key={k}
              label={k.charAt(0).toUpperCase() + k.slice(1)}
              name={`brandColors.${k}`}
              error={err[`brandColors.${k}`]}
            >
              <ColorInput
                name={`brandColors.${k}`}
                value={colors[k]}
                onChange={(e) => setColors({ ...colors, [k]: e.target.value })}
              />
            </Field>
          ))}
        </div>

        <FormActions onCancel={() => setEditing(false)} pending={pending} error={state?.formError} />
      </form>
    </SectionCard>
  );
}

// ============================================================
// SECTION: CREDENTIALS
// ============================================================

function CredentialsSection({ client }: { client: EditableClient }) {
  const [replacing, setReplacing] = useState(false);
  const [state, action, pending] = useActionState(
    replaceWpCredentialsAction,
    initialState
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && replacing) {
      setReplacing(false);
      router.refresh();
    }
  }, [state, replacing, router]);

  return (
    <SectionCard
      title="WordPress credentials"
      action={
        !replacing ? (
          <button
            type="button"
            onClick={() => setReplacing(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Replace
          </button>
        ) : null
      }
    >
      {!replacing ? (
        <DL>
          <Row label="API key">
            {client.wp_credentials_present ? (
              <CredOk>Encrypted and stored ✓</CredOk>
            ) : (
              <Missing />
            )}
          </Row>
          <Row label="API secret">
            {client.wp_credentials_present ? (
              <CredOk>Encrypted and stored ✓</CredOk>
            ) : (
              <Missing />
            )}
          </Row>
        </DL>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={client.id} />
          <p className="text-xs text-muted-foreground">
            Paste new credentials from the Intelligent Site Connector plugin on
            the client&apos;s WordPress site. The old values will be overwritten.
          </p>
          <Field label="API key" name="wpApiKey" error={state?.fieldErrors?.wpApiKey} required>
            <TextInput name="wpApiKey" type="password" required />
          </Field>
          <Field label="API secret" name="wpApiSecret" error={state?.fieldErrors?.wpApiSecret} required>
            <TextInput name="wpApiSecret" type="password" required />
          </Field>
          <FormActions
            onCancel={() => setReplacing(false)}
            pending={pending}
            error={state?.formError}
            submitLabel="Replace credentials"
          />
        </form>
      )}
    </SectionCard>
  );
}

// ============================================================
// SECTION: PIN
// ============================================================

function PinSection({ client }: { client: EditableClient }) {
  const [resetting, setResetting] = useState(false);
  const [state, action, pending] = useActionState(resetPinAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && resetting) {
      setResetting(false);
      router.refresh();
    }
  }, [state, resetting, router]);

  return (
    <SectionCard
      title="Security PIN"
      action={
        !resetting ? (
          <button
            type="button"
            onClick={() => setResetting(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        ) : null
      }
    >
      {!resetting ? (
        <DL>
          <Row label="PIN">
            {client.pin_hash_present ? (
              <CredOk>Hashed with bcrypt ✓</CredOk>
            ) : (
              <Missing />
            )}
          </Row>
          <Row label="Failed attempts">
            {client.failed_pin_attempts ?? 0}
          </Row>
        </DL>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={client.id} />
          <p className="text-xs text-muted-foreground">
            The new PIN becomes effective immediately. Any current 24-hour
            session remains valid until it expires.
          </p>
          <Field
            label="New PIN (4–6 digits)"
            name="pin"
            error={state?.fieldErrors?.pin}
            required
          >
            <TextInput name="pin" inputMode="numeric" required />
          </Field>
          <FormActions
            onCancel={() => setResetting(false)}
            pending={pending}
            error={state?.formError}
            submitLabel="Reset PIN"
          />
        </form>
      )}
    </SectionCard>
  );
}

// ============================================================
// SECTION: STATUS
// ============================================================

function StatusSection({ client }: { client: EditableClient }) {
  const [unlockState, unlockAction, unlockPending] = useActionState(
    unlockAccountAction,
    initialState
  );
  const locked = client.locked_until && new Date(client.locked_until) > new Date();
  const router = useRouter();

  useEffect(() => {
    if (unlockState?.ok) router.refresh();
  }, [unlockState, router]);

  return (
    <SectionCard title="Account status">
      <DL>
        <Row label="Active">{client.active ? "Yes" : "No"}</Row>
        <Row label="Locked until">
          {client.locked_until ? (
            new Date(client.locked_until).toLocaleString()
          ) : (
            "—"
          )}
        </Row>
        <Row label="Session expires">
          {client.session_expires_at
            ? new Date(client.session_expires_at).toLocaleString()
            : "—"}
        </Row>
      </DL>
      {locked && (
        <form action={unlockAction} className="mt-4">
          <input type="hidden" name="id" value={client.id} />
          <button
            type="submit"
            disabled={unlockPending}
            className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            {unlockPending ? "Unlocking…" : "Unlock account"}
          </button>
        </form>
      )}
    </SectionCard>
  );
}

function EndSessionButton({ clientId }: { clientId: string }) {
  const [state, action, pending] = useActionState(endSessionAction, initialState);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={clientId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted disabled:opacity-50"
      >
        {pending ? "Ending…" : "End session"}
      </button>
    </form>
  );
}

// ============================================================
// SECTION: DANGER ZONE
// ============================================================

function DangerZone({ client }: { client: EditableClient }) {
  const [state, action, pending] = useActionState(setActiveAction, initialState);
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      setConfirming(false);
      router.refresh();
    }
  }, [state, router]);

  const wantActive = !client.active;
  const label = client.active ? "Deactivate client" : "Reactivate client";
  const copy = client.active
    ? "Deactivating stops the WhatsApp agent from recognizing this number. All data is preserved — this is a soft delete you can reverse any time."
    : "Reactivating lets the WhatsApp agent recognize this number again.";

  return (
    <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-5">
      <h2 className="text-sm font-semibold tracking-tight text-destructive">
        {client.active ? "Danger zone" : "Reactivate"}
      </h2>
      <p className="text-xs text-muted-foreground">{copy}</p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex h-9 items-center rounded-md border border-destructive px-4 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          {label}
        </button>
      ) : (
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="id" value={client.id} />
          <input type="hidden" name="active" value={String(wantActive)} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 items-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {pending ? "Saving…" : `Confirm — ${label.toLowerCase()}`}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="inline-flex h-9 items-center rounded-md border px-4 text-sm"
          >
            Cancel
          </button>
        </form>
      )}
      {state?.formError && (
        <p className="text-xs text-destructive">{state.formError}</p>
      )}
    </div>
  );
}

// ============================================================
// SMALL UI HELPERS
// ============================================================

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-md border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function DL({ children }: { children: React.ReactNode }) {
  return <dl className="divide-y divide-border text-sm">{children}</dl>;
}

function Row({
  label,
  children,
  multiline,
}: {
  label: string;
  children: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div
      className={
        multiline
          ? "grid grid-cols-1 gap-1 py-3 md:grid-cols-[180px_1fr]"
          : "grid grid-cols-1 gap-1 py-3 md:grid-cols-[180px_1fr] md:items-center"
      }
    >
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={
          multiline
            ? "whitespace-pre-wrap text-sm leading-relaxed"
            : "text-sm"
        }
      >
        {children}
      </dd>
    </div>
  );
}

function Missing() {
  return <em className="text-muted-foreground">not set</em>;
}

function CredOk({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {children}
    </span>
  );
}

function ColorSwatches({ colors }: { colors: Record<string, string> }) {
  const keys = ["primary", "secondary", "accent", "background"];
  return (
    <div className="flex flex-wrap items-center gap-3">
      {keys.map((k) => {
        const v = colors[k];
        if (!v) return null;
        return (
          <div key={k} className="flex items-center gap-2">
            <span
              className="h-6 w-6 rounded-md border"
              style={{ background: v }}
            />
            <div className="text-xs">
              <div className="font-medium capitalize">{k}</div>
              <code className="text-[10px] text-muted-foreground">{v}</code>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FormActions({
  onCancel,
  pending,
  error,
  submitLabel = "Save changes",
}: {
  onCancel: () => void;
  pending: boolean;
  error?: string;
  submitLabel?: string;
}) {
  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center justify-end gap-2 border-t pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 items-center rounded-md border px-3 text-xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
