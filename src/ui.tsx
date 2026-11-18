import type { ReactNode } from "react";
import {
  AGENT_META,
  AGENTS,
  type AgentName,
  type CompatStatus,
  type IconName,
  type Level,
  type RiskLevel,
  type Skill,
  type VerifyStatus,
} from "./data";
import { useI18n } from "./i18n";

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const paths: Record<IconName, ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    star: <path d="m12 2 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3.1L6.1 20l1.1-6.4L2.5 9 9 8l3-6Z" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    external: (
      <>
        <path d="M15 3h6v6" />
        <path d="m10 14 11-11" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
    github: (
      <>
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.2.1 15 1.8a13.4 13.4 0 0 0-7 0C4.8.1 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4" />
        <path d="M8 19c-3 .9-3-1.5-4-2" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    x: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
    terminal: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m7 9 3 3-3 3M13 15h4" />
      </>
    ),
    code: (
      <>
        <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3-1.3 4.2a5 5 0 0 1-3.3 3.3L3 12l4.4 1.5a5 5 0 0 1 3.2 3.3L12 21l1.4-4.2a5 5 0 0 1 3.2-3.3L21 12l-4.4-1.5a5 5 0 0 1-3.3-3.3L12 3Z" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    bolt: <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" />,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    warning: (
      <>
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function StatusPill({ status }: { status: VerifyStatus }) {
  const { l } = useI18n();
  return (
    <span className={`status-pill ${status === "待验证" ? "muted" : ""}`}>
      <Icon name={status === "待验证" ? "clock" : "check"} size={13} strokeWidth={2.2} />
      {l(status)}
    </span>
  );
}

export function RiskPill({ risk }: { risk: RiskLevel }) {
  const { l } = useI18n();
  return (
    <span
      className={`risk-pill ${risk === "中风险" ? "medium" : risk === "未评估" ? "muted" : ""}`}
    >
      <span className="risk-dot" />
      {l(risk)}
    </span>
  );
}

export function compatTone(status: CompatStatus) {
  return status === "完整支持" ? "good" : status === "部分支持" ? "warn" : "muted";
}

export function AgentMark({ agent, size = "md" }: { agent: AgentName; size?: "sm" | "md" }) {
  return (
    <span className={`agent-mini ${AGENT_META[agent].tone} ${size}`} aria-hidden="true">
      {AGENT_META[agent].mark}
    </span>
  );
}

/** Compact per-Agent compatibility row used on cards. */
export function AgentSupport({ skill }: { skill: Skill }) {
  const { t, l } = useI18n();
  return (
    <div className="card-agents" aria-label={t("Agent 兼容性", "Agent compatibility")}>
      {AGENTS.map((agent) => {
        const status = skill.compat[agent].status;
        return (
          <span
            key={agent}
            className={`card-agent ${compatTone(status)}`}
            title={`${agent}: ${l(status)}`}
          >
            <AgentMark agent={agent} size="sm" />
            <span className="sr-only">
              {agent}: {l(status)}
            </span>
          </span>
        );
      })}
    </div>
  );
}

const LEVEL_STEPS: Record<Level, number> = { 优秀: 4, 良好: 3, 一般: 2, 不足: 1 };

/** Discrete four-step level indicator. Deliberately not a percentage score. */
export function LevelMeter({ level }: { level: Level }) {
  const { l } = useI18n();
  const steps = LEVEL_STEPS[level];
  return (
    <span className={`level-meter l${steps}`}>
      <span className="level-bars" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <i key={step} className={step <= steps ? "on" : ""} />
        ))}
      </span>
      <strong>{l(level)}</strong>
    </span>
  );
}

export function SkillCard({
  skill,
  selected,
  onOpen,
  onCompare,
}: {
  skill: Skill;
  selected: boolean;
  onOpen: () => void;
  onCompare: () => void;
}) {
  const { t } = useI18n();
  return (
    <article className="skill-card">
      <div className="card-main">
        <div className="card-heading">
          <span className={`skill-icon ${skill.tone}`}>
            <Icon name={skill.icon} size={21} />
          </span>
          <div>
            <h3>
              <button className="card-link" onClick={onOpen}>
                {skill.name}
              </button>
            </h3>
            <p className="repo-line">
              {skill.owner} / {skill.repo}
            </p>
          </div>
        </div>
        <p className="card-description">{skill.description}</p>
        <div className="tag-row">
          {skill.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <AgentSupport skill={skill} />
      </div>
      <div className="card-footer">
        <div className="signal-row">
          <StatusPill status={skill.status} />
          <RiskPill risk={skill.risk} />
        </div>
        <div className="card-actions">
          <span
            className="star-count"
            title={t("来源仓库 GitHub Star", "Source repo GitHub stars")}
          >
            <Icon name="star" size={14} /> {skill.stars}
          </span>
          <button
            className={`compare-add ${selected ? "selected" : ""}`}
            onClick={onCompare}
            aria-pressed={selected}
            aria-label={
              selected
                ? t(`将 ${skill.name} 移出对比`, `Remove ${skill.name} from compare`)
                : t(`将 ${skill.name} 加入对比`, `Add ${skill.name} to compare`)
            }
          >
            <Icon name={selected ? "check" : "plus"} size={15} />
            {selected ? t("已加入", "Added") : t("对比", "Compare")}
          </button>
        </div>
      </div>
    </article>
  );
}

export function CopyBlock({
  text,
  copied,
  onCopy,
  multiline = false,
}: {
  text: string;
  copied: boolean;
  onCopy: () => void;
  multiline?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className={`code-block ${multiline ? "multi" : ""}`}>
      <div>
        <span>$</span>
        <code>{text}</code>
      </div>
      <button onClick={onCopy} aria-label={t("复制命令", "Copy command")}>
        <Icon name={copied ? "check" : "copy"} size={17} />
        <span className="copy-label">{copied ? t("已复制", "Copied") : t("复制", "Copy")}</span>
      </button>
    </div>
  );
}

export function Notice({
  tone = "warn",
  children,
}: {
  tone?: "warn" | "info";
  children: ReactNode;
}) {
  return (
    <div className={`notice ${tone}`} role="note">
      <Icon name={tone === "warn" ? "warning" : "shield"} size={16} />
      <div>{children}</div>
    </div>
  );
}
