"use client";

import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";
import { AlertsList } from "@/components/AlertsList";
import type { Alert } from "@/types";

export const dynamic = "force-dynamic";

export default function AlertsPage() {
  const { data: alerts, isLoading } = useSWR<Alert[]>(
    "/alerts/",
    () => api.alerts.list(),
    { refreshInterval: 15_000 }
  );

  async function handleMarkRead(id: number) {
    await api.alerts.markRead(id);
    await mutate("/alerts/");
  }

  async function handleMarkAllRead() {
    const unread = alerts?.filter((a) => !a.is_read) ?? [];
    await Promise.all(unread.map((a) => api.alerts.markRead(a.id)));
    await mutate("/alerts/");
  }

  const unread = alerts?.filter((a) => !a.is_read).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Risk Alerts</h1>
          <p className="text-sm text-gray-500">{unread} unread</p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={() => mutate("/alerts/")}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {isLoading && <div className="text-gray-400">Loading…</div>}
      {alerts && alerts.length === 0 && (
        <div className="text-center py-16 text-gray-400">No alerts.</div>
      )}
      {alerts && alerts.length > 0 && (
        <AlertsList alerts={alerts} onMarkRead={handleMarkRead} />
      )}
    </div>
  );
}
