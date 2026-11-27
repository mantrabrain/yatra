/**
 * Settings → API Access (3.3): API keys for Yatra's REST API.
 *
 * Keys are WordPress application passwords made for a chosen user; a key
 * can do what that user can. The plain key is shown once.
 */
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Trash2, Copy, AlertTriangle } from "lucide-react";
import { __, sprintf } from "../../lib/i18n";
import { apiClient } from "../../lib/api-client";
import { formatDate } from "../../lib/dateFormat";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";

interface ApiKey {
  uuid: string;
  name: string;
  user_id: number;
  user: string;
  created: string | null;
  last_used: string | null;
}

interface Props {
  /** Keep the Settings page's own copy in step, so its Save doesn't post the old value back. */
  onSettingSaved?: (key: string, value: unknown) => void;
}

const ApiAccessSection: React.FC<Props> = ({ onSettingSaved }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ name: string; user: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const q = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => await apiClient.get("/api-keys"),
  });

  // Embed trips on other websites.
  const [embedTrips, setEmbedTrips] = useState<number[]>([]);
  const [embedLimit, setEmbedLimit] = useState("6");
  const [embedColumns, setEmbedColumns] = useState("3");
  const [embedSaving, setEmbedSaving] = useState(false);
  const [embedOn, setEmbedOn] = useState<boolean | null>(null);
  const embedTripsQuery = useQuery({
    queryKey: ["embed-trips"],
    queryFn: async () => {
      const res: any = await apiClient.get("/trips", { params: { per_page: 100, status: "publish" } });
      const items: any[] = res?.data?.data || res?.data || res || [];
      return Array.isArray(items) ? items : [];
    },
  });
  const snippetQuery = useQuery({
    queryKey: ["embed-snippet", embedTrips.join(","), embedLimit, embedColumns],
    queryFn: async () =>
      await apiClient.get("/embed/snippet", {
        params: { trips: embedTrips.join(","), limit: embedLimit, columns: embedColumns },
      }),
  });
  const snippet: any = snippetQuery.data || {};
  const toggleEmbed = async (on: boolean) => {
    setEmbedSaving(true);
    setEmbedOn(on);
    try {
      await apiClient.post("/settings", { embed_enabled: on });
      onSettingSaved?.("embed_enabled", on);
      queryClient.invalidateQueries({ queryKey: ["embed-snippet"] });
    } catch (e: any) {
      setEmbedOn(!on);
      setError(e?.message || __("Could not save.", "yatra"));
    } finally {
      setEmbedSaving(false);
    }
  };
  const data: any = q.data || {};
  const keys: ApiKey[] = data.keys || [];
  const users: Array<{ id: number; login: string; name: string; is_admin: boolean }> = data.users || [];
  const chosen = users.find((u) => String(u.id) === userId);

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const res: any = await apiClient.post("/api-keys", { name, user_id: userId ? parseInt(userId, 10) : undefined });
      setCreated(res.key);
      setName("");
      setCopied(false);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    } catch (e: any) {
      setError(e?.message || __("Could not create the key.", "yatra"));
    } finally {
      setBusy(false);
    }
  };
  const revoke = async (k: ApiKey) => {
    if (!window.confirm(sprintf(__("Revoke \"%s\"? Apps using it stop working at once.", "yatra"), k.name))) {
      return;
    }
    try {
      await apiClient.delete(`/api-keys/${k.user_id}/${k.uuid}`);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    } catch (e: any) {
      setError(e?.message || __("Could not revoke the key.", "yatra"));
    }
  };

  if (q.isLoading) {
    return <p className="text-sm text-gray-500">{__("Loading…", "yatra")}</p>;
  }

  return (
    <div className="space-y-6" data-testid="settings-api-access">
      <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 space-y-1">
        <p>
          {__(
            "API keys let another app (a booking channel, your CRM, Zapier/Make via HTTP) use Yatra's REST API. A key works as the user it belongs to, with that user's permissions — make keys for a dedicated user with a Yatra staff role, not for an administrator.",
            "yatra",
          )}
        </p>
        <p>
          {__("Send the key with HTTP Basic auth: user name + key. Example:", "yatra")}{" "}
          <code className="break-all">{`curl -u "USER:KEY" ${data.rest_base || "/wp-json/yatra/v1/"}bookings`}</code>
        </p>
      </div>

      {!data.available && (
        <p className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-md p-3" data-testid="api-keys-unavailable">
          <AlertTriangle className="w-4 h-4" />
          {__("WordPress application passwords are off on this site. They need HTTPS (or a plugin may have turned them off).", "yatra")}
        </p>
      )}

      {created && (
        <div className="rounded-md border border-green-300 bg-green-50 dark:bg-green-900/20 p-3 space-y-2" data-testid="api-key-created">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            {sprintf(__("Key \"%1$s\" for %2$s — copy it now, it won't be shown again:", "yatra"), created.name, created.user)}
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-white dark:bg-gray-900 px-2 py-1 rounded break-all" data-testid="api-key-value">{created.password}</code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                try {
                  navigator.clipboard.writeText(created.password);
                  setCopied(true);
                } catch {
                  /* select it by hand */
                }
              }}
            >
              <Copy className="w-4 h-4 mr-1" />
              {copied ? __("Copied", "yatra") : __("Copy", "yatra")}
            </Button>
          </div>
        </div>
      )}

      {data.available && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <Label htmlFor="api-key-name">{__("Name", "yatra")}</Label>
            <Input id="api-key-name" value={name} maxLength={80} placeholder={__("e.g. Booking channel sync", "yatra")} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="api-key-user">{__("Acts as user", "yatra")}</Label>
            <Select id="api-key-user" value={userId} onChange={(e: any) => setUserId(e.target.value)}>
              <option value="">{__("Me", "yatra")}</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name ? `${u.name} (${u.login})` : u.login}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={create} disabled={busy || !name.trim()} data-testid="api-key-create">
            <KeyRound className="w-4 h-4 mr-1" />
            {__("Create key", "yatra")}
          </Button>
          {(chosen ? chosen.is_admin : true) && (
            <p className="md:col-span-3 text-xs text-amber-700 dark:text-amber-300">
              {__("This user is an administrator: the key could change anything on the site. Prefer a user with a Yatra staff role.", "yatra")}
            </p>
          )}
        </div>
      )}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{__("Keys", "yatra")}</h3>
        {keys.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{__("No API keys yet.", "yatra")}</p>
        ) : (
          <table className="w-full text-sm" data-testid="api-keys-table">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="py-2">{__("Name", "yatra")}</th>
                <th>{__("User", "yatra")}</th>
                <th>{__("Created", "yatra")}</th>
                <th>{__("Last used", "yatra")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.uuid} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2">{k.name}</td>
                  <td>{k.user}</td>
                  <td>{k.created ? formatDate(k.created) : "—"}</td>
                  <td>{k.last_used ? formatDate(k.last_used) : __("Never", "yatra")}</td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" aria-label={__("Revoke", "yatra")} onClick={() => revoke(k)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3" data-testid="settings-embed">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {__("Embed trips on other websites", "yatra")}
        </h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={embedOn ?? !!snippet.enabled}
            disabled={embedSaving || snippetQuery.isLoading}
            onChange={(e) => toggleEmbed(e.target.checked)}
            data-testid="embed-enabled"
          />
          {__("Allow other websites to show your trips (a list of trip cards that link here)", "yatra")}
        </label>
        {(embedOn ?? !!snippet.enabled) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <Label>{__("Trips (none chosen = your newest)", "yatra")}</Label>
                <div className="flex flex-wrap gap-3 max-h-40 overflow-auto">
                  {(embedTripsQuery.data || []).map((t: any) => (
                    <label key={t.id} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={embedTrips.includes(Number(t.id))}
                        onChange={(e) =>
                          setEmbedTrips(
                            e.target.checked
                              ? [...embedTrips, Number(t.id)]
                              : embedTrips.filter((x) => x !== Number(t.id)),
                          )
                        }
                      />
                      {t.title}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="embed-limit">{__("How many", "yatra")}</Label>
                <Input id="embed-limit" type="number" min={1} max={12} value={embedLimit} onChange={(e) => setEmbedLimit(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="embed-columns">{__("Columns", "yatra")}</Label>
                <Select id="embed-columns" value={embedColumns} onChange={(e: any) => setEmbedColumns(e.target.value)}>
                  {["1", "2", "3", "4"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>
            <Label htmlFor="embed-code">{__("Paste this into the other website", "yatra")}</Label>
            <textarea
              id="embed-code"
              readOnly
              rows={4}
              value={snippet.snippet || ""}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              data-testid="embed-code"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ApiAccessSection;
