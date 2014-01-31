-- Create the items related tables.

-- Track acquisitions by identity.
CREATE TABLE identity_acquisitions (
    uuid                UUID        PRIMARY KEY,    -- Primary key.
    acquisition_uuid    UUID        NOT NULL,       -- The acquisition.
    identity            VARCHAR(32) NOT NULL,       -- The identity.
    user_uuid           UUID,       NOT NULL,       -- The user that initiated the acquisition.
    created             TIMESTAMP   NOT NULL        -- Date/time the acquisition was initiated.
    CONSTRAINT identity_acqusitions__acquisition_uuid_identity__unique UNIQUE (acquisition_uuid, identity)
);

-- UAC Comments.
CREATE TABLE comments (
    uuid                UUID        PRIMARY KEY,    -- Primary key.
    comment             TEXT        NOT NULL,       -- The comment.
    created             TIMESTAMP   NOT NULL        -- Date/time comment was created.
);

-- Track comments by identity.
CREATE TABLE identity_comments (
    uuid                UUID        PRIMARY KEY,    -- The primary key.
    identity_uuid       VARCHAR(32) NOT NULL,       -- The corresponding identity.
    comment_uuid        UUID        NOT NULL,       -- The corresponding comment.
    CONSTRAINT identity_comments__identity_comment__unique UNIQUE (identity_uuid, comment_uuid)
);

--CREATE TABLE audit_events (
--    uuid                UUID        PRIMARY KEY,
--    created             TIMESTAMP   NOT NULL,
--    item_type           VARCHAR(10) NOT NULL, -- IDENTITY, ACQUISITION, HOST, SUPPRESSION
--    item_uuid           UUID        NOT NULL
--);