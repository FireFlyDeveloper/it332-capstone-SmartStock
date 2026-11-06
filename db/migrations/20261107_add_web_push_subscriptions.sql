-- Persist browser Web Push subscriptions per authenticated SmartStock user.
CREATE TABLE IF NOT EXISTS web_push_subscriptions (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint          TEXT        NOT NULL UNIQUE,
    subscription_json JSONB       NOT NULL,
    preferences_json  JSONB       NOT NULL DEFAULT '{"lowStockAlerts":true,"orderStatusUpdates":true,"deliveryDispatches":true}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_web_push_subscriptions_user
    ON web_push_subscriptions (user_id);
