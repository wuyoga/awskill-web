"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useAppActions } from "@/components/app-state";
import { Icon, AgentMark, compatTone } from "@/components/ui";
import { NotFound } from "@/components/pages/compare-page";
import { AGENTS, AGENT_META, type AgentName, agentProfiles } from "@/lib/data";
import { agentSlug, localized, searchHref, skillHref } from "@/lib/routes";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/use-data";

function resolveAgent(slug: string): AgentName | undefined {
  return AGENTS.find((agent) => agentSlug(agent) === slug.toLowerCase());
}

export default function AgentDetailRoute() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug ?? "");
  const agent = resolveAgent(slug);
  const actions = useAppActions();
  const { t, l, lang } = useI18n();
  const { skills, agentCopy } = useData();

  const related = useMemo(() => {
    if (!agent) return [];
    return [...skills]
      .filter((skill) => skill.compat[agent].status !== "未验证")
      .sort((a, b) => b.installs - a.installs)
      .slice(0, 12);
  }, [agent, skills]);

  if (!agent) return <NotFound go={actions.go} />;

  const profile = agentProfiles[agent];
  const coverage = Math.round((profile.verified / profile.compatible) * 100);
  const meta = AGENT_META[agent];

  return (
    <main className="hub-page container">
      <div className="breadcrumb">
        <button type="button" onClick={() => actions.go("/agents")}>
          Agent
        </button>
        <Icon name="chevron" size={13} />
        <strong>{agent}</strong>
      </div>

      <div className="hub-hero agent-hero">
        <div>
          <span className="section-kicker">AGENT</span>
          <div className="agent-card-heading" style={{ marginBottom: 12 }}>
            <span className={`agent-logo ${profile.tone}`}>{meta.mark}</span>
            <div>
              <h1>{agent}</h1>
              <span>
                <i /> {t("正在维护", "Maintained")}
              </span>
            </div>
          </div>
          <p>{agentCopy(agent)}</p>
          <div className="agent-metrics" style={{ marginTop: 16 }}>
            <div>
              <strong>{profile.verified}</strong>
              <span>{t("已实测", "Tested")}</span>
            </div>
            <div>
              <strong>{profile.compatible}</strong>
              <span>{t("兼容 Skills", "Compatible")}</span>
            </div>
          </div>
          <div className="coverage-bar" title={t(`实测覆盖 ${coverage}%`, `${coverage}% tested`)}>
            <span style={{ width: `${coverage}%` }} />
          </div>
          <small className="coverage-label">
            {t(`实测覆盖 ${coverage}% · 安装目录`, `${coverage}% tested · path`)}{" "}
            <code>{meta.installDir("<skill>")}</code>
          </small>
          <div className="agent-card-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <button type="button" onClick={() => actions.go(searchHref({ agent }))}>
              {t("浏览 Skills", "Browse Skills")} <Icon name="arrow" size={15} />
            </button>
          </div>
        </div>
        <div className="compat-legend">
          <span>
            <i className="full" /> {l("完整支持")}
          </span>
          <span>
            <i className="partial" /> {l("部分支持")}
          </span>
          <span>
            <i /> {l("未验证")}
          </span>
        </div>
      </div>

      <section className="hub-section">
        <div className="section-heading compact">
          <div>
            <span className="section-kicker">SKILLS</span>
            <h2>{t(`在 ${agent} 上可用的 Skill`, `Skills available on ${agent}`)}</h2>
            <p>
              {t(
                "按安装量排序；“未验证”条目不在此列表中。",
                "Sorted by installs; unverified entries are omitted.",
              )}
            </p>
          </div>
        </div>
        <div className="skill-list">
          {related.map((skill) => {
            const compat = skill.compat[agent];
            const tone = compatTone(compat.status);
            return (
              <Link className="skill-row" key={skill.id} href={localized(lang, skillHref(skill.id))}>
                <span className={`mini-skill-dot ${skill.tone}`} />
                <span className="skill-row-body">
                  <strong>{skill.name}</strong>
                  <span>{skill.description}</span>
                </span>
                <span className={`compat-chip ${tone}`}>
                  <AgentMark agent={agent} size="sm" />
                  {l(compat.status)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
