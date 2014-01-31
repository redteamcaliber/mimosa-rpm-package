--
-- Create the UAC database tables.
--

-- NOTE: This script should be run as uac_user.

\set ON_ERROR_STOP 1

BEGIN TRANSACTION;


-- IOC Terms Reference Data.
CREATE TABLE iocterms (
  uuid                  UUID        NOT NULL PRIMARY KEY,
  data_type             TEXT        NOT NULL,
  source                TEXT        NOT NULL,
  text                  TEXT        NOT NULL UNIQUE,
  text_prefix           TEXT        NOT NULL,
  title                 TEXT        NOT NULL UNIQUE
);
CREATE INDEX ioc_terms_text ON iocterms (text);

-- Store user preferences.
CREATE TABLE user_preferences (
    uuid                UUID        NOT NULL PRIMARY KEY,
    uid                 TEXT        NOT NULL,
    key                 TEXT        NOT NULL,
    data                TEXT        NOT NULL,
    CONSTRAINT user_preferences__uid_key_data__unique UNIQUE (uid, key, data)
);
CREATE INDEX user_preferences_user ON user_preferences (uid);

-- Track acquisitions by identity.
CREATE TABLE identity_acquisitions (
    uuid                UUID        PRIMARY KEY,    -- Primary key.
    identity            VARCHAR(32) NOT NULL,       -- The identity.
    acquisition_uuid    UUID        NOT NULL,       -- The acquisition.
    user_uuid           UUID        NOT NULL,       -- The user that initiated the acquisition.
    uid                 TEXT        NOT NULL,       -- The users uid that initiated the acquisition.
    created             TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT identity_acquisitions__acquisition_uuid_identity__unique UNIQUE (acquisition_uuid, identity)
);

-- UAC Comments.
CREATE TABLE comments (
    uuid                UUID        PRIMARY KEY,    -- Primary key.
    comment             TEXT        NOT NULL,       -- The comment.
    created             TIMESTAMP   NOT NULL DEFAULT now()
);

-- Track comments by identity.
CREATE TABLE identity_comments (
    uuid                UUID        PRIMARY KEY,    -- The primary key.
    identity_uuid       VARCHAR(32) NOT NULL,       -- The corresponding identity.
    comment_uuid        UUID        NOT NULL,       -- The corresponding comment.
    CONSTRAINT identity_comments__identity_comment__unique UNIQUE (identity_uuid, comment_uuid)
);

-- Track comments by acquisition.
CREATE TABLE acquisition_comments (
    uuid                UUID        PRIMARY KEY,
    acquisition_uuid    UUID        NOT NULL,
    comment_uuid        UUID        NOT NULL,
    CONSTRAINT acquisition_comments__acquisition_comment__unique UNIQUE (acquisition_uuid, comment_uuid)
);


END TRANSACTION ;
