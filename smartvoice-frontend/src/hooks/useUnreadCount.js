import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";

export default function useUnreadCount() {
  const [count, setCount] = useState(0);
  const mountedRef = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get("/api/notifications/me/unread-count");
      if (mountedRef.current) {
        setCount(Number(res.data || 0));
      }
    } catch {
      if (mountedRef.current) {
        setCount(0);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const timer = setTimeout(() => {
      fetchUnreadCount();
    }, 0);

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 10000);

    const onRefresh = () => {
      fetchUnreadCount();
    };

    window.addEventListener("notifications-updated", onRefresh);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("notifications-updated", onRefresh);
    };
  }, [fetchUnreadCount]);

  return {
    count,
    refresh: fetchUnreadCount,
  };
}
