-- Table: public.Users

-- DROP TABLE IF EXISTS public."Users";

CREATE TABLE IF NOT EXISTS public."Users"
(
    id serial PRIMARY KEY,
    username character varying COLLATE pg_catalog."default",
    tg_id bigint,
    schedule_id integer
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Users"
    OWNER to postgres;/* Replace with your SQL commands */