import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/api";

// Scoped client cache for screens that are frequently re-filtered. It avoids
// changing the behaviour of the existing UseFetch hook used elsewhere.
const responseCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_CACHE_TTL = 60 * 1000;

const getRequest = (url) => {
  const existing = inFlightRequests.get(url);
  if (existing) {
    existing.subscribers += 1;
    return existing;
  }

  const controller = new AbortController();
  const request = {
    controller,
    subscribers: 1,
    promise: api
      .get(url, { withCredentials: true, signal: controller.signal })
      .then((response) => response.data?.data ?? null)
      .then((data) => {
        responseCache.set(url, { data, updatedAt: Date.now() });
        return data;
      })
      .finally(() => inFlightRequests.delete(url))
  };

  inFlightRequests.set(url, request);
  return request;
};

const releaseRequest = (url, request) => {
  request.subscribers -= 1;
  if (request.subscribers <= 0 && inFlightRequests.get(url) === request) {
    request.controller.abort();
  }
};

export default function useCachedFetch(url, { ttl = DEFAULT_CACHE_TTL } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [forcedRefreshUrl, setForcedRefreshUrl] = useState(null);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine
  );
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setIsRefreshing(false);
      setError(null);
      return undefined;
    }

    const cached = responseCache.get(url);
    const hasCachedData = cached !== undefined;
    const hasVisibleData = hasCachedData || dataRef.current !== null;
    const cacheIsFresh =
      cached && forcedRefreshUrl !== url && Date.now() - cached.updatedAt < ttl;

    if (cached) setData(cached.data);
    setError(null);

    if (cacheIsFresh) {
      setLoading(false);
      setIsRefreshing(false);
      return undefined;
    }

    setLoading(!hasVisibleData);
    setIsRefreshing(hasVisibleData);
    const request = getRequest(url);
    let active = true;

    request.promise
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active && requestError?.name !== "CanceledError") {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Unable to load data."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setIsRefreshing(false);
          if (forcedRefreshUrl === url) setForcedRefreshUrl(null);
        }
      });

    return () => {
      active = false;
      releaseRequest(url, request);
    };
  }, [url, ttl, forcedRefreshUrl]);

  const refresh = useCallback(() => {
    setForcedRefreshUrl(url);
  }, [url]);

  return { data, loading, isRefreshing, error, isOffline, refresh };
}
