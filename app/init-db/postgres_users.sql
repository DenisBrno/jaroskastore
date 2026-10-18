DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'jaroskastore_user') THEN
    CREATE ROLE jaroskastore_user WITH LOGIN PASSWORD 'GiAx04Djnd';
  ELSE
    ALTER USER jaroskastore_user WITH PASSWORD 'GiAx04Djnd';
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE jaroskastore TO jaroskastore_user;
GRANT ALL ON SCHEMA public TO jaroskastore_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO jaroskastore_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO jaroskastore_user;