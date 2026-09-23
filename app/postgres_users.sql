--
-- PostgreSQL database cluster dump
--

\restrict JgiBuboH6vOoV0HxftFdaslNva7GD6eKXrLdll8E19cCgnD6Bw8RYlFVpUeT9kF

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE jaroskastore_user;
ALTER ROLE jaroskastore_user WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:Rb2jXZY/mCTLHKzqXb7FGA==$ILlFINLQJ9OmbRSh95OsK/cCNDKWZTDqEGyU6eyWh50=:CY9uOCbRXjE7S/XAZiLiEY3V2rnwIuUrGdeFqq1K+RE=';


