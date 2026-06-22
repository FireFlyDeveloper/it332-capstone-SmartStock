-- =============================================================
-- SmartStock :: Database Schema
-- Section:  System Development Methodology  (Hazel)
-- Branch:   Hazel  →  HAZEL-2B
-- Engine:   PostgreSQL 14+
-- Layer:    Audit trail + agile workflow + deployment history
-- =============================================================
--
-- This file contains the tables that support the team's agile
-- development workflow and the system's audit/deployment history.
-- It models the six development phases (Planning → Design →
-- Development → Testing → Deployment → Review) and captures
-- every client feedback cycle.
--
-- Dependencies (assumed already applied):
--   schema.kim.sql     — users (created_by refs)
--   schema.luraine.sql — orders, deliveries, products
--
-- See also:
--   schema.kim.sql     — Architecture & Technologies
--   schema.luraine.sql — System Features & AI Analytics
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- System-wide audit log
-- -----------------------------------------------------------------
-- Every privileged write goes through the application's audit
-- middleware, which inserts a row here in the same transaction.
-- Append-only; never updated, never deleted.
CREATE TABLE audit_logs (
    id           BIGSERIAL   PRIMARY KEY,
    actor_id     UUID        REFERENCES users(id) ON DELETE SET NULL,  -- NULL = system
    actor_label  VARCHAR(120),                           -- snapshot of name at the time
    entity_type  VARCHAR(64) NOT NULL,                   -- "product", "order", ...
    entity_id    UUID,                                   -- may be NULL for bulk actions
    action       VARCHAR(32) NOT NULL,                   -- "create", "update", "delete",
                                                       -- "login", "logout", "export"
    changes      JSONB,                                  -- {"field": {"from": x, "to": y}}
    ip_address   INET,
    user_agent   TEXT,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_actor      ON audit_logs (actor_id, occurred_at DESC);
CREATE INDEX idx_audit_entity     ON audit_logs (entity_type, entity_id, occurred_at DESC);
CREATE INDEX idx_audit_action     ON audit_logs (action, occurred_at DESC);
CREATE INDEX idx_audit_occurred   ON audit_logs (occurred_at DESC);

-- -----------------------------------------------------------------
-- Development phases (Agile six-phase model)
-- -----------------------------------------------------------------
-- Phases: Planning, Design, Development, Testing, Deployment, Review
CREATE TABLE development_phases (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(40) UNIQUE NOT NULL
        CHECK (name IN ('planning', 'design', 'development',
                        'testing', 'deployment', 'review')),
    description TEXT,
    sort_order  INTEGER     NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-seed the six phases
INSERT INTO development_phases (name, sort_order, description) VALUES
    ('planning',     1, 'Requirements gathering, sprint planning, and backlog grooming.'),
    ('design',       2, 'UI/UX wireframes, architecture diagrams, and database design.'),
    ('development',  3, 'Implementation of features in code (frontend + backend).'),
    ('testing',      4, 'Unit tests, integration tests, and UAT with the client.'),
    ('deployment',   5, 'Release to staging/production and post-deploy verification.'),
    ('review',       6, 'Retrospective, client review, and feedback incorporation.');

-- -----------------------------------------------------------------
-- Sprints  +  sprint tasks
-- -----------------------------------------------------------------
-- A sprint is a 2-week Agile iteration. Sprint tasks map directly
-- to user stories / GitHub issues.
CREATE TABLE sprints (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(80) UNIQUE NOT NULL,            -- "Sprint 1 — Inventory MVP"
    goal        TEXT,
    start_date  DATE        NOT NULL,
    end_date    DATE        NOT NULL,
    status      VARCHAR(16) NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

CREATE TABLE sprint_tasks (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id    UUID        NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    phase_id     UUID        NOT NULL REFERENCES development_phases(id) ON DELETE RESTRICT,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    assignee_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
    story_points INTEGER     NOT NULL DEFAULT 0 CHECK (story_points >= 0),
    status       VARCHAR(16) NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'in_review', 'done', 'blocked')),
    priority     VARCHAR(16) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    github_issue_url TEXT,
    started_at   TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by   UUID        REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_sprint_tasks_sprint   ON sprint_tasks (sprint_id);
CREATE INDEX idx_sprint_tasks_assignee ON sprint_tasks (assignee_id);
CREATE INDEX idx_sprint_tasks_status   ON sprint_tasks (status);

-- Daily standup notes
CREATE TABLE sprint_standups (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id   UUID        NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    standup_date DATE       NOT NULL,
    author_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    yesterday   TEXT        NOT NULL,
    today       TEXT        NOT NULL,
    blockers    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (sprint_id, standup_date, author_id)
);

-- -----------------------------------------------------------------
-- Client feedback (admin/owner of Glassram)
-- -----------------------------------------------------------------
CREATE TABLE client_feedback (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    review_type   VARCHAR(24) NOT NULL
        CHECK (review_type IN ('sprint_review', 'uat', 'general', 'bug_report')),
    sprint_id     UUID        REFERENCES sprints(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(120) NOT NULL,
    reviewer_role VARCHAR(80),                          -- "Owner", "Admin", "Staff"
    rating        INTEGER     CHECK (rating BETWEEN 1 AND 5),
    summary       VARCHAR(200) NOT NULL,
    details       TEXT,
    status        VARCHAR(16) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'wont_fix')),
    resolved_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_feedback_status  ON client_feedback (status);
CREATE INDEX idx_feedback_sprint  ON client_feedback (sprint_id);
CREATE INDEX idx_feedback_type    ON client_feedback (review_type);

-- -----------------------------------------------------------------
-- Deployment history
-- -----------------------------------------------------------------
-- Records every release to staging/production. Populated by the
-- deploy pipeline (or by hand for hot-fixes).
CREATE TABLE deployments (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    environment    VARCHAR(16) NOT NULL
        CHECK (environment IN ('staging', 'production')),
    version_tag    VARCHAR(64) NOT NULL,                 -- "v0.3.1" or git SHA
    commit_sha     VARCHAR(40),
    branch         VARCHAR(80),
    deployed_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    status         VARCHAR(16) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'success', 'failed', 'rolled_back')),
    notes          TEXT,
    started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at    TIMESTAMPTZ,
    rollback_of    UUID        REFERENCES deployments(id) ON DELETE SET NULL
);
CREATE INDEX idx_deployments_env      ON deployments (environment, started_at DESC);
CREATE INDEX idx_deployments_status   ON deployments (status);
CREATE INDEX idx_deployments_commit   ON deployments (commit_sha);

-- -----------------------------------------------------------------
-- Test cases & runs
-- -----------------------------------------------------------------
CREATE TABLE test_cases (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(40) UNIQUE NOT NULL,            -- "TC-INV-001"
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    category    VARCHAR(24) NOT NULL
        CHECK (category IN ('unit', 'integration', 'e2e', 'uat')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE test_runs (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id  UUID        NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    deployment_id UUID        REFERENCES deployments(id) ON DELETE SET NULL,
    run_by        UUID        REFERENCES users(id) ON DELETE SET NULL,
    status        VARCHAR(16) NOT NULL
        CHECK (status IN ('passed', 'failed', 'skipped', 'errored')),
    duration_ms   INTEGER     CHECK (duration_ms >= 0),
    error_log     TEXT,
    ran_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_test_runs_case  ON test_runs (test_case_id, ran_at DESC);
CREATE INDEX idx_test_runs_dep   ON test_runs (deployment_id);

-- -----------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------
CREATE TRIGGER sprints_set_updated_at         BEFORE UPDATE ON sprints
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER sprint_tasks_set_updated_at    BEFORE UPDATE ON sprint_tasks
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER client_feedback_set_updated_at BEFORE UPDATE ON client_feedback
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER test_cases_set_updated_at      BEFORE UPDATE ON test_cases
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

COMMIT;
