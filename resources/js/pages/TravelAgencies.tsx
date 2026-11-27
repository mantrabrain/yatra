/**
 * Travel Agencies page
 *
 * Agencies (contact + billing details, agency code, pay-by-invoice terms),
 * monthly statements (PDF, email, record one payment across the month's
 * bookings) and who receives which email for an agency booking.
 *
 * UI shell in the free plugin; every endpoint is registered by the Yatra Pro
 * "Travel Agencies" module and only exists while that module is enabled.
 *
 * @package Yatra
 */

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Plus,
  KeyRound,
  FileText,
  Mail,
  Banknote,
  Download,
  Archive,
  Pencil,
  Copy,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { __, sprintf } from "../lib/i18n";
import { apiClient } from "../lib/api-client";
import { formatDate } from "../lib/dateFormat";
import { formatYatraMoney } from "../lib/currency-display";
import { usePermissions } from "../hooks/usePermissions";
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

interface AgencyUser {
  id: number;
  login: string;
  email: string;
  name: string;
}

interface Agency {
  id: number;
  name: string;
  contact_name: string;
  email: string;
  billing_email: string;
  phone: string;
  billing_address: string;
  vat_number: string;
  payment_terms: "invoice" | "standard";
  has_code: boolean;
  code_hint: string;
  user_ids: number[];
  users?: AgencyUser[];
  notes: string;
  status: string;
  bookings_count: number;
}

interface StatementRow {
  booking_id: number;
  reference: string;
  travel_date: string;
  guest: string;
  trip: string;
  travelers: number;
  status: string;
  currency: string;
  total: number;
  paid: number;
  due: number;
}

interface Statement {
  number: string;
  month: string;
  rows: StatementRow[];
  totals: Record<string, { total: number; paid: number; due: number }>;
}

type Tab = "agencies" | "statements" | "emails";
type Routing = Record<"booking" | "payment" | "trip", "agency" | "guest" | "both">;

const EMPTY_FORM = {
  name: "",
  contact_name: "",
  email: "",
  billing_email: "",
  phone: "",
  billing_address: "",
  vat_number: "",
  payment_terms: "invoice" as "invoice" | "standard",
  users: "",
  notes: "",
};

const thisMonth = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const money = (n: number, c: string) =>
  formatYatraMoney(Number(n) || 0, c || (window as any)?.yatraAdmin?.currency || "USD", {
    zeroAsUnknown: false,
  });

const errorMessage = (e: any, fallback: string): string =>
  (e && typeof e.message === "string" && e.message) || fallback;

const UpgradeCard: React.FC = () => (
  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            {__("Travel Agencies", "yatra")}
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mt-1 max-w-2xl">
            {__(
              "Take bookings from travel agencies for their clients: agency billing details kept apart from the guest's, tour emails to the guest and booking and payment emails to the agency, pay by invoice, and one monthly statement settled with a single payment. Available on the Growth and Scale plans — switch it on in Yatra → Modules.",
              "yatra",
            )}
          </p>
        </div>
      </div>
      <Button
        onClick={() =>
          window.open("https://wpyatra.com/pricing?module=travel-agency", "_blank", "noopener")
        }
      >
        {__("See plans", "yatra")} <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  </div>
);

const TravelAgencies: React.FC = () => {
  const { can } = usePermissions();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canEdit = can("yatra_edit_bookings");

  const [moduleAvailable, setModuleAvailable] = useState<boolean>(() =>
    isModuleActive("travel_agency"),
  );
  useEffect(() => {
    const sync = () => setModuleAvailable(isModuleActive("travel_agency"));
    window.addEventListener("yatra-modules-updated", sync);
    window.addEventListener("yatra-force-nav-refresh", sync);
    return () => {
      window.removeEventListener("yatra-modules-updated", sync);
      window.removeEventListener("yatra-force-nav-refresh", sync);
    };
  }, []);

  const [tab, setTab] = useState<Tab>("agencies");
  const [showArchived, setShowArchived] = useState(false);

  // Agency form
  const [editing, setEditing] = useState<Agency | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [newCode, setNewCode] = useState<{ agency: string; code: string } | null>(null);
  const [toArchive, setToArchive] = useState<Agency | null>(null);
  const [toRotate, setToRotate] = useState<Agency | null>(null);

  // Statements
  const [stAgency, setStAgency] = useState<number>(0);
  const [stMonth, setStMonth] = useState<string>(thisMonth());
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({ amount: "", method: "bank_transfer", reference: "", date: "" });
  const [busy, setBusy] = useState<string>("");

  // Routing
  const [routing, setRouting] = useState<Routing | null>(null);

  const agenciesQuery = useQuery({
    queryKey: ["travel-agencies", showArchived],
    queryFn: async () =>
      await apiClient.get("/travel-agencies", { params: showArchived ? { archived: 1 } : {} }),
    enabled: moduleAvailable,
  });
  const agencies: Agency[] = (agenciesQuery.data as any)?.data ?? [];
  const activeAgencies = useMemo(() => agencies.filter((a) => a.status === "active"), [agencies]);

  useEffect(() => {
    if (!stAgency && activeAgencies.length > 0) {
      setStAgency(activeAgencies[0].id);
    }
  }, [activeAgencies, stAgency]);

  const statementQuery = useQuery({
    queryKey: ["travel-agency-statement", stAgency, stMonth],
    queryFn: async () =>
      await apiClient.get(`/travel-agencies/${stAgency}/statement`, { params: { month: stMonth } }),
    enabled: moduleAvailable && tab === "statements" && stAgency > 0,
  });
  const statement: Statement | null = (statementQuery.data as any)?.data ?? null;

  const settingsQuery = useQuery({
    queryKey: ["travel-agency-settings"],
    queryFn: async () => await apiClient.get("/travel-agencies/settings"),
    enabled: moduleAvailable && tab === "emails",
  });
  useEffect(() => {
    const r = (settingsQuery.data as any)?.data?.routing;
    if (r) setRouting(r);
  }, [settingsQuery.data]);

  if (!moduleAvailable) {
    return <UpgradeCard />;
  }

  const refreshAgencies = () => queryClient.invalidateQueries({ queryKey: ["travel-agencies"] });
  const refreshStatement = () =>
    queryClient.invalidateQueries({ queryKey: ["travel-agency-statement"] });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  };
  const openEdit = (a: Agency) => {
    setEditing(a);
    setForm({
      name: a.name,
      contact_name: a.contact_name,
      email: a.email,
      billing_email: a.billing_email,
      phone: a.phone,
      billing_address: a.billing_address,
      vat_number: a.vat_number,
      payment_terms: a.payment_terms,
      users: (a.users ?? []).map((u) => u.login).join(", "),
      notes: a.notes,
    });
    setFormOpen(true);
  };

  const saveAgency = async () => {
    setSaving(true);
    try {
      const res: any = editing
        ? await apiClient.post(`/travel-agencies/${editing.id}`, form)
        : await apiClient.post("/travel-agencies", form);
      setFormOpen(false);
      if (!editing && res?.code) {
        setNewCode({ agency: res.data?.name ?? form.name, code: res.code });
      }
      showToast(editing ? __("Agency saved.", "yatra") : __("Agency added.", "yatra"), "success");
      refreshAgencies();
    } catch (e) {
      showToast(errorMessage(e, __("The agency could not be saved.", "yatra")), "error");
    } finally {
      setSaving(false);
    }
  };

  const rotateCode = async (a: Agency) => {
    try {
      const res: any = await apiClient.post(`/travel-agencies/${a.id}/code`, {});
      setNewCode({ agency: a.name, code: res.code });
      refreshAgencies();
    } catch (e) {
      showToast(errorMessage(e, __("A new code could not be created.", "yatra")), "error");
    } finally {
      setToRotate(null);
    }
  };

  const archiveAgency = async (a: Agency) => {
    try {
      const res: any = await apiClient.delete(`/travel-agencies/${a.id}`);
      showToast(res?.message || __("Agency archived.", "yatra"), "success");
      refreshAgencies();
    } catch (e) {
      showToast(errorMessage(e, __("The agency could not be archived.", "yatra")), "error");
    } finally {
      setToArchive(null);
    }
  };

  const downloadPdf = async () => {
    setBusy("pdf");
    try {
      const blob = await apiClient.getBlob(`/travel-agencies/${stAgency}/statement/pdf`, {
        params: { month: stMonth },
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const isPdf = blob.type.includes("pdf");
      link.download = `${statement?.number || "statement"}.${isPdf ? "pdf" : "html"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      showToast(errorMessage(e, __("The statement could not be downloaded.", "yatra")), "error");
    } finally {
      setBusy("");
    }
  };

  const emailStatement = async () => {
    setBusy("email");
    try {
      const res: any = await apiClient.post(
        `/travel-agencies/${stAgency}/statement/email?month=${encodeURIComponent(stMonth)}`,
        {},
      );
      showToast(res?.message || __("Statement emailed to the agency.", "yatra"), "success");
    } catch (e) {
      showToast(errorMessage(e, __("The statement could not be emailed.", "yatra")), "error");
    } finally {
      setBusy("");
    }
  };

  const recordPayment = async () => {
    setBusy("pay");
    try {
      const res: any = await apiClient.post(
        `/travel-agencies/${stAgency}/statement/payment?month=${encodeURIComponent(stMonth)}`,
        { ...pay, amount: Number(pay.amount) },
      );
      showToast(
        res?.message || __("Payment recorded.", "yatra"),
        res?.partial ? "warning" : "success",
        res?.partial ? 10000 : undefined,
      );
      setPayOpen(false);
      setPay({ amount: "", method: "bank_transfer", reference: "", date: "" });
      refreshStatement();
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    } catch (e) {
      showToast(errorMessage(e, __("The payment could not be recorded.", "yatra")), "error");
    } finally {
      setBusy("");
    }
  };

  const saveRouting = async () => {
    if (!routing) return;
    setBusy("routing");
    try {
      await apiClient.post("/travel-agencies/settings", { routing });
      showToast(__("Email settings saved.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["travel-agency-settings"] });
    } catch (e) {
      showToast(errorMessage(e, __("The settings could not be saved.", "yatra")), "error");
    } finally {
      setBusy("");
    }
  };

  const field = (key: keyof typeof EMPTY_FORM, label: string, props: any = {}) => (
    <div>
      <Label htmlFor={`ta-${key}`}>{label}</Label>
      <Input
        id={`ta-${key}`}
        value={form[key] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        {...props}
      />
    </div>
  );

  const tabButton = (key: Tab, label: string, Icon: any) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
        tab === key
          ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      }`}
      aria-pressed={tab === key}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  const openDue = statement
    ? Object.entries(statement.totals).filter(([, t]) => t.due > 0.004)
    : [];

  const routingRow = (group: keyof Routing, title: string, help: string) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div>
        <div className="font-medium text-gray-900 dark:text-white">{title}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{help}</div>
      </div>
      <Select
        value={routing?.[group] ?? "agency"}
        onChange={(e) =>
          routing && setRouting({ ...routing, [group]: e.target.value as Routing[typeof group] })
        }
        disabled={!canEdit}
        className="md:w-56"
        aria-label={title}
      >
        <option value="agency">{__("Agency", "yatra")}</option>
        <option value="guest">{__("Guest", "yatra")}</option>
        <option value="both">{__("Agency and guest", "yatra")}</option>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        description={__(
          "Agencies that book tours for their clients. The booking keeps the guest's details; the agency's details, invoices and statements are kept here.",
          "yatra",
        )}
        actions={
          canEdit && tab === "agencies" ? (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              {__("Add agency", "yatra")}
            </Button>
          ) : null
        }
      />

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabButton("agencies", __("Agencies", "yatra"), Briefcase)}
        {tabButton("statements", __("Statements", "yatra"), FileText)}
        {tabButton("emails", __("Emails", "yatra"), Mail)}
      </div>

      {tab === "agencies" && (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-end px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                {__("Show archived", "yatra")}
              </label>
            </div>
            {agenciesQuery.isLoading ? (
              <div className="p-6 text-sm text-gray-500">{__("Loading…", "yatra")}</div>
            ) : agencies.length === 0 ? (
              <div className="p-10 text-center">
                <Briefcase className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-gray-600 dark:text-gray-300">
                  {__("No agencies yet. Add an agency to give it an agency code for checkout.", "yatra")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">{__("Agency", "yatra")}</th>
                      <th className="px-4 py-3">{__("Billing", "yatra")}</th>
                      <th className="px-4 py-3">{__("Payment terms", "yatra")}</th>
                      <th className="px-4 py-3">{__("Agency code", "yatra")}</th>
                      <th className="px-4 py-3 text-right">{__("Bookings", "yatra")}</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {agencies.map((a) => (
                      <tr key={a.id} className={a.status !== "active" ? "opacity-60" : ""}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">{a.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {[a.contact_name, a.email, a.phone].filter(Boolean).join(" · ")}
                          </div>
                          {a.users && a.users.length > 0 ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {sprintf(
                                /* translators: %s: list of WordPress users. */
                                __("Signs in as: %s", "yatra"),
                                a.users.map((u) => u.login).join(", "),
                              )}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          <div>{a.billing_email || a.email}</div>
                          {a.vat_number ? (
                            <div className="text-xs text-gray-500">
                              {__("VAT", "yatra")}: {a.vat_number}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          {a.payment_terms === "invoice" ? (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 text-xs">
                              {__("Pay by invoice", "yatra")}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs">
                              {__("Pays at checkout", "yatra")}
                            </Badge>
                          )}
                          {a.status !== "active" ? (
                            <Badge className="ml-1 bg-gray-100 text-gray-600 text-xs">
                              {__("Archived", "yatra")}
                            </Badge>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">
                          {a.has_code ? `AG-····-${a.code_hint}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">{a.bookings_count}</td>
                        <td className="px-4 py-3">
                          {canEdit && a.status === "active" ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEdit(a)} title={__("Edit", "yatra")}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setToRotate(a)} title={__("New agency code", "yatra")}>
                                <KeyRound className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setToArchive(a)} title={__("Archive", "yatra")}>
                                <Archive className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "statements" && (
        <Card>
          <CardContent className="p-6 space-y-5">
            {activeAgencies.length === 0 && agencies.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {__("Add an agency first.", "yatra")}
              </p>
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-4 md:items-end">
                  <div className="md:w-72">
                    <Label htmlFor="ta-st-agency">{__("Agency", "yatra")}</Label>
                    <Select
                      id="ta-st-agency"
                      value={String(stAgency)}
                      onChange={(e) => setStAgency(Number(e.target.value))}
                    >
                      {agencies.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="md:w-48">
                    <Label htmlFor="ta-st-month">{__("Month travelled", "yatra")}</Label>
                    <Input
                      id="ta-st-month"
                      type="month"
                      value={stMonth}
                      onChange={(e) => e.target.value && setStMonth(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 md:ml-auto">
                    <Button variant="outline" onClick={downloadPdf} disabled={!statement || busy !== ""}>
                      <Download className="w-4 h-4 mr-1" />
                      {__("Download", "yatra")}
                    </Button>
                    {canEdit ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={emailStatement}
                          disabled={!statement || statement.rows.length === 0 || busy !== ""}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          {busy === "email" ? __("Sending…", "yatra") : __("Email to agency", "yatra")}
                        </Button>
                        <Button onClick={() => setPayOpen(true)} disabled={openDue.length === 0 || busy !== ""}>
                          <Banknote className="w-4 h-4 mr-1" />
                          {__("Record payment", "yatra")}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>

                {statementQuery.isLoading ? (
                  <div className="text-sm text-gray-500">{__("Loading…", "yatra")}</div>
                ) : !statement || statement.rows.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {__("No tours travelled in this month.", "yatra")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {sprintf(
                        /* translators: %s: statement number. */
                        __("Statement %s", "yatra"),
                        statement.number,
                      )}
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-3 py-2">{__("Date", "yatra")}</th>
                          <th className="px-3 py-2">{__("Booking", "yatra")}</th>
                          <th className="px-3 py-2">{__("Guest", "yatra")}</th>
                          <th className="px-3 py-2">{__("Tour", "yatra")}</th>
                          <th className="px-3 py-2 text-right">{__("Total", "yatra")}</th>
                          <th className="px-3 py-2 text-right">{__("Paid", "yatra")}</th>
                          <th className="px-3 py-2 text-right">{__("Due", "yatra")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {statement.rows.map((r) => (
                          <tr key={r.booking_id}>
                            <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.travel_date)}</td>
                            <td className="px-3 py-2">
                              <a
                                href={`?page=yatra&subpage=bookings&action=view&id=${r.booking_id}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {r.reference}
                              </a>
                            </td>
                            <td className="px-3 py-2">
                              {r.guest}
                              {r.travelers > 1 ? <span className="text-gray-500"> ×{r.travelers}</span> : null}
                            </td>
                            <td className="px-3 py-2">{r.trip}</td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">{money(r.total, r.currency)}</td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">{money(r.paid, r.currency)}</td>
                            <td className="px-3 py-2 text-right whitespace-nowrap font-medium">{money(r.due, r.currency)}</td>
                          </tr>
                        ))}
                        {Object.entries(statement.totals).map(([cur, t]) => (
                          <tr key={cur} className="font-semibold border-t-2 border-gray-300 dark:border-gray-600">
                            <td className="px-3 py-2" colSpan={4}>
                              {__("Total", "yatra")}
                              {Object.keys(statement.totals).length > 1 ? ` (${cur})` : ""}
                            </td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">{money(t.total, cur)}</td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">{money(t.paid, cur)}</td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">{money(t.due, cur)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "emails" && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {__(
                "For bookings made by an agency, choose who receives each kind of email. Your own admin copies are not affected.",
                "yatra",
              )}
            </p>
            {routingRow(
              "booking",
              __("Booking emails", "yatra"),
              __("Booking confirmation (with prices), cancellations and expiry.", "yatra"),
            )}
            {routingRow(
              "payment",
              __("Payment emails", "yatra"),
              __("Payment receipts, balance reminders, payment links. Sent to the agency's billing email.", "yatra"),
            )}
            {routingRow(
              "trip",
              __("Tour emails", "yatra"),
              __("Pickup reminder before the tour, consent forms, review request.", "yatra"),
            )}
            {canEdit ? (
              <div className="pt-4">
                <Button onClick={saveRouting} disabled={!routing || busy !== ""}>
                  {busy === "routing" ? __("Saving…", "yatra") : __("Save", "yatra")}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? __("Edit agency", "yatra") : __("Add agency", "yatra")}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              {__("Cancel", "yatra")}
            </Button>
            <Button onClick={saveAgency} disabled={saving}>
              {saving ? __("Saving…", "yatra") : __("Save", "yatra")}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field("name", __("Agency name", "yatra"), { required: true })}
          {field("contact_name", __("Contact person", "yatra"))}
          {field("email", __("Email", "yatra"), { type: "email", required: true })}
          {field("billing_email", __("Billing email (invoices and receipts)", "yatra"), { type: "email" })}
          {field("phone", __("Phone", "yatra"))}
          {field("vat_number", __("VAT / tax number", "yatra"))}
          <div className="md:col-span-2">
            <Label htmlFor="ta-billing_address">{__("Billing address", "yatra")}</Label>
            <textarea
              id="ta-billing_address"
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              value={form.billing_address}
              onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ta-terms">{__("Payment terms", "yatra")}</Label>
            <Select
              id="ta-terms"
              value={form.payment_terms}
              onChange={(e) => setForm({ ...form, payment_terms: e.target.value as "invoice" | "standard" })}
            >
              <option value="invoice">{__("Pay by invoice (monthly statement)", "yatra")}</option>
              <option value="standard">{__("Pays at checkout", "yatra")}</option>
            </Select>
          </div>
          {field("users", __("WordPress users who book for this agency", "yatra"), {
            placeholder: __("usernames or emails, comma separated", "yatra"),
          })}
          <div className="md:col-span-2">
            <Label htmlFor="ta-notes">{__("Internal notes", "yatra")}</Label>
            <textarea
              id="ta-notes"
              rows={2}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <p className="md:col-span-2 text-xs text-gray-500 dark:text-gray-400">
            {__(
              "Pay by invoice also needs the \"Pay by invoice\" method switched on in Settings → Payments. Only agencies on invoice terms see it at checkout.",
              "yatra",
            )}
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={newCode !== null}
        onClose={() => setNewCode(null)}
        title={__("Agency code", "yatra")}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setNewCode(null)}>{__("Done", "yatra")}</Button>
          </div>
        }
      >
        {newCode ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {sprintf(
                /* translators: %s: agency name. */
                __("Give this code to %s. They enter it at checkout to book as the agency. It is shown only once — create a new one if it is lost.", "yatra"),
                newCode.agency,
              )}
            </p>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 select-all">
                {newCode.code}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(newCode.code).then(
                    () => showToast(__("Copied.", "yatra"), "success"),
                    () => undefined,
                  );
                }}
              >
                <Copy className="w-4 h-4 mr-1" />
                {__("Copy", "yatra")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        title={__("Record statement payment", "yatra")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              {__("Cancel", "yatra")}
            </Button>
            <Button onClick={recordPayment} disabled={busy === "pay" || !(Number(pay.amount) > 0)}>
              {busy === "pay" ? __("Saving…", "yatra") : __("Record payment", "yatra")}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {__(
              "The amount is applied to the statement's bookings, oldest tour first. Each booking gets its own payment record; the agency gets one receipt.",
              "yatra",
            )}
          </p>
          {openDue.map(([cur, t]) => (
            <div key={cur} className="text-sm">
              {__("Due on this statement:", "yatra")} <strong>{money(t.due, cur)}</strong>
            </div>
          ))}
          <div>
            <Label htmlFor="ta-pay-amount">{__("Amount received", "yatra")}</Label>
            <Input
              id="ta-pay-amount"
              type="number"
              min="0"
              step="0.01"
              value={pay.amount}
              onChange={(e) => setPay({ ...pay, amount: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ta-pay-method">{__("Method", "yatra")}</Label>
            <Select
              id="ta-pay-method"
              value={pay.method}
              onChange={(e) => setPay({ ...pay, method: e.target.value })}
            >
              <option value="bank_transfer">{__("Bank transfer", "yatra")}</option>
              <option value="cash">{__("Cash", "yatra")}</option>
              <option value="credit_card">{__("Card", "yatra")}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="ta-pay-ref">{__("Reference", "yatra")}</Label>
            <Input
              id="ta-pay-ref"
              value={pay.reference}
              onChange={(e) => setPay({ ...pay, reference: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={toRotate !== null}
        onClose={() => setToRotate(null)}
        onConfirm={() => toRotate && rotateCode(toRotate)}
        title={__("Create a new agency code?", "yatra")}
        message={__("The current code stops working straight away.", "yatra")}
        confirmText={__("New code", "yatra")}
        variant="warning"
      />
      <ConfirmationDialog
        isOpen={toArchive !== null}
        onClose={() => setToArchive(null)}
        onConfirm={() => toArchive && archiveAgency(toArchive)}
        title={__("Archive this agency?", "yatra")}
        message={__("Its agency code stops working. Its bookings and statements are kept.", "yatra")}
        confirmText={__("Archive", "yatra")}
        variant="danger"
      />
    </div>
  );
};

export default TravelAgencies;
