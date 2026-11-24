"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppActions } from "@/components/app-state";
import { Icon, AgentMark, compatTone } from "@/components/ui";
import { NotFound } from "@/components/pages/compare-page";
import { AGENTS, AGENT_META, type AgentName, agentProfiles, type Skill } from "@/lib/data";
import { agentSlug, searchHref, skillHref } from "@/lib/routes";
import { Link } from "@/i18n/navigation";
import { useEnumLabel } from "@/i18n/format";
import { useData } from "@/lib/use-data";

function resolveAgent(slug: string): AgentName | undefined {
  return AGENTS.find((agent) => agentSlug(agent) === slug.toLowerCase());
}

export default function AgentDetailRoute({ related }: { related: Skill[] }) {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug ?? "");
  const agent = resolveAgent(slug);
  const actions = useAppActions();
  const t = useTranslations("agents");
  const l = useEnumLabel();
  const { agentCopy } = useData();

  if (!agent) return <NotFound go={actions.go} />;

  const profile = agentProfiles[agent];
  const coverage = Math.round((profile.verified / profile.compatible) * 100);
  const meta = AGENT_META[agent];

  const coverageLabel = t("coverageTested", { coverage });

  return (
    <main className="hub-page container agent-detail">
      <div className="breadcrumb">
        <button type="button" onClick={() => actions.go("/agents")}>
          Agent
        </button>
        <Icon name="chevron" size={13} />
        <strong>{agent}</strong>
      </div>

      <header className="agent-detail-hero">
        <div className="agent-detail-lead">
          <span className="section-kicker">AGENT</span>
          <div className="agent-detail-title">
            <span className={`agent-logo ${profile.tone}`}>{meta.mark}</span>
            <div>
              <h1>{agent}</h1>
              <span className="agent-detail-status">
                <i /> {t("maintained")}
              </span>
            </div>
          </div>
          <p>{agentCopy(agent)}</p>
          <div className="agent-detail-actions">
            <button type="button" className="primary" onClick={() => actions.go(searchHref({ agent }))}>
              {t("browseSkills")} <Icon name="arrow" size={15} />
            </button>
          </div>
        </div>

        <aside className="agent-detail-panel">
          <div className="agent-metrics">
            <div>
              <strong>{profile.verified}</strong>
              <span>{t("tested")}</span>
            </div>
            <div>
              <strong>{profile.compatible}</strong>
              <span>{t("compatibleSkills")}</span>
            </div>
          </div>
          <div
            className="coverage-bar"
            role="meter"
            aria-valuenow={coverage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={coverageLabel}
          >
            <span style={{ width: `${coverage}%` }} />
          </div>
          <small className="coverage-label">
            {t("coverageTestedPath", { coverage })}{" "}
            <code>{meta.installDir("<skill>")}</code>
          </small>
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
        </aside>
      </header>

      <section className="hub-section">
        <div className="section-heading compact">
          <div>
            <span className="section-kicker">SKILLS</span>
            <h2>{t("detail.skillsOnAgent", { agent })}</h2>
            <p>{t("detail.skillsListIntro")}</p>
          </div>
        </div>
        <div className="skill-list">
          {related.map((skill) => {
            const compat = skill.compat[agent];
            const tone = compatTone(compat.status);
            return (
              <Link className="skill-row" key={skill.id} href={skillHref(skill.id)}>
                <span className={`mini-skill-dot ${skill.tone}`} aria-hidden="true" />
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