/**
 * Guides & Resources page (3.3)
 *
 * Guides (profiles shown on trip pages), vehicles, rooms and equipment, and
 * a schedule assigning them to trip dates with double-booking and seat
 * checks. UI shell in the free plugin; the endpoints come from the Yatra Pro
 * "Guides & Resources" module and only exist while it is enabled.
 *
 * @package Yatra
 */

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2, CalendarDays, AlertTriangle, Sparkles, ImageIcon } from "lucide-react";
import { __, sprintf } from "../lib/i18n";
import { apiClient } from "../lib/api-client";
import { formatDate } from "../lib/dateFormat";
import { useToast } from "../components/ui/toast";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Modal } from "../components/ui/modal";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { Card, CardContent } from "../components/ui/card";
import { PageHeader } from "../components/common/PageHeader";
import { isModuleActive } from "../lib/plugin-utils";
import { useWordPressMedia } from "../hooks/useWordPressMedia";

type ResourceType = "guide" | "vehicle" | "room" | "equipment" | "other";

interface Resource {
  id: number;
  type: ResourceType;
  name: string;
  photo_id: number | null;
  photo_url: string;
  bio: string;
  languages: string;
  experience_years: number | null;
  quantity: number;
  capacity: number | null;
  phone: string;
  email: string;
  notes: string;
  show_on_site: boolean;
  status: "active" | "inactive";
}

interface Assignment {
  id: number;
  resource_id: number;
  resource_name: string;
  resource_type: ResourceType;
  capacity: number | null;
  trip_id: number;
  trip_title: string;
  start_date: string;
  end_date: string;
  quantity: number;
  note: string;
  booked_travellers: number;
  conflict: boolean;
  short_of_capacity: boolean;
  assigned_capacity: number | null;
}

const TYPE_LABELS: Record<ResourceType, string> = {
  guide: __("Guide", "yatra"),
  vehicle: __("Vehicle", "yatra"),
  room: __("Room", "yatra"),
  equipment: __("Equipment", "yatra"),
  other: __("Other", "yatra"),
};

const EMPTY: Omit<Resource, "id" | "photo_url"> = {
  type: "guide",
  name: "",
  photo_id: null,
  bio: "",
  languages: "",
  experience_years: null,
  quantity: 1,
  capacity: null,
  phone: "",
  email: "",
  notes: "",
  show_on_site: true,
  status: "active",
};

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (d: string, n: number) => {
  const t = new Date(d + "T12:00:00");
  t.setDate(t.getDate() + n);
  return t.toISOString().slice(0, 10);
};
const errorMessage = (e: any, fallback: string): string =>
  (e && typeof e.message === "string" && e.message) || fallback;

const GuidesResources: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const toast = (type: "success" | "error", message: string) => showToast(message, type);
  const [moduleAvailable, setModuleAvailable] = useState<boolean>(isModuleActive("guides_resources"));
  useEffect(() => {
    const sync = () => setModuleAvailable(isModuleActive("guides_resources"));
    window.addEventListener("yatra-modules-updated", sync);
    return () => window.removeEventListener("yatra-modules-updated", sync);
  }, []);

  const [tab, setTab] = useState<"resources" | "schedule">("resources");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [editing, setEditing] = useState<Resource | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>({ ...EMPTY });
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Resource | null>(null);

  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(plusDays(today(), 60));
  const [assignOpen, setAssignOpen] = useState(false);
  const [assign, setAssign] = useState({ resource_id: "", trip_id: "", start_date: today(), end_date: "", quantity: "1", note: "" });
  const [conflictAsk, setConflictAsk] = useState<string>("");

  const { openMediaLibrary } = useWordPressMedia({ title: __("Choose a photo", "yatra") });

  const resourcesQuery = useQuery({
    queryKey: ["resources"],
    queryFn: async () => await apiClient.get("/resources"),
    enabled: moduleAvailable,
  });
  const resources: Resource[] = (resourcesQuery.data as any)?.data ?? [];
  const shown = useMemo(() => resources.filter((r) => !typeFilter || r.type === typeFilter), [resources, typeFilter]);

  const scheduleQuery = useQuery({
    queryKey: ["resource-assignments", from, to],
    queryFn: async () => await apiClient.get("/resource-assignments", { params: { from, to } }),
    enabled: moduleAvailable && tab === "schedule",
  });
  const schedule: Assignment[] = (scheduleQuery.data as any)?.data ?? [];

  const tripsQuery = useQuery({
    queryKey: ["resources-trips"],
    queryFn: async () => {
      const res: any = await apiClient.get("/trips", { params: { per_page: 100, status: "publish" } });
      const items: any[] = res?.data?.data || res?.data || res || [];
      return Array.isArray(items) ? items : [];
    },
    enabled: moduleAvailable && assignOpen,
  });

  if (!moduleAvailable) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">{__("Guides & Resources", "yatra")}</h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1 max-w-2xl">
              {__(
                "Guide profiles on your trip pages and a schedule for guides, vehicles, rooms and equipment. A Yatra Pro module — switch it on in Yatra → Modules.",
                "yatra",
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, type: (typeFilter as ResourceType) || "guide" });
    setPhotoUrl("");
    setFormOpen(true);
  };
  const openEdit = (r: Resource) => {
    setEditing(r);
    setForm({ ...r });
    setPhotoUrl(r.photo_url);
    setFormOpen(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await apiClient.post(`/resources/${editing.id}`, form);
      } else {
        await apiClient.post("/resources", form);
      }
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast("success", __("Saved.", "yatra"));
    } catch (e) {
      toast("error", errorMessage(e, __("Could not save.", "yatra")));
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!toDelete) return;
    try {
      await apiClient.delete(`/resources/${toDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["resource-assignments"] });
    } catch (e) {
      toast("error", errorMessage(e, __("Could not delete.", "yatra")));
    }
    setToDelete(null);
  };
  const submitAssign = async (force = false) => {
    try {
      await apiClient.post("/resource-assignments", { ...assign, quantity: parseInt(assign.quantity, 10) || 1, force });
      setAssignOpen(false);
      setConflictAsk("");
      queryClient.invalidateQueries({ queryKey: ["resource-assignments"] });
      toast("success", __("Assigned.", "yatra"));
    } catch (e) {
      const msg = errorMessage(e, __("Could not assign.", "yatra"));
      if (!force && /already booked/i.test(msg)) {
        setConflictAsk(msg);
      } else {
        toast("error", msg);
      }
    }
  };
  const unassign = async (a: Assignment) => {
    try {
      await apiClient.delete(`/resource-assignments/${a.id}`);
      queryClient.invalidateQueries({ queryKey: ["resource-assignments"] });
    } catch (e) {
      toast("error", errorMessage(e, __("Could not remove.", "yatra")));
    }
  };
  const selectedResource = resources.find((r) => String(r.id) === assign.resource_id);
  const field = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4" data-testid="guides-resources-page">
      <PageHeader
        description={__(
          "Your guides, vehicles, rooms and equipment, and who or what goes on which trip date.",
          "yatra",
        )}
        actions={
          tab === "resources" ? (
            <Button onClick={openCreate} data-testid="resource-add">
              <Plus className="w-4 h-4 mr-1" />
              {__("Add", "yatra")}
            </Button>
          ) : (
            <Button onClick={() => { setAssign({ resource_id: "", trip_id: "", start_date: today(), end_date: "", quantity: "1", note: "" }); setAssignOpen(true); }} data-testid="assignment-add">
              <Plus className="w-4 h-4 mr-1" />
              {__("Assign", "yatra")}
            </Button>
          )
        }
      />
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {([["resources", __("Guides & resources", "yatra"), Users], ["schedule", __("Schedule", "yatra"), CalendarDays]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm flex items-center gap-1 border-b-2 -mb-px ${tab === key ? "border-blue-600 text-blue-700 dark:text-blue-300" : "border-transparent text-gray-600 dark:text-gray-400"}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "resources" && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="resource-type-filter" className="text-sm">{__("Show", "yatra")}</Label>
              <Select id="resource-type-filter" value={typeFilter} onChange={(e: any) => setTypeFilter(e.target.value)} className="w-48">
                <option value="">{__("All", "yatra")}</option>
                {(Object.keys(TYPE_LABELS) as ResourceType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </Select>
            </div>
            {resourcesQuery.isLoading ? (
              <p className="text-sm text-gray-500">{__("Loading…", "yatra")}</p>
            ) : shown.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="resources-empty">
                {__("Nothing here yet. Add your first guide, vehicle or room.", "yatra")}
              </p>
            ) : (
              <table className="w-full text-sm" data-testid="resources-table">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-2">{__("Name", "yatra")}</th>
                    <th>{__("Type", "yatra")}</th>
                    <th>{__("Details", "yatra")}</th>
                    <th>{__("Status", "yatra")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-2 font-medium text-gray-900 dark:text-white">{r.name}</td>
                      <td>{TYPE_LABELS[r.type]}</td>
                      <td className="text-gray-600 dark:text-gray-400">
                        {r.type === "guide"
                          ? [r.languages, r.experience_years ? sprintf(__("%d years", "yatra"), r.experience_years) : ""].filter(Boolean).join(" · ")
                          : [r.quantity > 1 ? sprintf(__("%d units", "yatra"), r.quantity) : "", r.capacity ? sprintf(__("%d seats/beds each", "yatra"), r.capacity) : ""].filter(Boolean).join(" · ")}
                      </td>
                      <td>
                        <Badge variant={r.status === "active" ? "success" : "outline"}>
                          {r.status === "active" ? __("Active", "yatra") : __("Inactive", "yatra")}
                        </Badge>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" aria-label={__("Edit", "yatra")} onClick={() => openEdit(r)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label={__("Delete", "yatra")} onClick={() => setToDelete(r)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "schedule" && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label htmlFor="schedule-from" className="text-xs">{__("From", "yatra")}</Label>
                <Input id="schedule-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="schedule-to" className="text-xs">{__("To", "yatra")}</Label>
                <Input id="schedule-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            {scheduleQuery.isLoading ? (
              <p className="text-sm text-gray-500">{__("Loading…", "yatra")}</p>
            ) : schedule.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="schedule-empty">
                {__("Nothing assigned in these dates.", "yatra")}
              </p>
            ) : (
              <table className="w-full text-sm" data-testid="schedule-table">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-2">{__("Dates", "yatra")}</th>
                    <th>{__("Trip", "yatra")}</th>
                    <th>{__("Assigned", "yatra")}</th>
                    <th>{__("Travellers", "yatra")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((a) => (
                    <tr key={a.id} className="border-t border-gray-100 dark:border-gray-800" data-testid={`assignment-${a.id}`}>
                      <td className="py-2 whitespace-nowrap">
                        {formatDate(a.start_date)}
                        {a.end_date !== a.start_date ? ` – ${formatDate(a.end_date)}` : ""}
                      </td>
                      <td>{a.trip_title}</td>
                      <td>
                        {a.resource_name}
                        {a.quantity > 1 ? ` × ${a.quantity}` : ""}{" "}
                        <span className="text-gray-500">({TYPE_LABELS[a.resource_type]})</span>
                        {a.conflict && (
                          <span className="ml-2 inline-flex items-center gap-1 text-red-600" data-testid="assignment-conflict">
                            <AlertTriangle className="w-3 h-3" />
                            {__("Double-booked", "yatra")}
                          </span>
                        )}
                      </td>
                      <td>
                        {a.booked_travellers}
                        {a.short_of_capacity && a.assigned_capacity !== null && (
                          <span className="ml-2 inline-flex items-center gap-1 text-amber-700" data-testid="assignment-short">
                            <AlertTriangle className="w-3 h-3" />
                            {sprintf(__("only %d seats/beds", "yatra"), a.assigned_capacity)}
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" aria-label={__("Remove", "yatra")} onClick={() => unassign(a)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? __("Edit", "yatra") : __("Add a guide or resource", "yatra")}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>{__("Cancel", "yatra")}</Button>
            <Button onClick={save} disabled={saving || !String(form.name || "").trim()} data-testid="resource-save">
              {__("Save", "yatra")}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="res-type">{__("Type", "yatra")}</Label>
            <Select id="res-type" value={form.type} onChange={(e: any) => field("type", e.target.value)}>
              {(Object.keys(TYPE_LABELS) as ResourceType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="res-name">{__("Name", "yatra")}</Label>
            <Input id="res-name" value={form.name} maxLength={191} onChange={(e) => field("name", e.target.value)} />
          </div>
          {form.type === "guide" ? (
            <>
              <div>
                <Label htmlFor="res-languages">{__("Languages", "yatra")}</Label>
                <Input id="res-languages" value={form.languages} placeholder={__("English, Nepali", "yatra")} onChange={(e) => field("languages", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="res-years">{__("Years of experience", "yatra")}</Label>
                <Input id="res-years" type="number" min={0} max={80} value={form.experience_years ?? ""} onChange={(e) => field("experience_years", e.target.value === "" ? null : parseInt(e.target.value, 10))} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="res-bio">{__("About (shown on trip pages)", "yatra")}</Label>
                <textarea id="res-bio" rows={3} maxLength={2000} value={form.bio} onChange={(e) => field("bio", e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                {photoUrl ? <img src={photoUrl} alt="" className="w-12 h-12 rounded-full object-cover" /> : <ImageIcon className="w-8 h-8 text-gray-400" />}
                <Button type="button" variant="outline" size="sm" onClick={() => openMediaLibrary((att: any) => { const a = Array.isArray(att) ? att[0] : att; if (a) { field("photo_id", a.id); setPhotoUrl(a.sizes?.thumbnail?.url || a.url); } })}>
                  {__("Choose photo", "yatra")}
                </Button>
                {photoUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { field("photo_id", null); setPhotoUrl(""); }}>
                    {__("Remove photo", "yatra")}
                  </Button>
                )}
              </div>
              <label className="md:col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.show_on_site} onChange={(e) => field("show_on_site", e.target.checked)} />
                {__("Show on trip pages (pick the trips in each trip's editor)", "yatra")}
              </label>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="res-qty">{__("How many you have", "yatra")}</Label>
                <Input id="res-qty" type="number" min={1} value={form.quantity} onChange={(e) => field("quantity", parseInt(e.target.value, 10) || 1)} />
              </div>
              {(form.type === "vehicle" || form.type === "room") && (
                <div>
                  <Label htmlFor="res-capacity">{form.type === "vehicle" ? __("Seats (each)", "yatra") : __("Beds (each)", "yatra")}</Label>
                  <Input id="res-capacity" type="number" min={1} value={form.capacity ?? ""} onChange={(e) => field("capacity", e.target.value === "" ? null : parseInt(e.target.value, 10))} />
                </div>
              )}
            </>
          )}
          <div>
            <Label htmlFor="res-phone">{__("Phone (staff only)", "yatra")}</Label>
            <Input id="res-phone" value={form.phone} onChange={(e) => field("phone", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="res-email">{__("Email (staff only)", "yatra")}</Label>
            <Input id="res-email" type="email" value={form.email} onChange={(e) => field("email", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="res-notes">{__("Internal notes", "yatra")}</Label>
            <textarea id="res-notes" rows={2} value={form.notes} onChange={(e) => field("notes", e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <Label htmlFor="res-status">{__("Status", "yatra")}</Label>
            <Select id="res-status" value={form.status} onChange={(e: any) => field("status", e.target.value)}>
              <option value="active">{__("Active", "yatra")}</option>
              <option value="inactive">{__("Inactive", "yatra")}</option>
            </Select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={assignOpen}
        onClose={() => { setAssignOpen(false); setConflictAsk(""); }}
        title={__("Assign to a trip date", "yatra")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setAssignOpen(false); setConflictAsk(""); }}>{__("Cancel", "yatra")}</Button>
            {conflictAsk ? (
              <Button variant="destructive" onClick={() => submitAssign(true)} data-testid="assignment-force">
                {__("Assign anyway", "yatra")}
              </Button>
            ) : (
              <Button onClick={() => submitAssign(false)} disabled={!assign.resource_id || !assign.trip_id || !assign.start_date} data-testid="assignment-save">
                {__("Assign", "yatra")}
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-3">
          {conflictAsk && (
            <p className="text-sm text-red-700 bg-red-50 dark:bg-red-900/20 rounded-md p-2 flex items-center gap-2" data-testid="assignment-conflict-warning">
              <AlertTriangle className="w-4 h-4" />
              {conflictAsk}
            </p>
          )}
          <div>
            <Label htmlFor="as-resource">{__("Guide or resource", "yatra")}</Label>
            <Select id="as-resource" value={assign.resource_id} onChange={(e: any) => { setConflictAsk(""); setAssign({ ...assign, resource_id: e.target.value }); }}>
              <option value="">{__("Choose…", "yatra")}</option>
              {resources.filter((r) => r.status === "active").map((r) => (
                <option key={r.id} value={String(r.id)}>{`${r.name} (${TYPE_LABELS[r.type]})`}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="as-trip">{__("Trip", "yatra")}</Label>
            <Select id="as-trip" value={assign.trip_id} onChange={(e: any) => { setConflictAsk(""); setAssign({ ...assign, trip_id: e.target.value }); }}>
              <option value="">{__("Choose…", "yatra")}</option>
              {(tripsQuery.data || []).map((t: any) => (
                <option key={t.id} value={String(t.id)}>{t.title}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="as-start">{__("Departure date", "yatra")}</Label>
              <Input id="as-start" type="date" value={assign.start_date} onChange={(e) => { setConflictAsk(""); setAssign({ ...assign, start_date: e.target.value }); }} />
            </div>
            <div>
              <Label htmlFor="as-end">{__("Until (empty = the trip's length)", "yatra")}</Label>
              <Input id="as-end" type="date" value={assign.end_date} onChange={(e) => { setConflictAsk(""); setAssign({ ...assign, end_date: e.target.value }); }} />
            </div>
          </div>
          {selectedResource && selectedResource.quantity > 1 && (
            <div>
              <Label htmlFor="as-qty">{sprintf(__("How many (you have %d)", "yatra"), selectedResource.quantity)}</Label>
              <Input id="as-qty" type="number" min={1} max={selectedResource.quantity} value={assign.quantity} onChange={(e) => setAssign({ ...assign, quantity: e.target.value })} />
            </div>
          )}
          <div>
            <Label htmlFor="as-note">{__("Note", "yatra")}</Label>
            <Input id="as-note" value={assign.note} maxLength={255} onChange={(e) => setAssign({ ...assign, note: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title={__("Delete?", "yatra")}
        message={__("This also removes its assignments.", "yatra")}
        confirmText={__("Delete", "yatra")}
        variant="danger"
      />
    </div>
  );
};

export default GuidesResources;
