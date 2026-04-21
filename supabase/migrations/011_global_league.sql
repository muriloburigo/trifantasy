-- 1. Adiciona flag para identificar a liga global
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- 2. Cria a Liga Global (se não existir)
-- Buscamos o primeiro admin para ser o "dono" simbólico
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE is_admin = true LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    INSERT INTO leagues (name, invite_code, owner_id, is_public, is_global)
    VALUES ('Liga Global Trixer', 'GLOBAL', admin_id, true, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3. Função para inscrever usuário na liga global
CREATE OR REPLACE FUNCTION public.join_global_league()
RETURNS trigger AS $$
DECLARE
  global_league_id UUID;
BEGIN
  SELECT id INTO global_league_id FROM leagues WHERE is_global = true LIMIT 1;
  
  IF global_league_id IS NOT NULL THEN
    INSERT INTO league_members (league_id, user_id)
    VALUES (global_league_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger no perfil
DROP TRIGGER IF EXISTS on_profile_created_join_global ON profiles;
CREATE TRIGGER on_profile_created_join_global
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION join_global_league();

-- 5. Backfill: Inscrever todos os usuários atuais na liga global
DO $$
DECLARE
  global_id UUID;
BEGIN
  SELECT id INTO global_id FROM leagues WHERE is_global = true LIMIT 1;
  IF global_id IS NOT NULL THEN
    INSERT INTO league_members (league_id, user_id)
    SELECT global_id, id FROM profiles
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
