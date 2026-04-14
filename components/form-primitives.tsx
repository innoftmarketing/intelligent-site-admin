// Shared form input primitives so every field looks the same.
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FieldProps {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children?: ReactNode;
}

export function Field({ label, name, error, hint, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    />
  );
}

export function ColorInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  // Uses the native color picker. We still bind to the name so the form
  // submits the hex value.
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        {...props}
        className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-0.5"
      />
      <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
        {(props.defaultValue ?? props.value ?? "").toString().toUpperCase()}
      </code>
    </div>
  );
}

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-0.5 border-b pb-2">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
