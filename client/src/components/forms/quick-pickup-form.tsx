import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { addDays, nextSaturday, setHours, setMinutes, format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCustomerCostEstimate, PricingCategory, WasteType, Collection } from "@shared/schema";
import { wasteTypeConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2, MapPin, LocateFixed, PenLine, ChevronDown, ChevronUp, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  wasteType: z.string().min(1, "Pick a waste type"),
  wasteAmount: z.coerce.number().min(1, "Min 1 kg"),
  address: z.string().min(3, "Enter your address"),
  scheduledDate: z.date({ required_error: "Pick a date" }),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const WASTE_TILES = [
  { type: "plastic",    emoji: "♻️",  label: "Plastic" },
  { type: "paper",      emoji: "📄",  label: "Paper" },
  { type: "metal",      emoji: "🔩",  label: "Metal" },
  { type: "electronic", emoji: "💻",  label: "E-Waste" },
  { type: "glass",      emoji: "🫙",  label: "Glass" },
  { type: "cardboard",  emoji: "📦",  label: "Cardboard" },
  { type: "organic",    emoji: "🌿",  label: "Organic" },
  { type: "general",    emoji: "🗑️",  label: "General" },
  { type: "hazardous",  emoji: "⚠️",  label: "Hazardous" },
];

const TIME_SLOTS = [
  { label: "Morning",   sub: "7–9 AM",   hour: 7  },
  { label: "Midday",    sub: "12–2 PM",  hour: 12 },
  { label: "Afternoon", sub: "2–5 PM",   hour: 14 },
  { label: "Evening",   sub: "5–7 PM",   hour: 17 },
];

const AMOUNT_CHIPS = [5, 10, 20, 50];

function buildQuickDates() {
  const now = new Date();
  const todayBase = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sat = nextSaturday(todayBase);
  return [
    { label: "Today",       date: todayBase },
    { label: "Tomorrow",    date: addDays(todayBase, 1) },
    { label: "In 2 days",   date: addDays(todayBase, 2) },
    { label: "Weekend",     date: sat },
    { label: "Next week",   date: addDays(todayBase, 7) },
  ];
}

function applyHour(base: Date, hour: number): Date {
  return setMinutes(setHours(new Date(base), hour), 0);
}

interface Props {
  collectionToEdit?: Collection | null;
  onSuccess?: () => void;
}

export default function QuickPickupForm({ collectionToEdit, onSuccess }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const quickDates = buildQuickDates();
  const defaultDate = collectionToEdit
    ? new Date(collectionToEdit.scheduledDate)
    : addDays(new Date(), 1);

  const [selectedDateBase, setSelectedDateBase] = useState<Date>(
    (() => {
      const d = new Date(defaultDate);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    })()
  );
  const [selectedHour, setSelectedHour] = useState<number>(
    collectionToEdit ? new Date(collectionToEdit.scheduledDate).getHours() : 7
  );
  const [customAmount, setCustomAmount] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [customDateStr, setCustomDateStr] = useState("");
  const [addressMode, setAddressMode] = useState<"auto" | "manual">(
    collectionToEdit?.address ? "manual" : "manual"
  );
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoDetected, setGeoDetected] = useState("");

  const computedDate = applyHour(selectedDateBase, selectedHour);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      wasteType: collectionToEdit?.wasteType ?? "",
      wasteAmount: collectionToEdit?.wasteAmount ?? 10,
      address: collectionToEdit?.address ?? user?.address ?? "",
      scheduledDate: computedDate,
      notes: collectionToEdit?.notes ?? "",
    },
  });

  const wasteType = form.watch("wasteType");
  const wasteAmount = form.watch("wasteAmount");

  const pricing = wasteType && wasteAmount
    ? getCustomerCostEstimate(wasteType, wasteAmount)
    : null;

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        wasteType: values.wasteType,
        wasteAmount: values.wasteAmount,
        address: values.address,
        scheduledDate: values.scheduledDate.toISOString(),
        notes: values.notes || "",
        status: "pending",
      };
      if (collectionToEdit) {
        const res = await apiRequest("PATCH", `/api/collections/${collectionToEdit.id}`, payload);
        return res.json();
      }
      const res = await apiRequest("POST", "/api/collections", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: collectionToEdit ? "Pickup updated!" : "Pickup scheduled!",
        description: `Your ${form.getValues("wasteType")} collection is confirmed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/upcoming"] });
      if (!collectionToEdit) {
        form.reset({
          wasteType: "",
          wasteAmount: 10,
          address: user?.address ?? "",
          scheduledDate: addDays(new Date(), 1),
          notes: "",
        });
        setSelectedDateBase(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1));
        setSelectedHour(7);
        setCustomAmount(false);
        setShowNotes(false);
      }
      onSuccess?.();
    },
    onError: (err: any) => {
      toast({ title: "Failed to schedule", description: err.message, variant: "destructive" });
    },
  });

  async function detectLocation(setFieldValue: (v: string) => void) {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Your browser doesn't support location detection.", variant: "destructive" });
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = [
            data.address?.suburb || data.address?.neighbourhood || data.address?.village,
            data.address?.city || data.address?.town || data.address?.county,
            data.address?.country,
          ].filter(Boolean).join(", ");
          const result = addr || data.display_name?.split(",").slice(0, 3).join(",").trim() || "";
          setGeoDetected(result);
          setFieldValue(result);
          form.setValue("address", result, { shouldValidate: true });
        } catch {
          toast({ title: "Couldn't read location", description: "Location detected but address lookup failed. Please enter manually.", variant: "destructive" });
          setAddressMode("manual");
        } finally {
          setGeoLocating(false);
        }
      },
      (err) => {
        setGeoLocating(false);
        toast({
          title: "Location access denied",
          description: "Allow location access in your browser, or enter your address manually.",
          variant: "destructive",
        });
        setAddressMode("manual");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function onSubmit(values: FormValues) {
    mutation.mutate({ ...values, scheduledDate: computedDate });
  }

  function selectDate(base: Date) {
    setSelectedDateBase(base);
    form.setValue("scheduledDate", applyHour(base, selectedHour), { shouldValidate: true });
  }

  function selectHour(hour: number) {
    setSelectedHour(hour);
    form.setValue("scheduledDate", applyHour(selectedDateBase, hour), { shouldValidate: true });
  }

  function isQuickDateActive(d: Date) {
    return d.toDateString() === selectedDateBase.toDateString();
  }

  const activeTimeSlot = TIME_SLOTS.find(s => s.hour === selectedHour);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Waste type */}
        <div>
          <p className="text-sm font-semibold mb-2.5">What are you recycling?</p>
          <FormField
            control={form.control}
            name="wasteType"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-3 gap-2">
                  {WASTE_TILES.map(({ type, emoji, label }) => {
                    const active = field.value === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => field.onChange(type)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl border-2 py-3 px-2 text-center transition-all",
                          active
                            ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                            : "border-border hover:border-green-300 hover:bg-muted/50"
                        )}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className={cn("text-xs font-medium leading-tight", active ? "text-green-700 dark:text-green-300" : "text-foreground/80")}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Amount */}
        <div>
          <p className="text-sm font-semibold mb-2.5">Estimated amount</p>
          <FormField
            control={form.control}
            name="wasteAmount"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-wrap gap-2">
                  {AMOUNT_CHIPS.map((kg) => {
                    const active = !customAmount && field.value === kg;
                    return (
                      <button
                        key={kg}
                        type="button"
                        onClick={() => { setCustomAmount(false); field.onChange(kg); }}
                        className={cn(
                          "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all",
                          active
                            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "border-border hover:border-green-300"
                        )}
                      >
                        {kg} kg
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setCustomAmount(true)}
                    className={cn(
                      "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all",
                      customAmount
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "border-border hover:border-green-300"
                    )}
                  >
                    Custom
                  </button>
                </div>
                {customAmount && (
                  <div className="mt-2 flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 35"
                        className="w-32"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        autoFocus
                      />
                    </FormControl>
                    <span className="text-sm text-muted-foreground">kg</span>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date */}
        <div>
          <p className="text-sm font-semibold mb-2.5">When?</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {quickDates.map(({ label, date }) => (
              <button
                key={label}
                type="button"
                onClick={() => selectDate(date)}
                className={cn(
                  "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all",
                  isQuickDateActive(date)
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "border-border hover:border-green-300"
                )}
              >
                {label}
              </button>
            ))}
            <input
              type="date"
              value={customDateStr}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => {
                setCustomDateStr(e.target.value);
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  selectDate(new Date(y, m - 1, d));
                }
              }}
              className={cn(
                "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all bg-background cursor-pointer",
                !quickDates.some(qd => isQuickDateActive(qd.date)) && customDateStr
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "border-border hover:border-green-300 text-muted-foreground"
              )}
            />
          </div>

          {/* Time slots */}
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map(({ label, sub, hour }) => {
              const active = selectedHour === hour;
              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => selectHour(hour)}
                  className={cn(
                    "flex flex-col items-center rounded-xl border-2 py-2.5 px-1 text-center transition-all",
                    active
                      ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                      : "border-border hover:border-green-300 hover:bg-muted/50"
                  )}
                >
                  <span className={cn("text-xs font-semibold", active ? "text-green-700 dark:text-green-300" : "")}>{label}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{sub}</span>
                </button>
              );
            })}
          </div>
          <FormField control={form.control} name="scheduledDate" render={() => (
            <FormItem><FormMessage className="mt-1" /></FormItem>
          )} />
        </div>

        {/* Address */}
        <div>
          <p className="text-sm font-semibold mb-2.5">Pickup address</p>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setAddressMode("auto")}
              className={cn(
                "flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all",
                addressMode === "auto"
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "border-border hover:border-green-300"
              )}
            >
              <LocateFixed className="h-3.5 w-3.5" />
              Auto-detect
            </button>
            <button
              type="button"
              onClick={() => setAddressMode("manual")}
              className={cn(
                "flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all",
                addressMode === "manual"
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "border-border hover:border-green-300"
              )}
            >
              <PenLine className="h-3.5 w-3.5" />
              Enter manually
            </button>
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                {addressMode === "auto" ? (
                  <div>
                    {geoDetected ? (
                      <div className="flex items-start gap-2 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-green-800 dark:text-green-300 break-words">{geoDetected}</p>
                          <button
                            type="button"
                            onClick={() => { setGeoDetected(""); field.onChange(""); }}
                            className="text-xs text-muted-foreground underline mt-0.5"
                          >
                            Detect again
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => detectLocation(field.onChange)}
                        disabled={geoLocating}
                        className="w-full gap-2 border-dashed h-12"
                      >
                        {geoLocating
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <LocateFixed className="h-4 w-4 text-primary" />}
                        {geoLocating ? "Detecting your location…" : "Tap to detect my location"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. Westlands, Nairobi"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Optional notes */}
        <div>
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showNotes ? "Hide" : "Add"} special instructions (gate code, access info…)
          </button>
          {showNotes && (
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="mt-2">
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Gate code is 1234, bags are by the blue door"
                      className="text-sm resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Summary + submit */}
        <div className={cn(
          "rounded-xl p-4 border",
          pricing?.category === PricingCategory.HIGH_VALUE
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
            : pricing?.category === PricingCategory.DISPOSAL_FEE || pricing?.category === PricingCategory.HIGH_COST
            ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
            : "bg-muted/50 border-border"
        )}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              {wasteType && (
                <p className="text-sm font-medium leading-snug">
                  {WASTE_TILES.find(t => t.type === wasteType)?.emoji}{" "}
                  <span className="capitalize">{wasteType}</span>
                  {wasteAmount > 0 && <span className="text-muted-foreground"> · ~{wasteAmount} kg</span>}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(computedDate, "EEE d MMM")} · {activeTimeSlot?.label} ({activeTimeSlot?.sub})
              </p>
              {pricing && (
                <p className={cn(
                  "text-sm font-semibold mt-1",
                  pricing.category === PricingCategory.HIGH_VALUE ? "text-emerald-600" : "text-orange-600"
                )}>
                  {pricing.category === PricingCategory.HIGH_VALUE
                    ? `+KSh ${Math.abs(pricing.total).toLocaleString()} cashback`
                    : pricing.total === 0
                    ? "Free collection"
                    : `KSh ${pricing.total.toLocaleString()} fee`}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="shrink-0 bg-green-600 hover:bg-green-700 gap-2 px-6"
            >
              {mutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Zap className="h-4 w-4" />}
              {mutation.isPending
                ? "Booking…"
                : collectionToEdit ? "Update" : "Book now"}
            </Button>
          </div>
        </div>

      </form>
    </Form>
  );
}
