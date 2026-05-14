import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  X,
  Loader2,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Wand2,
  CheckCircle2,
  Edit3,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { aiApi, type AiGenerateResponse } from "../../api/ai-api";
import { apiClient } from "../../lib/api-client";
import { isAiReady } from "../../lib/ai-availability";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { Select } from "../ui/select";
import { parseItineraryText } from "./itineraryParser";
import { detectClarification } from "./clarificationDetector";

/**
 * "Add Trip with AI" wizard — invoked from the Trips list page when the
 * operator wants AI to draft an entire trip end-to-end instead of
 * starting from a blank form.
 *
 * Flow:
 *   1. setup     — operator answers 6-8 seed questions (destination,
 *                  trip type, duration, audience, etc.)
 *   2. generating — runs all content-generation tasks in parallel
 *                  (description, short, highlights, included, excluded,
 *                  cancellation, FAQ, itinerary, SEO meta x2)
 *   3. review    — operator inspects each section, can request a
 *                  per-section regen with extra context
 *   4. creating  — POST /trips → PUT /trips/{id} with the rich content →
 *                  POST /ai/itinerary/{id}/apply with the day rows
 *   5. done      — redirects to the trip edit form
 *
 * Why client-side orchestration? Each generation task is already an
 * authorized REST call; doing it client-side keeps the operator's
 * progress visible (one row per task, can see what's slow / failing)
 * and avoids a long-running server request that would time out behind
 * common WAFs and PHP-FPM timeouts.
 */

interface CreateTripWithAiWizardProps {
  open: boolean;
  onClose: () => void;
}

type Phase = "setup" | "generating" | "review" | "creating" | "done" | "error";

interface SetupData {
  name: string;
  slug: string;
  destinations: string;
  trip_type: "multi_day" | "single_day";
  duration_days: string;
  duration_nights: string;
  /** Difficulty taxonomy ID as a string (so it round-trips through Select). Empty = skip. */
  difficulty_level_id: string;
  /** Human label for the chosen difficulty — passed to the agent as hint context only. */
  difficulty_level_label: string;
  best_season: string;
  audience: string;
  activities: string;
  /** Per-person price for the trip. Empty allowed; the operator can fill it later. */
  price: string;
  /** Optional discounted price; must be < price when set. */
  sale_price: string;
  extra_context: string;
}

const DEFAULT_SETUP: SetupData = {
  name: "",
  slug: "",
  destinations: "",
  trip_type: "multi_day",
  duration_days: "5",
  duration_nights: "4",
  difficulty_level_id: "",
  difficulty_level_label: "",
  best_season: "",
  audience: "",
  activities: "",
  price: "",
  sale_price: "",
  extra_context: "",
};

type SectionId =
  | "description"
  | "short_description"
  | "trip_details"
  | "what_makes_special"
  | "trip_story"
  | "highlights"
  | "included_items"
  | "excluded_items"
  | "cancellation_policy"
  | "faqs"
  | "itinerary"
  | "starting_location"
  | "ending_location"
  | "accommodation_type"
  | "meta_title"
  | "meta_description";

interface SectionSpec {
  id: SectionId;
  label: string;
  task: string;
  /** Decode the LLM text into the shape the trip-write payload expects. */
  decode: (text: string) => unknown;
  /** Render a short preview for the review screen. */
  preview: (value: unknown) => string;
  /** Key in the trip-update payload (PUT /trips/{id}). null = handled separately (e.g. itinerary). */
  payloadKey: string | null;
}

const SECTIONS: SectionSpec[] = [
  {
    id: "description",
    label: "Trip description",
    task: "trip-description",
    decode: (t) => plainTextToHtml(t),
    preview: (v) =>
      typeof v === "string"
        ? v
            .replace(/<\/p>\s*<p>/gi, "\n\n")
            .replace(/<[^>]+>/g, "")
            .trim()
        : "",
    payloadKey: "description",
  },
  {
    id: "short_description",
    label: "Short description",
    task: "trip-short-description",
    decode: (t) => t.trim(),
    preview: (v) => String(v ?? ""),
    payloadKey: "short_description",
  },
  {
    id: "trip_details",
    label: "Trip details (logistics)",
    task: "trip-details",
    decode: (t) => plainTextToHtml(t),
    preview: (v) =>
      typeof v === "string"
        ? v
            .replace(/<\/p>\s*<p>/gi, "\n\n")
            .replace(/<[^>]+>/g, "")
            .trim()
        : "",
    payloadKey: "trip_details",
  },
  {
    id: "what_makes_special",
    label: "What makes this trip special",
    task: "what-makes-special",
    decode: (t) => plainTextToHtml(t),
    preview: (v) =>
      typeof v === "string"
        ? v
            .replace(/<\/p>\s*<p>/gi, "\n\n")
            .replace(/<[^>]+>/g, "")
            .trim()
        : "",
    payloadKey: "what_makes_special",
  },
  {
    id: "trip_story",
    label: "Trip story",
    task: "trip-story",
    decode: (t) => plainTextToHtml(t),
    preview: (v) =>
      typeof v === "string"
        ? v
            .replace(/<\/p>\s*<p>/gi, "\n\n")
            .replace(/<[^>]+>/g, "")
            .trim()
        : "",
    payloadKey: "trip_story",
  },
  {
    id: "starting_location",
    label: "Starting location",
    task: "starting-location",
    decode: (t) => t.trim(),
    preview: (v) => String(v ?? ""),
    payloadKey: "starting_location",
  },
  {
    id: "ending_location",
    label: "Ending location",
    task: "ending-location",
    decode: (t) => t.trim(),
    preview: (v) => String(v ?? ""),
    payloadKey: "ending_location",
  },
  {
    id: "accommodation_type",
    label: "Accommodation tier",
    task: "accommodation-type",
    decode: (t) => t.trim(),
    preview: (v) => String(v ?? ""),
    payloadKey: "accommodation_type",
  },
  {
    id: "highlights",
    label: "Highlights",
    task: "trip-highlights",
    decode: (t) =>
      t
        .split(/\r?\n/)
        .map((l) => l.replace(/^[\s\-\*•·●]+/, "").trim())
        .filter((l) => l !== ""),
    preview: (v) =>
      Array.isArray(v) ? (v as string[]).map((s) => `• ${s}`).join("\n") : "",
    payloadKey: "highlights",
  },
  {
    id: "included_items",
    label: "What's included",
    task: "trip-included-items",
    decode: (t) => decodeAmenityList(t),
    preview: (v) =>
      Array.isArray(v)
        ? (v as Array<{ title: string }>).map((i) => `• ${i.title}`).join("\n")
        : "",
    payloadKey: "included_items",
  },
  {
    id: "excluded_items",
    label: "What's excluded",
    task: "trip-excluded-items",
    decode: (t) => decodeAmenityList(t),
    preview: (v) =>
      Array.isArray(v)
        ? (v as Array<{ title: string }>).map((i) => `• ${i.title}`).join("\n")
        : "",
    payloadKey: "excluded_items",
  },
  {
    id: "cancellation_policy",
    label: "Cancellation policy",
    task: "trip-cancellation-policy",
    decode: (t) => t.trim(),
    preview: (v) => String(v ?? ""),
    payloadKey: "cancellation_policy",
  },
  {
    id: "faqs",
    label: "FAQ",
    task: "trip-faq",
    decode: (t) => decodeFaq(t),
    preview: (v) =>
      Array.isArray(v)
        ? (v as Array<{ question: string; answer: string }>)
            .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
            .join("\n\n")
        : "",
    // Stored as a relationship row on the trip — same key as the
    // backend agent uses, so no mapping is needed.
    payloadKey: "faqs",
  },
  {
    id: "itinerary",
    label: "Day-by-day itinerary",
    task: "trip-itinerary",
    decode: (t) => parseItineraryText(t),
    preview: (v) =>
      Array.isArray(v)
        ? (v as Array<{ day: number; day_title: string; description: string }>)
            .map((d) => `Day ${d.day}: ${d.day_title || ""}\n${d.description}`)
            .join("\n\n")
        : "",
    payloadKey: null,
  },
  {
    id: "meta_title",
    label: "SEO meta title",
    task: "seo-meta-title",
    decode: (t) => t.trim().slice(0, 60),
    preview: (v) => String(v ?? ""),
    payloadKey: "meta_title",
  },
  {
    id: "meta_description",
    label: "SEO meta description",
    task: "seo-meta-description",
    decode: (t) => t.trim().slice(0, 160),
    preview: (v) => String(v ?? ""),
    payloadKey: "meta_description",
  },
];

type SectionStatus = "idle" | "running" | "done" | "failed" | "needs_context";

interface SectionState {
  status: SectionStatus;
  decoded?: unknown;
  preview?: string;
  error?: string;
  clarificationMessage?: string;
  clarificationQuestions?: string[];
  retryContext: string;
}

interface DifficultyOption {
  id: number;
  name: string;
}

const SEASONS = [
  "spring",
  "summer",
  "monsoon",
  "autumn",
  "winter",
  "year-round",
];

export const CreateTripWithAiWizard: React.FC<CreateTripWithAiWizardProps> = ({
  open,
  onClose,
}) => {
  const [phase, setPhase] = useState<Phase>("setup");
  const [setup, setSetup] = useState<SetupData>(DEFAULT_SETUP);
  const [sections, setSections] = useState<Record<SectionId, SectionState>>(
    () => initialSectionState(),
  );
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPhase("setup");
      setSetup(DEFAULT_SETUP);
      setSections(initialSectionState());
      setCreateError(null);
    }
  }, [open]);

  // Auto-derive slug from the trip name. The operator can rename the
  // slug from the trip editor after the wizard finishes — exposing it
  // here just adds noise for the AI flow.
  useEffect(() => {
    setSetup((prev) => ({ ...prev, slug: slugify(prev.name) }));
  }, [setup.name]);

  // ALL hooks must run on every render before any conditional early
  // return — otherwise React's hook-order invariant blows up with the
  // "rendered more hooks" error #310. baseContext was previously after
  // the `if (!open)` short-circuit, which violated this.
  const baseContext = useMemo(
    () => ({
      name: setup.name.trim(),
      destinations: [setup.destinations.trim()],
      categories: [] as string[],
      activities: setup.activities
        ? setup.activities
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      difficulty_level: setup.difficulty_level_label,
      duration_days:
        setup.trip_type === "single_day" ? "1" : setup.duration_days,
      duration_nights:
        setup.trip_type === "single_day" ? "0" : setup.duration_nights,
      best_season: setup.best_season,
      accommodation_type: "",
      transportation_included: "",
      starting_location: "",
      ending_location: "",
      price: setup.price,
      description: "",
      short_description: "",
      included_items: [] as string[],
      excluded_items: [] as string[],
      age_min: "",
      age_max: "",
    }),
    [setup],
  );

  if (!open) return null;

  if (!isAiReady()) {
    return (
      <Modal isOpen={open} onClose={onClose} size="md" hideHeader hideFooter>
        <div className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {__("AI Assistant not configured", "yatra")}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {__(
                  "Add an OpenAI or Anthropic key under Yatra → AI Assistant first.",
                  "yatra",
                )}
              </p>
              <div className="mt-3 flex gap-2">
                <Button asChild>
                  <a href="admin.php?page=yatra&subpage=ai-assistant">
                    {__("Open AI settings", "yatra")}
                  </a>
                </Button>
                <Button variant="outline" onClick={onClose}>
                  {__("Cancel", "yatra")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  const setupValid =
    setup.name.trim() !== "" && setup.destinations.trim() !== "";

  /**
   * Convert a section value as the backend agent returned it into
   * the trip-form payload shape we eventually POST. Mostly identity
   * (the agent already returns decoded shapes); the one exception is
   * `description`, which arrives as plain-text prose but TripForm's
   * RichTextEditor stores HTML, so we wrap it in `<p>` blocks here.
   */
  const coerceAgentSection = (id: SectionId, content: unknown): unknown => {
    if (id === "description" && typeof content === "string") {
      return plainTextToHtml(content);
    }
    return content;
  };

  /**
   * Mirror coerceAgentSection for the on-screen preview. Same lookup
   * the existing SectionSpec.preview functions use, so the review
   * cards render identically regardless of which generation path
   * produced the content.
   */
  const buildPreview = (id: SectionId, decoded: unknown): string => {
    const spec = SECTIONS.find((s) => s.id === id);
    return spec ? spec.preview(decoded) : "";
  };

  /**
   * Generate every section in ONE agent call. The backend's
   * TripCreationAgent runs a tool-driven loop that writes sections
   * with cross-references (description-aware short_description,
   * itinerary-aware FAQ, etc.) — much more coherent than firing N
   * independent single-shot tasks like the old flow did.
   */
  const startGeneration = async () => {
    setPhase("generating");
    setSections(() => {
      const next = initialSectionState();
      for (const s of SECTIONS) {
        next[s.id] = { ...next[s.id], status: "running" };
      }
      return next;
    });

    try {
      const res = await aiApi.wizardCreateTrip({
        name: setup.name,
        destinations: setup.destinations,
        trip_type: setup.trip_type,
        duration_days: setup.duration_days,
        duration_nights: setup.duration_nights,
        difficulty_level: setup.difficulty_level_label,
        best_season: setup.best_season,
        audience: setup.audience,
        activities: setup.activities,
        extra_context: setup.extra_context,
      });

      // Walk SECTIONS so we apply the same coercion + preview to
      // every key the agent could have written. Anything the agent
      // skipped lands in the `missing` array — we mark those rows
      // as failed so the operator sees what needs a manual re-run.
      const agentSections = res.sections || {};
      setSections((prev) => {
        const next = { ...prev };
        for (const s of SECTIONS) {
          const raw = agentSections[s.id];
          if (raw === undefined || raw === null) {
            next[s.id] = {
              ...next[s.id],
              status: "failed",
              error: "Agent didn't write this section",
              retryContext: "",
            };
            continue;
          }
          const decoded = coerceAgentSection(s.id, raw);
          next[s.id] = {
            status: "done",
            decoded,
            preview: buildPreview(s.id, decoded),
            retryContext: "",
          };
        }
        return next;
      });
      setPhase("review");
    } catch (e: any) {
      // Whole-agent failure (API down, missing key, etc.). Mark every
      // section failed with the error message so the operator can see
      // why nothing landed.
      const msg = extractError(e);
      setSections((prev) => {
        const next = { ...prev };
        for (const s of SECTIONS) {
          next[s.id] = {
            ...next[s.id],
            status: "failed",
            error: msg,
            retryContext: "",
          };
        }
        return next;
      });
      setPhase("review");
    }
  };

  /**
   * Re-run ONE section via the agent's regenerate-section endpoint.
   * The agent reads the other already-written sections (passed in
   * the request) so the new content stays consistent with the rest
   * of the wizard's output.
   */
  const runSection = async (id: SectionId, guidance = "") => {
    setSections((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: "running",
        error: undefined,
        clarificationMessage: undefined,
        clarificationQuestions: undefined,
      },
    }));

    // Snapshot every other completed section so the agent has the
    // current state to read against. JSON-serializable shapes only.
    const existing: Record<string, unknown> = {};
    for (const s of SECTIONS) {
      if (s.id === id) continue;
      const st = sections[s.id];
      if (st.status === "done" && st.decoded !== undefined) {
        // For description, strip the <p> wrappers we added so the
        // agent reads plain text — it'll re-wrap on write if needed.
        let value = st.decoded;
        if (s.id === "description" && typeof value === "string") {
          value = value
            .replace(/<\/p>\s*<p>/gi, "\n\n")
            .replace(/<[^>]+>/g, "")
            .trim();
        }
        existing[s.id] = value;
      }
    }

    try {
      const res = await aiApi.wizardRegenSection(
        id,
        {
          name: setup.name,
          destinations: setup.destinations,
          trip_type: setup.trip_type,
          duration_days: setup.duration_days,
          duration_nights: setup.duration_nights,
          difficulty_level: setup.difficulty_level_label,
          best_season: setup.best_season,
          audience: setup.audience,
          activities: setup.activities,
          extra_context: setup.extra_context,
        },
        existing,
        guidance,
      );
      if (res.content === null || res.content === undefined) {
        setSections((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            status: "failed",
            error: "Agent returned no content for this section.",
          },
        }));
        return;
      }
      const decoded = coerceAgentSection(id, res.content);
      setSections((prev) => ({
        ...prev,
        [id]: {
          status: "done",
          decoded,
          preview: buildPreview(id, decoded),
          retryContext: "",
        },
      }));
    } catch (e: any) {
      setSections((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: "failed",
          error: extractError(e),
        },
      }));
    }
  };

  const retrySection = (id: SectionId) => {
    const ctx = sections[id].retryContext.trim();
    if (ctx === "") return;
    // Persist the operator's retry guidance into extra_context so a
    // second retry inherits it (and any subsequent full regen also
    // sees it).
    setSetup((prev) => ({
      ...prev,
      extra_context: [prev.extra_context.trim(), ctx]
        .filter((s) => s !== "")
        .join("\n\n"),
    }));
    void runSection(id, ctx);
  };

  const sectionsDone = Object.values(sections).filter(
    (s) => s.status === "done",
  ).length;
  const sectionsTotal = SECTIONS.length;
  const sectionsFailed = Object.values(sections).filter(
    (s) => s.status === "failed",
  ).length;
  const sectionsNeedContext = Object.values(sections).filter(
    (s) => s.status === "needs_context",
  ).length;

  const createTrip = async () => {
    setPhase("creating");
    setCreateError(null);

    // Build the trip-update payload from the accepted sections.
    const tripUpdate: Record<string, unknown> = {};
    for (const spec of SECTIONS) {
      if (!spec.payloadKey) continue;
      const st = sections[spec.id];
      if (st.status === "done" && st.decoded !== undefined) {
        tripUpdate[spec.payloadKey] = st.decoded;
      }
    }

    try {
      // 1. Create the basic trip record. We use the same shape as the
      //    existing "Add New Trip" flow so the row passes validation.
      const createPayload = {
        title: setup.name.trim(),
        slug: setup.slug.trim() || slugify(setup.name),
        status: "draft",
        trip_type: setup.trip_type,
      };
      const createResp: any = await apiClient.post("/trips", createPayload);
      const tripId = createResp?.data?.id ?? createResp?.id;
      if (!tripId) {
        throw new Error("Trip created but no ID returned.");
      }

      // 2. Patch the rest of the fields (season, duration, pricing,
      //    difficulty, the generated AI content). PUT /trips/{id}
      //    accepts a wide payload so we send the union of
      //    accepted-string fields.
      //
      //    difficulty_level requires a positive integer matching the
      //    taxonomy row ID (TripValidator). The wizard now loads the
      //    real /difficulty-levels list at setup and stores the chosen
      //    row's ID — we send that here. Operator can leave it blank
      //    (empty string) to skip.
      const patchPayload: Record<string, unknown> = {
        ...tripUpdate,
        duration_days:
          setup.trip_type === "single_day" ? 1 : Number(setup.duration_days),
        duration_nights:
          setup.trip_type === "single_day" ? 0 : Number(setup.duration_nights),
      };
      if (setup.best_season) {
        patchPayload.best_season = setup.best_season;
      }
      const difficultyId = parseInt(setup.difficulty_level_id, 10);
      if (Number.isFinite(difficultyId) && difficultyId > 0) {
        patchPayload.difficulty_level = difficultyId;
      }
      const priceNum = parseFloat(setup.price);
      if (Number.isFinite(priceNum) && priceNum >= 0) {
        patchPayload.original_price = priceNum;
      }
      const salePriceNum = parseFloat(setup.sale_price);
      if (
        Number.isFinite(salePriceNum) &&
        salePriceNum > 0 &&
        (!Number.isFinite(priceNum) || salePriceNum < priceNum)
      ) {
        patchPayload.sale_price = salePriceNum;
      }
      await apiClient.put(`/trips/${tripId}`, patchPayload);

      // 3. Apply the itinerary days separately — they live in their
      //    own table and use the existing AI-apply endpoint that knows
      //    how to insert rows + clean up on conflict. The agent's
      //    `set_itinerary` returns activities nested inside each day;
      //    we pass them through to the apply endpoint, which inserts
      //    both day rows AND day_entry rows in one round trip.
      const itinerarySt = sections.itinerary;
      let itineraryWarning = "";
      if (itinerarySt.status === "done" && Array.isArray(itinerarySt.decoded)) {
        const days = (itinerarySt.decoded as Array<{
          day: number;
          day_title: string;
          description: string;
          activities?: Array<{
            title: string;
            description?: string;
            item_type?: string;
            item_name?: string;
            start_time?: string;
            end_time?: string;
            duration?: string;
            location?: string;
          }>;
        }>).map((d) => ({
          day: d.day,
          day_title: d.day_title,
          description: d.description,
          // Preserve activities the trip-creation agent generated so
          // each day's schedule entries persist to the day_entry
          // table alongside the day row. Without this the trip page
          // would render day overviews but no per-block schedule.
          activities: Array.isArray(d.activities) ? d.activities : [],
        }));
        if (days.length > 0) {
          try {
            await aiApi.applyItinerary(tripId, days, true);
          } catch (e) {
            // Don't fail the whole wizard — the operator still gets a
            // valid trip with content; we surface the warning instead
            // of silently dropping it so they know to re-run from the
            // Itinerary page if they want days.
            itineraryWarning = extractError(e);
            // eslint-disable-next-line no-console
            console.warn("Itinerary apply failed:", e);
          }
        }
      } else if (
        itinerarySt.status === "needs_context" ||
        itinerarySt.status === "failed"
      ) {
        itineraryWarning = __(
          "Itinerary section didn't complete — you can build it from the Itinerary page after the wizard finishes.",
          "yatra",
        );
      }
      if (itineraryWarning) {
        // eslint-disable-next-line no-console
        console.warn("Wizard itinerary warning:", itineraryWarning);
      }

      setPhase("done");
      // Hop to the trip's edit page so the operator lands inside the
      // form with their AI-generated content already populated.
      setTimeout(() => {
        const base = (window as any).yatraAdmin?.siteUrl || "";
        window.location.href = `${base}/wp-admin/admin.php?page=yatra&subpage=trips&action=edit&id=${tripId}`;
      }, 900);
    } catch (e: any) {
      setCreateError(extractError(e));
      setPhase("error");
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => {
        if (phase !== "creating") onClose();
      }}
      size="xl"
      hideHeader
      hideFooter
      // The wizard manages its own sticky header / scrolling body /
      // sticky footer layout (max-h-[90vh] + flex-1 overflow-y-auto).
      // Suppress the Modal's default padding + max-h-[70vh] body scroll
      // so the wizard's layout takes over instead of fighting it —
      // without these overrides the modal capped at 70vh and the
      // wizard's own scrolling never engaged, forcing the operator to
      // scroll the OUTER modal instead.
      bodyClassName=""
      bodyScrollClassName=""
    >
      <div className="flex h-[85vh] max-h-[85vh] min-h-[480px] w-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-gradient-to-br from-blue-600 to-blue-700 p-1.5 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {__("Create trip with AI", "yatra")}
              </h2>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {phaseLabel(phase)}
              </div>
            </div>
          </div>
          {phase !== "creating" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded text-gray-400 hover:text-gray-600"
              aria-label={__("Close", "yatra")}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Steps indicator */}
        <div className="border-b border-gray-100 px-6 py-2 dark:border-gray-700">
          <Steps phase={phase} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {phase === "setup" && (
            <SetupStep
              setup={setup}
              onChange={(patch) => setSetup((prev) => ({ ...prev, ...patch }))}
            />
          )}

          {phase === "generating" && (
            <GeneratingStep
              sections={sections}
              done={sectionsDone}
              total={sectionsTotal}
            />
          )}

          {phase === "review" && (
            <ReviewStep
              sections={sections}
              onRetryContextChange={(id, v) =>
                setSections((prev) => ({
                  ...prev,
                  [id]: { ...prev[id], retryContext: v },
                }))
              }
              onRetry={(id) => retrySection(id)}
              onRerun={(id) => void runSection(id)}
            />
          )}

          {phase === "creating" && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {__("Saving your AI-generated trip…", "yatra")}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {__(
                  "Creating the draft, applying content, building itinerary days.",
                  "yatra",
                )}
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-base font-semibold text-gray-900 dark:text-white">
                {__("Trip created.", "yatra")}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {__("Redirecting to the trip editor…", "yatra")}
              </div>
            </div>
          )}

          {phase === "error" && (
            <div className="space-y-3">
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
                <AlertCircle className="mr-1 inline h-4 w-4" />
                {createError || __("Something went wrong.", "yatra")}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {__(
                  "Your generated content is still here — you can retry, or go back to review and edit it.",
                  "yatra",
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {phase === "generating" && (
              <>
                {sectionsDone}/{sectionsTotal} {__("ready", "yatra")}
                {sectionsNeedContext > 0 && (
                  <span className="ml-2 text-amber-600 dark:text-amber-300">
                    {sectionsNeedContext} {__("need more info", "yatra")}
                  </span>
                )}
                {sectionsFailed > 0 && (
                  <span className="ml-2 text-red-500">
                    {sectionsFailed} {__("failed", "yatra")}
                  </span>
                )}
              </>
            )}
            {phase === "review" && (
              <>
                {sectionsDone}/{sectionsTotal} {__("sections accepted", "yatra")}
                {sectionsNeedContext > 0 && (
                  <span className="ml-2 text-amber-600 dark:text-amber-300">
                    {sectionsNeedContext} {__("waiting for input", "yatra")}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            {phase === "setup" && (
              <>
                <Button variant="outline" onClick={onClose}>
                  {__("Cancel", "yatra")}
                </Button>
                <Button onClick={startGeneration} disabled={!setupValid}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {__("Generate with AI", "yatra")}
                </Button>
              </>
            )}
            {phase === "generating" && (
              <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {__("Working…", "yatra")}
              </Button>
            )}
            {phase === "review" && (
              <>
                <Button variant="outline" onClick={() => setPhase("setup")}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {__("Back", "yatra")}
                </Button>
                <Button
                  onClick={createTrip}
                  disabled={sectionsDone === 0}
                  title={
                    sectionsDone === 0
                      ? __(
                          "At least one section needs to succeed before you can create the trip.",
                          "yatra",
                        )
                      : ""
                  }
                >
                  <Check className="mr-2 h-4 w-4" />
                  {__("Create trip", "yatra")}
                </Button>
              </>
            )}
            {phase === "error" && (
              <>
                <Button variant="outline" onClick={() => setPhase("review")}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {__("Back to review", "yatra")}
                </Button>
                <Button onClick={createTrip}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {__("Retry create", "yatra")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

const Steps: React.FC<{ phase: Phase }> = ({ phase }) => {
  const order: Phase[] = ["setup", "generating", "review", "creating"];
  const activeIdx =
    phase === "done"
      ? order.length
      : phase === "error"
        ? order.indexOf("creating")
        : order.indexOf(phase);
  return (
    <ol className="flex items-center gap-1 text-[11px]">
      {order.map((p, i) => {
        const active = i === activeIdx;
        const past = i < activeIdx || phase === "done";
        return (
          <li key={p} className="flex items-center gap-1">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                past
                  ? "bg-green-500 text-white"
                  : active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {past ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span
              className={`${
                active
                  ? "font-medium text-blue-700 dark:text-blue-300"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {p === "setup"
                ? __("Setup", "yatra")
                : p === "generating"
                  ? __("Generate", "yatra")
                  : p === "review"
                    ? __("Review", "yatra")
                    : __("Save", "yatra")}
            </span>
            {i < order.length - 1 && (
              <ChevronRight className="h-3 w-3 text-gray-300 dark:text-gray-600" />
            )}
          </li>
        );
      })}
    </ol>
  );
};

const SetupStep: React.FC<{
  setup: SetupData;
  onChange: (patch: Partial<SetupData>) => void;
}> = ({ setup, onChange }) => {
  // Load real difficulty taxonomy rows so the wizard sends the ID
  // the trip validator expects, rather than a freeform label that
  // gets dropped on PUT.
  const { data: difficultyData } = useQuery<DifficultyOption[]>({
    queryKey: ["wizard-difficulty-levels"],
    queryFn: async () => {
      try {
        const resp: any = await apiClient.get("/difficulty-levels", {
          params: { per_page: 100 },
        });
        const list = Array.isArray(resp?.data) ? resp.data : [];
        return list
          .filter((d: any) => d && d.id && d.name)
          .map((d: any) => ({ id: Number(d.id), name: String(d.name) }));
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
  const difficulties = difficultyData || [];

  const currency = (window as any)?.yatraAdmin?.currency || "USD";

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600 dark:text-gray-300">
        {__(
          "Tell AI about the trip — the more specific, the better the draft. You'll edit everything afterwards.",
          "yatra",
        )}
      </p>

      {/* Row 1: name (full width) — slug auto-derives silently */}
      <Field label={__("Trip name", "yatra")} required>
        <Input
          value={setup.name}
          placeholder={__("e.g. 7-Day Dhaka Cultural Tour", "yatra")}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </Field>

      {/* Row 2: destinations | trip type | days | nights */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <Field label={__("Destination(s)", "yatra")} required>
            <Input
              value={setup.destinations}
              placeholder={__("e.g. Dhaka, Bangladesh", "yatra")}
              onChange={(e) => onChange({ destinations: e.target.value })}
            />
          </Field>
        </div>
        <Field label={__("Type", "yatra")}>
          <Select
            value={setup.trip_type}
            onChange={(e) =>
              onChange({
                trip_type: e.target.value as SetupData["trip_type"],
              })
            }
          >
            <option value="multi_day">{__("Multi-day", "yatra")}</option>
            <option value="single_day">{__("Single day", "yatra")}</option>
          </Select>
        </Field>
        {setup.trip_type === "multi_day" ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label={__("Days", "yatra")}>
              <Input
                type="number"
                min={1}
                max={60}
                value={setup.duration_days}
                onChange={(e) => onChange({ duration_days: e.target.value })}
              />
            </Field>
            <Field label={__("Nights", "yatra")}>
              <Input
                type="number"
                min={0}
                max={60}
                value={setup.duration_nights}
                onChange={(e) => onChange({ duration_nights: e.target.value })}
              />
            </Field>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Row 3: difficulty | season | audience */}
      <div className="grid gap-3 md:grid-cols-3">
        <Field label={__("Difficulty", "yatra")}>
          <Select
            value={setup.difficulty_level_id}
            onChange={(e) => {
              const id = e.target.value;
              const match = difficulties.find((d) => String(d.id) === id);
              onChange({
                difficulty_level_id: id,
                difficulty_level_label: match ? match.name : "",
              });
            }}
            disabled={difficulties.length === 0}
          >
            <option value="">
              {difficulties.length === 0
                ? __("(no difficulty levels configured)", "yatra")
                : __("(skip — operator picks later)", "yatra")}
            </option>
            {difficulties.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={__("Best season", "yatra")}>
          <Select
            value={setup.best_season}
            onChange={(e) => onChange({ best_season: e.target.value })}
          >
            <option value="">{__("(any)", "yatra")}</option>
            {SEASONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={__("Audience", "yatra")}>
          <Input
            value={setup.audience}
            placeholder={__("couples, families, solo…", "yatra")}
            onChange={(e) => onChange({ audience: e.target.value })}
          />
        </Field>
      </div>

      {/* Row 3b: price | sale price — the agent doesn't invent prices,
          so the operator provides them up front. Trip saves with $0
          if both are left blank. */}
      <div className="grid gap-3 md:grid-cols-3">
        <Field
          label={__("Price per person", "yatra")}
          hint={`(${currency})`}
        >
          <Input
            type="number"
            min={0}
            step="0.01"
            value={setup.price}
            placeholder={__("e.g. 1499", "yatra")}
            onChange={(e) => onChange({ price: e.target.value })}
          />
        </Field>
        <Field
          label={__("Sale price (optional)", "yatra")}
          hint={`(${currency})`}
        >
          <Input
            type="number"
            min={0}
            step="0.01"
            value={setup.sale_price}
            placeholder={__("e.g. 1299", "yatra")}
            onChange={(e) => onChange({ sale_price: e.target.value })}
          />
        </Field>
        <div />
      </div>

      {/* Row 4: key activities (full width but compact) */}
      <Field
        label={__("Key activities", "yatra")}
        hint={__("(comma-separated)", "yatra")}
      >
        <Input
          value={setup.activities}
          placeholder={__(
            "food tours, rickshaw rides, mosque visits, river cruise",
            "yatra",
          )}
          onChange={(e) => onChange({ activities: e.target.value })}
        />
      </Field>

      {/* Row 5: extra context (textarea, 2 rows max) */}
      <Field
        label={__("Anything else AI should know", "yatra")}
        hint={__("(optional but recommended)", "yatra")}
      >
        <textarea
          rows={2}
          className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800"
          value={setup.extra_context}
          placeholder={__(
            "Mid-range hotels, halal-friendly meals, max group size 10…",
            "yatra",
          )}
          onChange={(e) => onChange({ extra_context: e.target.value })}
        />
      </Field>
    </div>
  );
};

const GeneratingStep: React.FC<{
  sections: Record<SectionId, SectionState>;
  done: number;
  total: number;
}> = ({ sections, done, total }) => {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="space-y-3">
      <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-blue-900 dark:text-blue-200">
            {__("AI is drafting your trip…", "yatra")}
          </span>
          <span className="text-blue-700 dark:text-blue-300">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900/40">
          <div
            className="h-full bg-blue-600 transition-all dark:bg-blue-400"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="space-y-1">
        {SECTIONS.map((s) => (
          <SectionStatusRow key={s.id} spec={s} state={sections[s.id]} />
        ))}
      </div>
    </div>
  );
};

const ReviewStep: React.FC<{
  sections: Record<SectionId, SectionState>;
  onRetryContextChange: (id: SectionId, v: string) => void;
  onRetry: (id: SectionId) => void;
  onRerun: (id: SectionId) => void;
}> = ({ sections, onRetryContextChange, onRetry, onRerun }) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {__(
          "Review each section below. You can re-run any individual section, or fill in details for sections AI needs more info on.",
          "yatra",
        )}
      </p>
      {SECTIONS.map((spec) => (
        <ReviewRow
          key={spec.id}
          spec={spec}
          state={sections[spec.id]}
          onRetryContextChange={(v) => onRetryContextChange(spec.id, v)}
          onRetry={() => onRetry(spec.id)}
          onRerun={() => onRerun(spec.id)}
        />
      ))}
    </div>
  );
};

const SectionStatusRow: React.FC<{
  spec: SectionSpec;
  state: SectionState;
}> = ({ spec, state }) => {
  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-100 px-3 py-1.5 text-xs dark:border-gray-800">
      {state.status === "idle" && <span className="text-gray-400">○</span>}
      {state.status === "running" && (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
      )}
      {state.status === "done" && (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      )}
      {state.status === "failed" && (
        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
      )}
      {state.status === "needs_context" && (
        <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
      )}
      <span className="text-gray-700 dark:text-gray-200">{spec.label}</span>
    </div>
  );
};

const ReviewRow: React.FC<{
  spec: SectionSpec;
  state: SectionState;
  onRetryContextChange: (v: string) => void;
  onRetry: () => void;
  onRerun: () => void;
}> = ({ spec, state, onRetryContextChange, onRetry, onRerun }) => {
  // Default OPEN so the operator immediately sees the AI-generated
  // content — having to click into every section was hiding the
  // itinerary in particular.
  const [open, setOpen] = useState(true);
  const sectionSummary = summarize(spec.id, state);
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/60"
      >
        <div className="flex items-center gap-2">
          {state.status === "done" && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {state.status === "failed" && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          {state.status === "needs_context" && (
            <HelpCircle className="h-4 w-4 text-amber-500" />
          )}
          {state.status === "running" && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          )}
          <span className="font-medium text-gray-900 dark:text-white">
            {spec.label}
          </span>
          {sectionSummary && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              · {sectionSummary}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRerun();
            }}
            className="rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            title={__("Re-run this section", "yatra")}
          >
            <RefreshCw className="inline h-3 w-3" />
          </button>
          <ChevronRight
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-2 border-t border-gray-200 p-3 dark:border-gray-700">
          {state.status === "done" && state.preview && (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
              {state.preview}
            </pre>
          )}
          {state.status === "failed" && (
            <div className="rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <AlertCircle className="mr-1 inline h-3 w-3" />
              {state.error}
            </div>
          )}
          {state.status === "needs_context" && (
            <div className="space-y-2">
              <div className="rounded-md border border-amber-200 bg-amber-50/60 p-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200">
                {state.clarificationMessage && (
                  <div className="mb-1">{state.clarificationMessage}</div>
                )}
                {state.clarificationQuestions &&
                  state.clarificationQuestions.length > 0 && (
                    <ul className="list-disc space-y-0.5 pl-4">
                      {state.clarificationQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  )}
              </div>
              <textarea
                rows={3}
                className="w-full rounded-md border border-amber-200 bg-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-amber-500/40 dark:bg-gray-800"
                placeholder={__(
                  "Type the answers — these get added to the prompt and only this section regenerates.",
                  "yatra",
                )}
                value={state.retryContext}
                onChange={(e) => onRetryContextChange(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={onRetry}
                  disabled={state.retryContext.trim() === ""}
                >
                  <Wand2 className="mr-2 h-3 w-3" />
                  {__("Try again with this", "yatra")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, required, children }) => (
  <div>
    <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200">
      {label}
      {required && <span className="text-red-500">*</span>}
      {hint && (
        <span className="ml-1 text-[10px] font-normal text-gray-400">
          {hint}
        </span>
      )}
    </label>
    {children}
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Short human-readable summary shown next to each section title in the
 * review step. Helps the operator spot at-a-glance whether a section
 * landed — "5 days drafted", "153-char description", etc. — without
 * having to expand every card.
 */
function summarize(id: SectionId, state: SectionState): string {
  if (state.status !== "done") return "";
  const d = state.decoded;
  if (id === "itinerary" && Array.isArray(d)) {
    return `${d.length} ${d.length === 1 ? "day" : "days"} drafted`;
  }
  if (id === "highlights" && Array.isArray(d)) {
    return `${d.length} ${d.length === 1 ? "highlight" : "highlights"}`;
  }
  if ((id === "included_items" || id === "excluded_items") && Array.isArray(d)) {
    return `${d.length} ${d.length === 1 ? "item" : "items"}`;
  }
  if (id === "faqs" && Array.isArray(d)) {
    return `${d.length} Q&A`;
  }
  if (typeof d === "string") {
    const len = d.replace(/<[^>]+>/g, "").length;
    return `${len} ${len === 1 ? "char" : "chars"}`;
  }
  return "";
}

function initialSectionState(): Record<SectionId, SectionState> {
  const out = {} as Record<SectionId, SectionState>;
  for (const s of SECTIONS) {
    out[s.id] = { status: "idle", retryContext: "" };
  }
  return out;
}

function phaseLabel(phase: Phase): string {
  switch (phase) {
    case "setup":
      return __("Step 1 of 4 — tell AI about the trip", "yatra");
    case "generating":
      return __("Step 2 of 4 — drafting", "yatra");
    case "review":
      return __("Step 3 of 4 — review", "yatra");
    case "creating":
      return __("Step 4 of 4 — saving", "yatra");
    case "done":
      return __("Done", "yatra");
    case "error":
      return __("Error", "yatra");
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function plainTextToHtml(text: string): string {
  if (!text) return "";
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p !== "");
  return paragraphs
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function decodeAmenityList(text: string): Array<{ title: string; description: string }> {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s\-\*••]+/, "").trim())
    .filter((line) => line !== "" && !/^Day\s+\d+/i.test(line))
    .map((title) => ({ title, description: "" }));
}

function decodeFaq(text: string): Array<{ question: string; answer: string }> {
  const out: Array<{ question: string; answer: string }> = [];
  const blocks = text.replace(/\r\n?/g, "\n").split(/\n{2,}/);
  for (const block of blocks) {
    const qMatch = block.match(/^\s*Q[:\.\-]\s*(.+)/im);
    const aMatch = block.match(/A[:\.\-]\s*([\s\S]+)/im);
    if (qMatch) {
      out.push({
        question: qMatch[1].trim(),
        answer: aMatch ? aMatch[1].trim() : "",
      });
    }
  }
  return out;
}

function extractError(e: any): string {
  if (!e) return "Request failed.";
  const data = e?.response?.data ?? e?.data ?? null;
  if (
    data &&
    typeof data === "object" &&
    typeof (data as any).message === "string"
  ) {
    return (data as any).message;
  }
  return e?.message || "Request failed.";
}

export default CreateTripWithAiWizard;
