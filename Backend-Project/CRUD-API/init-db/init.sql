CREATE TABLE IF NOT EXISTS tasks(
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false

); 
-- we used serial here because it auto increments it foe you a new way yo do it is id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY

INSERT INTO tasks (title, done) VALUES
  ('Learn TypeScript', false),
  ('Build a CRUD API', false),
  ('Test with Swagger', true);