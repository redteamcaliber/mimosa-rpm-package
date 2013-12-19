--
-- Create the UAC database tables.
--

-- NOTE: This script should be run as uac_user.

\set ON_ERROR_STOP 1

BEGIN TRANSACTION;

DROP TABLE IF EXISTS iocterms;

-- Create the UAC tables.
CREATE TABLE "iocterms" (
  "uuid"        UUID         NOT NULL PRIMARY KEY,
  "data_type"   VARCHAR(255) NOT NULL,
  "source"      VARCHAR(255) NOT NULL,
  "text"        VARCHAR(255) NOT NULL UNIQUE,
  "text_prefix" VARCHAR(255) NOT NULL,
  "title"       VARCHAR(255) NOT NULL UNIQUE
);
CREATE INDEX ioc_terms_text ON iocterms (text);

CREATE TABLE "user_preferences" (
  "uuid"  UUID         NOT NULL PRIMARY KEY,
  "uid"   VARCHAR(255) NOT NULL,
  "key"   VARCHAR(30)  NOT NULL,
  "value" VARCHAR(255) NOT NULL
);
CREATE INDEX user_preferences_user ON user_preferences (uid);

CREATE TABLE "content" (
    uuid        UUID            NOT NULL PRIMARY KEY,
    created     TIMESTAMP       NOT NULL DEFAULT now(),
    text        TEXT NOT NULL
);

END TRANSACTION ;
