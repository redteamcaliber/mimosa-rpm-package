
\set ON_ERROR_STOP 1

BEGIN TRANSACTION;

CREATE TABLE activity (
    uuid                UUID        PRIMARY KEY,            -- Primary key.
    activity_type       TEXT        NOT NULL,               -- The type of activity.
    created             TIMESTAMP   NOT NULL DEFAULT now(), -- When the activity occurred.
    data                TEXT        NOT NULL                -- The activity data.
);

-- Track activity by alert.
CREATE TABLE alert_activity (
    uuid                UUID        PRIMARY KEY,            -- The primary key.
    alert_uuid          UUID        NOT NULL,               -- The ID of the alert.
    activity_uuid       UUID        NOT NULL,               -- The associated activity id.
    CONSTRAINT alert_activity__alert_activity__unique UNIQUE (alert_uuid, activity_uuid),
    CONSTRAINT alert_activity__alert_fk FOREIGN KEY (activity_uuid) REFERENCES activity(uuid) ON DELETE CASCADE
);

END TRANSACTION;