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


-- Django Tables

-- Sites Tables

CREATE TABLE "django_site" (
  "id"     SERIAL       NOT NULL PRIMARY KEY,
  "domain" VARCHAR(100) NOT NULL,
  "name"   VARCHAR(50)  NOT NULL
);

-- Content Type Tables.

CREATE TABLE "django_content_type" (
  "id"        SERIAL       NOT NULL PRIMARY KEY,
  "name"      VARCHAR(100) NOT NULL,
  "app_label" VARCHAR(100) NOT NULL,
  "model"     VARCHAR(100) NOT NULL,
  UNIQUE ("app_label", "model")
);

CREATE TABLE "auth_permission" (
  "id"              SERIAL       NOT NULL PRIMARY KEY,
  "name"            VARCHAR(50)  NOT NULL,
  "content_type_id" INTEGER      NOT NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED,
  "codename"        VARCHAR(100) NOT NULL,
  UNIQUE ("content_type_id", "codename")
);
CREATE TABLE "auth_group_permissions" (
  "id"            SERIAL  NOT NULL PRIMARY KEY,
  "group_id"      INTEGER NOT NULL,
  "permission_id" INTEGER NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED,
  UNIQUE ("group_id", "permission_id")
);
CREATE TABLE "auth_group" (
  "id"   SERIAL      NOT NULL PRIMARY KEY,
  "name" VARCHAR(80) NOT NULL UNIQUE
);
ALTER TABLE "auth_group_permissions" ADD CONSTRAINT "group_id_refs_id_f4b32aac" FOREIGN KEY ("group_id") REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE "auth_user_groups" (
  "id"       SERIAL  NOT NULL PRIMARY KEY,
  "user_id"  INTEGER NOT NULL,
  "group_id" INTEGER NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED,
  UNIQUE ("user_id", "group_id")
);
CREATE TABLE "auth_user_user_permissions" (
  "id"            SERIAL  NOT NULL PRIMARY KEY,
  "user_id"       INTEGER NOT NULL,
  "permission_id" INTEGER NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED,
  UNIQUE ("user_id", "permission_id")
);
CREATE TABLE "auth_user" (
  "id"           SERIAL                   NOT NULL PRIMARY KEY,
  "password"     VARCHAR(128)             NOT NULL,
  "last_login"   TIMESTAMP WITH TIME ZONE NOT NULL,
  "is_superuser" BOOLEAN                  NOT NULL,
  "username"     VARCHAR(30)              NOT NULL UNIQUE,
  "first_name"   VARCHAR(30)              NOT NULL,
  "last_name"    VARCHAR(30)              NOT NULL,
  "email"        VARCHAR(75)              NOT NULL,
  "is_staff"     BOOLEAN                  NOT NULL,
  "is_active"    BOOLEAN                  NOT NULL,
  "date_joined"  TIMESTAMP WITH TIME ZONE NOT NULL
);
ALTER TABLE "auth_user_groups" ADD CONSTRAINT "user_id_refs_id_40c41112" FOREIGN KEY ("user_id") REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "auth_user_user_permissions" ADD CONSTRAINT "user_id_refs_id_4dc23c39" FOREIGN KEY ("user_id") REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX "auth_permission_content_type_id" ON "auth_permission" ("content_type_id");
CREATE INDEX "auth_group_name_like" ON "auth_group" ("name" varchar_pattern_ops);
CREATE INDEX "auth_user_username_like" ON "auth_user" ("username" varchar_pattern_ops);

-- Sessions Tables.

CREATE TABLE "django_session" (
  "session_key"  VARCHAR(40)              NOT NULL PRIMARY KEY,
  "session_data" TEXT                     NOT NULL,
  "expire_date"  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX "django_session_session_key_like" ON "django_session" ("session_key" varchar_pattern_ops);
CREATE INDEX "django_session_expire_date" ON "django_session" ("expire_date");

END TRANSACTION ;
