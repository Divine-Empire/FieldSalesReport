-- ==============================================================================
-- FIELD SALES REPORT - SUPABASE DATABASE MIGRATION SCRIPT
-- ==============================================================================
-- Tables:
--   1. field_sales_form (Parent table with UUID pk and auto-generated SN-XXXX)
--   2. fos_contact_persons (Child table, 1 to N, FK to field_sales_form)
--   3. fos_projects (Child table, 1 to N, FK to field_sales_form)
-- Storage:
--   - Bucket: field_sales_attachments (Public access with anon upload)
-- Dropdown Seeding:
--   - Table: lto_dropdown (fos_sales_person_name, fos_type_of_visit, fos_designation, fos_nature_of_business)
-- Atomic RPC:
--   - submit_field_sales_report(form_payload, contacts_payload, projects_payload)
-- ==============================================================================

-- 1. Create Sequence for Serial Code (SN-0001, SN-0002, ...)
CREATE SEQUENCE IF NOT EXISTS field_sales_form_serial_seq START WITH 1 INCREMENT BY 1;

-- 2. Create Parent Table: field_sales_form
CREATE TABLE IF NOT EXISTS public.field_sales_form (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    sales_person_name TEXT NOT NULL,
    visit_datetime TEXT NOT NULL,
    city_location TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    visit_type TEXT NOT NULL,
    company_name TEXT,
    nature_of_business TEXT,
    has_enquiry TEXT,
    product_interested TEXT,
    quantity_required TEXT,
    enquiry_value TEXT,
    expected_purchase_time TEXT,
    order_probability TEXT,
    f2f_meeting_photo_url TEXT
);

-- 3. Trigger Function for Serial Code Auto-generation
CREATE OR REPLACE FUNCTION public.generate_field_sales_serial_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.serial_code IS NULL OR NEW.serial_code = '' THEN
        NEW.serial_code := 'SN-' || LPAD(nextval('public.field_sales_form_serial_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_field_sales_serial_code ON public.field_sales_form;
CREATE TRIGGER trigger_set_field_sales_serial_code
BEFORE INSERT ON public.field_sales_form
FOR EACH ROW
EXECUTE FUNCTION public.generate_field_sales_serial_code();

-- 4. Create Child Table: fos_contact_persons
CREATE TABLE IF NOT EXISTS public.fos_contact_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.field_sales_form(id) ON DELETE CASCADE,
    contact_order INT NOT NULL DEFAULT 1,
    designation TEXT,
    other_designation TEXT,
    contact_person_name TEXT,
    contact_person_mobile TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Child Table: fos_projects
CREATE TABLE IF NOT EXISTS public.fos_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.field_sales_form(id) ON DELETE CASCADE,
    project_order INT NOT NULL DEFAULT 1,
    project_name TEXT,
    project_location TEXT,
    nature_of_project TEXT,
    percentage_balance_work TEXT,
    project_value TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_fos_contacts_form_id ON public.fos_contact_persons(form_id);
CREATE INDEX IF NOT EXISTS idx_fos_projects_form_id ON public.fos_projects(form_id);
CREATE INDEX IF NOT EXISTS idx_field_sales_serial_code ON public.field_sales_form(serial_code);
CREATE INDEX IF NOT EXISTS idx_field_sales_created_at ON public.field_sales_form(created_at DESC);

-- 7. Row Level Security (RLS)
ALTER TABLE public.field_sales_form ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fos_contact_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fos_projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Allow anon insert on field_sales_form" ON public.field_sales_form;
DROP POLICY IF EXISTS "Allow anon select on field_sales_form" ON public.field_sales_form;
DROP POLICY IF EXISTS "Allow anon insert on fos_contact_persons" ON public.fos_contact_persons;
DROP POLICY IF EXISTS "Allow anon select on fos_contact_persons" ON public.fos_contact_persons;
DROP POLICY IF EXISTS "Allow anon insert on fos_projects" ON public.fos_projects;
DROP POLICY IF EXISTS "Allow anon select on fos_projects" ON public.fos_projects;

-- Submissions go through the SECURITY DEFINER RPC (submit_field_sales_report), so
-- anon needs NO direct table access. Direct INSERT/SELECT policies are intentionally
-- absent: client data (names, mobile numbers) must not be readable with the public anon key.
-- Reporting/dashboards should read via authenticated users or the service role.

-- 8. Storage Bucket: field_sales_attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('field_sales_attachments', 'field_sales_attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Allow public upload to field_sales_attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public view field_sales_attachments" ON storage.objects;

CREATE POLICY "Allow public upload to field_sales_attachments"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'field_sales_attachments');

-- No SELECT policy: the bucket is public, so known object URLs still load,
-- but anon cannot list/enumerate files through the API.

-- 9. Dropdown Seeding in lto_dropdown (Inserts if not already present)
INSERT INTO public.lto_dropdown (category, value)
VALUES
  -- Sales Person Names
  ('fos_sales_person_name', 'PRANAV VINAYAKRAO BHOGAWAR'),
  ('fos_sales_person_name', 'RANJAN KUMAR PRUSTY'),
  ('fos_sales_person_name', 'SAMBIT MAHAPATRA'),
  ('fos_sales_person_name', 'AMAN JHA'),
  ('fos_sales_person_name', 'HIRU RAM NISHAD'),
  ('fos_sales_person_name', 'KANDUKURI SRIKANTH'),
  ('fos_sales_person_name', 'ARNAB BORDOLOI'),
  ('fos_sales_person_name', 'PRAKHAR SHARMA'),

  -- Type of Visit
  ('fos_type_of_visit', 'New F2F'),
  ('fos_type_of_visit', 'Existing F2F'),
  ('fos_type_of_visit', 'MDO F2F'),

  -- Designations
  ('fos_designation', 'Owner'),
  ('fos_designation', 'Project Manager'),
  ('fos_designation', 'Purchase'),
  ('fos_designation', 'QC'),
  ('fos_designation', 'Surveyor'),
  ('fos_designation', 'Site Supervisor'),
  ('fos_designation', 'Other'),

  -- Nature of Business
  ('fos_nature_of_business', 'Bridge'),
  ('fos_nature_of_business', 'Building'),
  ('fos_nature_of_business', 'Consultant'),
  ('fos_nature_of_business', 'Industrial Civil'),
  ('fos_nature_of_business', 'Rail'),
  ('fos_nature_of_business', 'Resellers'),
  ('fos_nature_of_business', 'Road')
ON CONFLICT DO NOTHING;

-- 9b. Project / Enquiry dropdowns (created_at offset keeps the display order; app orders by created_at)
INSERT INTO public.lto_dropdown (category, value, created_at)
SELECT v.category, v.value, now() + (v.ord * interval '1 millisecond')
FROM (VALUES
  ('fos_nature_of_project', 'Bridge', 1),
  ('fos_nature_of_project', 'Building', 2),
  ('fos_nature_of_project', 'Industrial Civil', 3),
  ('fos_nature_of_project', 'Mines', 4),
  ('fos_nature_of_project', 'Rail', 5),
  ('fos_nature_of_project', 'Road', 6),
  ('fos_nature_of_project', 'Other', 7),

  ('fos_product_interested', 'LAB EQUIPMENT', 1),
  ('fos_product_interested', 'BENDING', 2),
  ('fos_product_interested', 'CUTTING', 3),
  ('fos_product_interested', 'ROLLER', 4),
  ('fos_product_interested', 'SRP', 5),
  ('fos_product_interested', 'MINI CRANE', 6),
  ('fos_product_interested', 'AUTOLEVEL', 7),
  ('fos_product_interested', 'TOTAL STATION', 8),
  ('fos_product_interested', 'OTHER', 9)
) AS v(category, value, ord)
ON CONFLICT (category, value) DO NOTHING;

-- 10. Atomic Multi-Table Submission Function (RPC)
CREATE OR REPLACE FUNCTION public.submit_field_sales_report(
  form_payload JSONB,
  contacts_payload JSONB DEFAULT '[]'::JSONB,
  projects_payload JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB AS $$
DECLARE
  new_form_id UUID;
  new_serial_code TEXT;
  contact_elem JSONB;
  project_elem JSONB;
  idx INT;
BEGIN
  -- 0. Server-side validation (client checks can be bypassed with the public anon key)
  IF jsonb_typeof(form_payload) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'form_payload must be a JSON object';
  END IF;
  IF COALESCE(form_payload->>'sales_person_name', '') = ''
     OR COALESCE(form_payload->>'visit_type', '') = ''
     OR COALESCE(form_payload->>'city_location', '') = '' THEN
    RAISE EXCEPTION 'sales_person_name, visit_type and city_location are required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.lto_dropdown
                 WHERE category = 'fos_sales_person_name' AND value = form_payload->>'sales_person_name') THEN
    RAISE EXCEPTION 'Unknown sales person';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.lto_dropdown
                 WHERE category = 'fos_type_of_visit' AND value = form_payload->>'visit_type') THEN
    RAISE EXCEPTION 'Unknown visit type';
  END IF;
  IF jsonb_typeof(contacts_payload) IS DISTINCT FROM 'array' OR jsonb_array_length(contacts_payload) > 4
     OR jsonb_typeof(projects_payload) IS DISTINCT FROM 'array' OR jsonb_array_length(projects_payload) > 4 THEN
    RAISE EXCEPTION 'contacts/projects must be arrays with at most 4 entries';
  END IF;
  IF length(form_payload::TEXT) > 20000 OR length(contacts_payload::TEXT) > 10000
     OR length(projects_payload::TEXT) > 20000 THEN
    RAISE EXCEPTION 'Payload too large';
  END IF;

  -- 1. Insert parent form
  INSERT INTO public.field_sales_form (
    sales_person_name,
    visit_datetime,
    city_location,
    latitude,
    longitude,
    visit_type,
    company_name,
    nature_of_business,
    has_enquiry,
    product_interested,
    quantity_required,
    enquiry_value,
    expected_purchase_time,
    order_probability,
    f2f_meeting_photo_url
  ) VALUES (
    form_payload->>'sales_person_name',
    form_payload->>'visit_datetime',
    form_payload->>'city_location',
    NULLIF(form_payload->>'latitude', '')::DOUBLE PRECISION,
    NULLIF(form_payload->>'longitude', '')::DOUBLE PRECISION,
    form_payload->>'visit_type',
    form_payload->>'company_name',
    form_payload->>'nature_of_business',
    form_payload->>'has_enquiry',
    form_payload->>'product_interested',
    form_payload->>'quantity_required',
    form_payload->>'enquiry_value',
    form_payload->>'expected_purchase_time',
    form_payload->>'order_probability',
    form_payload->>'f2f_meeting_photo_url'
  )
  RETURNING id, serial_code INTO new_form_id, new_serial_code;

  -- 2. Insert contacts
  idx := 1;
  FOR contact_elem IN SELECT * FROM jsonb_array_elements(contacts_payload)
  LOOP
    INSERT INTO public.fos_contact_persons (
      form_id,
      contact_order,
      designation,
      other_designation,
      contact_person_name,
      contact_person_mobile
    ) VALUES (
      new_form_id,
      idx,
      contact_elem->>'designation',
      contact_elem->>'other_designation',
      contact_elem->>'contact_person_name',
      contact_elem->>'contact_person_mobile'
    );
    idx := idx + 1;
  END LOOP;

  -- 3. Insert projects
  idx := 1;
  FOR project_elem IN SELECT * FROM jsonb_array_elements(projects_payload)
  LOOP
    INSERT INTO public.fos_projects (
      form_id,
      project_order,
      project_name,
      project_location,
      nature_of_project,
      percentage_balance_work,
      project_value,
      remarks
    ) VALUES (
      new_form_id,
      idx,
      project_elem->>'project_name',
      project_elem->>'project_location',
      project_elem->>'nature_of_project',
      project_elem->>'percentage_balance_work',
      project_elem->>'project_value',
      project_elem->>'remarks'
    );
    idx := idx + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'id', new_form_id,
    'serial_code', new_serial_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.submit_field_sales_report(JSONB, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_field_sales_report(JSONB, JSONB, JSONB) TO anon, authenticated;
