-- ==============================================================================
-- MIGRATION 002 - Security hardening + test data cleanup
-- Run in Supabase Dashboard -> SQL Editor, in this order:
--   Step A: this file
--   Step B: the "10. Atomic Multi-Table Submission Function (RPC)" section of
--           supabase/schema.sql (CREATE OR REPLACE FUNCTION ... + REVOKE/GRANT)
-- ==============================================================================

-- 1. Remove public read/insert access to tables (form uses the SECURITY DEFINER RPC only)
DROP POLICY IF EXISTS "Allow anon insert on field_sales_form" ON public.field_sales_form;
DROP POLICY IF EXISTS "Allow anon select on field_sales_form" ON public.field_sales_form;
DROP POLICY IF EXISTS "Allow anon insert on fos_contact_persons" ON public.fos_contact_persons;
DROP POLICY IF EXISTS "Allow anon select on fos_contact_persons" ON public.fos_contact_persons;
DROP POLICY IF EXISTS "Allow anon insert on fos_projects" ON public.fos_projects;
DROP POLICY IF EXISTS "Allow anon select on fos_projects" ON public.fos_projects;

-- 2. Stop anon from listing storage objects (public URLs keep working)
DROP POLICY IF EXISTS "Allow public view field_sales_attachments" ON storage.objects;

-- 3. Remove the test submission (children are removed via ON DELETE CASCADE)
DELETE FROM public.field_sales_form
WHERE serial_code = 'SN-0001' AND sales_person_name = 'TEST PERSON' AND company_name = 'Test Corp';

-- 4. Restart numbering so the first real report is SN-0001
--    (only safe while the table is empty - guarded below)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.field_sales_form) THEN
    PERFORM setval('public.field_sales_form_serial_seq', 1, false);
  END IF;
END $$;
