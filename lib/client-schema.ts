// Zod validation schema for a client, shared between the Add Client form
// (Step 5) and later the inline-edit forms on the detail page (Step 7).
//
// The shape mirrors onboard-client.ts in the backend exactly. Any field
// added here that the backend doesn't know about will just sit in the
// system_prompt_config JSON blob — harmless.

import { z } from "zod";

export const brandColorsSchema = z.object({
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected hex color"),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected hex color"),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected hex color"),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected hex color"),
});

export const brandProfileSchema = z.object({
  businessType: z.string().min(1, "Required").default("business"),
  language: z.string().min(1, "Required").default("English"),
  tone: z.string().min(1, "Required"),
  brandDescription: z.string().min(10, "At least 10 characters"),
  whatTheySell: z.string().min(5, "At least 5 characters"),
  targetAudience: z.string().min(5, "At least 5 characters"),
  brandColors: brandColorsSchema,
  imageStyle: z.string().min(5, "At least 5 characters"),
  doNot: z.string().min(5, "At least 5 characters"),
});

export const addClientSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  phone: z
    .string()
    .regex(
      /^\d{10,15}$/,
      "International format, digits only (e.g. 212609228322)"
    ),
  pin: z.string().regex(/^\d{4,6}$/, "4–6 digits"),
  wordpressUrl: z.string().url("Must be a valid URL"),
  wpApiKey: z.string().min(10, "API key looks too short"),
  wpApiSecret: z.string().min(10, "API secret looks too short"),
  profile: brandProfileSchema,
});

export type AddClientInput = z.infer<typeof addClientSchema>;
export type BrandProfile = z.infer<typeof brandProfileSchema>;
export type BrandColors = z.infer<typeof brandColorsSchema>;

// Default values for a fresh "Add Client" form. Neutral defaults so the form
// is usable immediately — the user can tweak whatever they need.
export const EMPTY_CLIENT: AddClientInput = {
  name: "",
  phone: "",
  pin: "1234",
  wordpressUrl: "",
  wpApiKey: "",
  wpApiSecret: "",
  profile: {
    businessType: "restaurant",
    language: "English",
    tone: "friendly and warm, like a knowledgeable colleague who works there",
    brandDescription: "",
    whatTheySell: "",
    targetAudience: "",
    brandColors: {
      primary: "#2C4A3B",
      secondary: "#B58E5C",
      accent: "#1A1A1A",
      background: "#F5F1E8",
    },
    imageStyle:
      "Warm, natural lighting. Close-up photography with shallow depth of field. Muted, elegant tones. Modern editorial aesthetic.",
    doNot:
      "Never use aggressive, hype, or salesy language. Never invent prices, hours, or availability. Never make allergen or medical guarantees.",
  },
};
