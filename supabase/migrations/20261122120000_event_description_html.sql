-- Rendered HTML cache for events.description (markdown source of truth).
-- Written by the server at save time; nullable until the first save after this migration.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS description_html text;
