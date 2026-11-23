"use client";

import { useCallback, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export type Route = { page: string; id?: string; params: URLSearchParams };

export type AppActions = {
  go: (href: string) => void;
  soon: (zh: string, en: string) => void;
  compareIds: string[];
  toggleCompare: (id: string) => void;
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
  const { l } = useI18n();
  return (
    <span className={`recommendation ${verdict === "推荐" ? "" : "conditional"}`}>
      <Icon name={verdict === "推荐" ? "check" : "warning"} size={15} /> {l(verdict)}
    </span>
  );
}
