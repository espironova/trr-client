
-- Operating hours column
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS operating_hours text;

-- Audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.audit_log FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit log"
ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (true);

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN row_to_json(OLD) END,
      'new', CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN row_to_json(NEW) END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_activities AFTER INSERT OR UPDATE OR DELETE ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_categories AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.log_audit();
