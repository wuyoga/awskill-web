"use client";

import { useCallback, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { useEnumLabel } from "@/i18n/format";

export type Route = { page: string; id?: string; params: URLSearchParams };

export type AppActions = {
  go: (href: string) => void;
  soon: (feature: string) => void;
  compareIds: string[];
  /** True after `/compare` has been seeded from URL (or confirmed empty). */
  compareHydrated: boolean;
  toggleCompare: (id: string) => void;
  /** One-shot / explicit seed from shared `?skills=` (does not fight user edits). */
  seedCompare: (ids: string[]) => void;
};

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);
  const copy = useCallback((text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  }, []);
  return [copied, copy] as const;
}

export function VerdictBadge({ verdict }: { verdict: string }) {
  const l = useEnumLabel();
  return (
    <span className={`recommendation ${verdict === "推荐" ? "" : "conditional"}`}>
      <Icon name={verdict === "推荐" ? "check" : "warning"} size={15} /> {l(verdict)}
    </span>
  );
}
