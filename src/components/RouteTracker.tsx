import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

export function RouteTracker() {
  const loc = useLocation();
  useEffect(() => { trackPageView(loc.pathname + loc.search); }, [loc.pathname, loc.search]);
  return null;
}
