-- Create the items related tables.

CREATE TABLE identity_acquisitions (
    uuid                UUID        PRIMARY KEY,
    acquisition_uuid    UUID        NOT NULL,
    identity            UUID,
    user_uuid           UUID,       NOT NULL,
    created             TIMESTAMP   NOT NULL,
    status              UUID        NOT NULL
);

CREATE TABLE comments (
    uuid                UUID        PRIMARY KEY,
    item_uuid           UUID        NOT NULL,
    type                VARCHAR(10) NOT NULL,
    comment             TEXT        NOT NULL,
    created             TIMESTAMP   NOT NULL
);

CREATE TABLE audit_events (
    uuid                UUID        PRIMARY KEY,
    created             TIMESTAMP   NOT NULL,
    item_type           VARCHAR(10) NOT NULL, -- IDENTITY, ACQUISITION, HOST, SUPPRESSION
    item_uuid           UUID        NOT NULL
);