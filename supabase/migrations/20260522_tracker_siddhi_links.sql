-- Add siddhi_id FK to tracker tables so items can be linked to goal milestones
-- ON DELETE SET NULL: deleting a Siddhi just unlinks the item, doesn't delete it

ALTER TABLE vritti_projects ADD COLUMN IF NOT EXISTS siddhi_id UUID REFERENCES siddhis(id) ON DELETE SET NULL;
ALTER TABLE books            ADD COLUMN IF NOT EXISTS siddhi_id UUID REFERENCES siddhis(id) ON DELETE SET NULL;
ALTER TABLE vidya_courses    ADD COLUMN IF NOT EXISTS siddhi_id UUID REFERENCES siddhis(id) ON DELETE SET NULL;
ALTER TABLE naada_courses    ADD COLUMN IF NOT EXISTS siddhi_id UUID REFERENCES siddhis(id) ON DELETE SET NULL;
