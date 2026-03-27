import { useEffect, useRef, useState, useCallback } from "react";

const WS_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    .replace(/^http/, "ws");

export type WsStatus = "connecting" | "connected" | "reconnecting" | "error";

export interface WsMessage<T = unknown> {
  type: "snapshot" | "update" | "ticker";
  ts: string;
  data?: T[];
  items?: T[];
  count?: number;
}

export function useWebSocket<T>(
  path: string,
  onMessage?: (msg: WsMessage<T>) => void
) {
  const [status, setStatus] = useState<WsStatus>("connecting");
  const [lastTs, setLastTs] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout>>();
  const retryCount = useRef(0);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const url = `${WS_BASE}${path}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus("connected");
      retryCount.current = 0;
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data) as WsMessage<T>;
        setLastTs(msg.ts);
        onMessage?.(msg);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("reconnecting");
      const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
      retryCount.current += 1;
      retryRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      setStatus("error");
      ws.close();
    };
  }, [path, onMessage]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, lastTs };
}

/** Convenience hook: manages data state from a WebSocket stream */
export function useWsData<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<WsStatus>("connecting");
  const [lastTs, setLastTs] = useState<string | null>(null);

  const { status: wsStatus } = useWebSocket<T>(path, (msg) => {
    if (msg.data) setData(msg.data);
    setLastTs(msg.ts);
  });

  useEffect(() => setStatus(wsStatus), [wsStatus]);

  return { data, status, lastTs };
}
