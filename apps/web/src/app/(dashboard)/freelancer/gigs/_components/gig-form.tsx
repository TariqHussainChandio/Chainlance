"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cpu, ImagePlus, Monitor, X } from "lucide-react";

import { AzureButton } from "@/components/ui/azure-button";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillInput } from "@/components/ui/skill-input";
import { Textarea } from "@/components/ui/textarea";
import { GigCard } from "@/components/gig-card";
import type { Gig, SerializedUser } from "@/lib/firebase/schema";
import {
  CATEGORIES,
  CATEGORY_SKILLS,
  HARDWARE_CATEGORIES,
  SOFTWARE_CATEGORIES,
  gigSchema,
  type GigInput,
  type GigType,
} from "@/lib/schemas/gig-schema";
import { cn } from "@/lib/utils";

export type GigFormMode = "create" | "edit";
export type GigFormIntent = "draft" | "publish" | "save";

interface GigFormProps {
  mode: GigFormMode;
  user: SerializedUser;
  defaultValues?: Partial<GigInput>;
  initialThumbnailUrl?: string | null;
  onSubmit: (
    values: GigInput,
    file: File | null,
    intent: GigFormIntent
  ) => Promise<void>;
  cancelHref?: string;
}

const blankDefaults: Partial<GigInput> = {
  title: "",
  description: "",
  category: undefined,
  skills: [],
  pricingBasic: undefined,
  pricingStandard: undefined,
  pricingPremium: undefined,
  deliveryDays: undefined,
};

function buildPreviewGig(
  values: Partial<GigInput>,
  user: SerializedUser,
  thumbnailPreview: string | null
): Gig {
  return {
    id: "preview",
    freelancerId: user.uid,
    freelancerName: user.name,
    freelancerAvatar: user.profileImage ?? null,
    freelancerRating: user.rating ?? 0,
    title: values.title?.trim() || "Your gig title",
    description: values.description ?? "",
    category: values.category ?? "Other",
    gigType: values.gigType ?? null,
    pricingBasic: typeof values.pricingBasic === "number"
      ? values.pricingBasic
      : 0,
    pricingStandard: typeof values.pricingStandard === "number"
      ? values.pricingStandard
      : 0,
    pricingPremium: typeof values.pricingPremium === "number"
      ? values.pricingPremium
      : 0,
    deliveryDays: typeof values.deliveryDays === "number"
      ? values.deliveryDays
      : 1,
    status: "draft",
    skills: values.skills ?? [],
    thumbnailUrl: thumbnailPreview,
    // GigCard never reads these — cast satisfies the Gig shape for preview.
    createdAt: null as unknown as Gig["createdAt"],
    updatedAt: null as unknown as Gig["updatedAt"],
  };
}

function numberFieldProps(field: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return {
    value: field.value ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        field.onChange(undefined);
      } else {
        const n = Number(raw);
        field.onChange(Number.isNaN(n) ? undefined : n);
      }
    },
  };
}

const TYPE_OPTIONS: { value: GigType; label: string; sub: string; icon: React.ReactNode }[] = [
  {
    value: "software",
    label: "Software",
    sub: "Web, mobile, AI, design & more",
    icon: <Monitor className="size-5 shrink-0 text-[color:var(--azure-500)]" />,
  },
  {
    value: "hardware",
    label: "Hardware",
    sub: "Electronics, robotics, PCB & more",
    icon: <Cpu className="size-5 shrink-0 text-[color:var(--azure-500)]" />,
  },
];

export function GigForm({
  mode,
  user,
  defaultValues,
  initialThumbnailUrl = null,
  onSubmit,
  cancelHref = "/freelancer/gigs",
}: GigFormProps) {
  const form = useForm<GigInput>({
    resolver: zodResolver(gigSchema),
    defaultValues: { ...blankDefaults, ...defaultValues } as GigInput,
    mode: "onBlur",
  });

  const [file, setFile] = React.useState<File | null>(null);
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = React.useState(false);
  const [submittingIntent, setSubmittingIntent] =
    React.useState<GigFormIntent | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Revoke object URLs on cleanup.
  React.useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      form.setError("root", { message: "Thumbnail must be an image." });
      return;
    }
    if (picked.size > 5 * 1024 * 1024) {
      form.setError("root", { message: "Thumbnail must be 5MB or smaller." });
      return;
    }
    form.clearErrors("root");
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(picked));
    setFile(picked);
    setRemoveExisting(false);
  }

  function clearThumbnail() {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setFile(null);
    setRemoveExisting(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const effectiveThumbnail = localPreview
    ? localPreview
    : removeExisting
      ? null
      : initialThumbnailUrl;

  const watched = form.watch();
  const previewGig = buildPreviewGig(watched, user, effectiveThumbnail);
  const description = form.watch("description") ?? "";
  const gigType = form.watch("gigType");
  const selectedCategory = form.watch("category");
  const currentSkills = form.watch("skills") ?? [];

  const visibleCategories: readonly string[] =
    gigType === "software"
      ? SOFTWARE_CATEGORIES
      : gigType === "hardware"
        ? HARDWARE_CATEGORIES
        : CATEGORIES;

  const suggestedSkills: readonly string[] =
    selectedCategory ? (CATEGORY_SKILLS[selectedCategory] ?? []) : [];

  function selectType(type: GigType) {
    const prev = form.getValues("gigType");
    if (prev === type) return;
    form.setValue("gigType", type, { shouldDirty: true });
    // Reset category and skills when type changes so stale selections don't slip through.
    form.setValue("category", undefined as unknown as (typeof CATEGORIES)[number], { shouldDirty: true });
    form.setValue("skills", [], { shouldDirty: true });
  }

  async function submitWithIntent(intent: GigFormIntent) {
    if (submittingIntent) return;
    const ok = await form.trigger();
    if (!ok) return;
    const values = form.getValues();
    setSubmittingIntent(intent);
    try {
      await onSubmit(values, file, intent);
    } finally {
      setSubmittingIntent(null);
    }
  }

  const isSubmitting = submittingIntent !== null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <Form {...form}>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-6"
          noValidate
        >
          {/* Basics */}
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold">Basics</h2>
            <p className="mt-1 text-xs text-foreground/60">
              Title, category, and skills clients filter by.
            </p>
            <div className="mt-5 space-y-5">
              {/* Gig type */}
              <div>
                <p className="mb-2 text-sm font-medium">Gig type</p>
                <div className="grid grid-cols-2 gap-3">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => selectType(opt.value)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                        gigType === opt.value
                          ? "border-[color:var(--azure-500)] bg-[color:var(--azure-500)]/10"
                          : "border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[color:var(--azure-500)]/40"
                      )}
                    >
                      {opt.icon}
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-foreground/60">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="I will build a Next.js dashboard with Firebase auth"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    {!gigType && (
                      <p className="text-xs text-foreground/50">
                        Select a gig type above to filter categories.
                      </p>
                    )}
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => {
                        field.onChange(v);
                        // Reset skills when category changes.
                        form.setValue("skills", []);
                      }}
                      disabled={!gigType}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {visibleCategories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                        {gigType && (
                          <SelectItem value="Other">Other</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>

                    {/* Suggested skill chips */}
                    {selectedCategory && suggestedSkills.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-foreground/50">
                          Suggested for{" "}
                          <span className="font-medium text-foreground/70">
                            {selectedCategory}
                          </span>
                          {" "}— click to add:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestedSkills.map((skill) => {
                            const added = currentSkills.includes(skill);
                            const full = currentSkills.length >= 10;
                            return (
                              <button
                                key={skill}
                                type="button"
                                disabled={added || full}
                                onClick={() => {
                                  if (!added && !full) {
                                    field.onChange([...currentSkills, skill]);
                                  }
                                }}
                                className={cn(
                                  "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                                  added
                                    ? "border-[color:var(--azure-500)] bg-[color:var(--azure-500)]/15 text-[color:var(--azure-500)] cursor-default"
                                    : full
                                      ? "border-[var(--glass-border)] text-foreground/30 cursor-not-allowed"
                                      : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground/70 hover:border-[color:var(--azure-500)]/50 hover:text-foreground cursor-pointer"
                                )}
                              >
                                {added ? `✓ ${skill}` : `+ ${skill}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!selectedCategory && gigType && (
                      <p className="text-xs text-foreground/50">
                        Select a category to see suggested skills.
                      </p>
                    )}

                    <FormControl>
                      <SkillInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </GlassCard>

          {/* Description */}
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold">Description</h2>
            <p className="mt-1 text-xs text-foreground/60">
              Explain what clients get, your process, and what makes you
              different.
            </p>
            <div className="mt-5">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={8}
                        placeholder="Describe your service in detail. Minimum 50 characters."
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between">
                      <FormMessage />
                      <span className="text-xs text-foreground/50">
                        {description.length}/2000
                      </span>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </GlassCard>

          {/* Pricing & Delivery */}
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold">Pricing &amp; Delivery</h2>
            <p className="mt-1 text-xs text-foreground/60">
              Three tiers and a turnaround. Premium must cost at least as much
              as Standard, which must be at least Basic.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(
                [
                  ["pricingBasic", "Basic"],
                  ["pricingStandard", "Standard"],
                  ["pricingPremium", "Premium"],
                ] as const
              ).map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/60">
                            $
                          </span>
                          <Input
                            type="number"
                            min={5}
                            max={10000}
                            inputMode="decimal"
                            className="pl-7"
                            {...numberFieldProps(field)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <div className="mt-4">
              <FormField
                control={form.control}
                name="deliveryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={90}
                        inputMode="numeric"
                        {...numberFieldProps(field)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </GlassCard>

          {/* Thumbnail */}
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold">Thumbnail</h2>
            <p className="mt-1 text-xs text-foreground/60">
              16:9 image, up to 5MB. Optional but boosts conversion.
            </p>
            <div className="mt-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFilePicked}
                className="sr-only"
                id="gig-thumbnail-input"
              />
              {effectiveThumbnail ? (
                <div className="space-y-3">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--glass-border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={effectiveThumbnail}
                      alt="Thumbnail preview"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace image
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={clearThumbnail}
                    >
                      <X className="size-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="gig-thumbnail-input"
                  className="flex aspect-video w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-[var(--glass-border)] bg-[color:var(--azure-500)]/5 text-sm text-foreground/60 transition-colors hover:bg-[color:var(--azure-500)]/10"
                >
                  <span className="flex flex-col items-center gap-2">
                    <ImagePlus className="size-6" />
                    <span>Click to upload an image</span>
                    <span className="text-xs text-foreground/40">
                      PNG / JPG up to 5MB
                    </span>
                  </span>
                </label>
              )}
              {form.formState.errors.root?.message ? (
                <p className="mt-2 text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              ) : null}
            </div>
          </GlassCard>

          {/* Footer actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="ghost"
              asChild
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <a href={cancelHref}>Cancel</a>
            </Button>
            {mode === "create" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => void submitWithIntent("draft")}
                  className="w-full sm:w-auto"
                >
                  {submittingIntent === "draft"
                    ? "Saving…"
                    : "Save as draft"}
                </Button>
                <AzureButton
                  type="button"
                  size="md"
                  disabled={isSubmitting}
                  onClick={() => void submitWithIntent("publish")}
                  className="w-full sm:w-auto"
                >
                  {submittingIntent === "publish"
                    ? "Publishing…"
                    : "Publish gig"}
                </AzureButton>
              </>
            ) : (
              <AzureButton
                type="button"
                size="md"
                disabled={isSubmitting}
                onClick={() => void submitWithIntent("save")}
                className="w-full sm:w-auto"
              >
                {submittingIntent === "save" ? "Saving…" : "Save changes"}
              </AzureButton>
            )}
          </div>
        </form>
      </Form>

      {/* Live preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="text-xs uppercase tracking-wider text-foreground/50">
          Live preview
        </div>
        <div className="mt-2">
          <GigCard gig={previewGig} variant="marketplace" disableLink />
        </div>
        <p className="mt-3 text-xs text-foreground/50">
          This is how your gig appears on the marketplace.
        </p>
      </div>
    </div>
  );
}
