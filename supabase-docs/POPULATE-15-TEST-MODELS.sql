-- ============================================
-- POPULATE 15 TEST MODEL ACCOUNTS
-- Automatski popunjava sve podatke za testne naloge 1-15
-- ============================================

-- Lista gradova
DO $$
DECLARE
  test_cities text[] := ARRAY['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'];
  test_names text[] := ARRAY['Luna', 'Mia', 'Sofia', 'Emma', 'Aria', 'Zara', 'Nina', 'Lola', 'Bella', 'Ruby', 'Maya', 'Ivy', 'Lexi', 'Jade', 'Chloe'];
  test_ethnicities text[] := ARRAY['European', 'Latin', 'Asian', 'Mixed', 'African'];
  test_nationalities text[] := ARRAY['Switzerland', 'Germany', 'France', 'Italy', 'Spain', 'Brazil', 'Romania', 'Poland', 'Russia', 'Ukraine'];
  test_hair_colors text[] := ARRAY['Blonde', 'Brown', 'Black', 'Red', 'Auburn'];
  test_eye_colors text[] := ARRAY['Blue', 'Brown', 'Green', 'Hazel', 'Grey'];
  
  user_record RECORD;
  model_count INT := 0;
  model_id UUID;
  showname TEXT;
  city TEXT;
  ethnicity TEXT;
  nationality TEXT;
  hair_color TEXT;
  eye_color TEXT;
  age INT;
  height_cm INT;
  weight_kg INT;
  bust_cm INT;
  waist_cm INT;
  hip_cm INT;
BEGIN
  -- Loop through auth.users where email starts with '1' through '15'
  FOR user_record IN 
    SELECT id, email 
    FROM auth.users 
    WHERE email ~ '^[1-9]@' OR email ~ '^1[0-5]@'
    ORDER BY email
    LIMIT 15
  LOOP
    model_count := model_count + 1;
    model_id := user_record.id;
    
    -- Generate test data
    showname := test_names[((model_count - 1) % 15) + 1];
    city := test_cities[((model_count - 1) % 5) + 1];
    ethnicity := test_ethnicities[((model_count - 1) % 5) + 1];
    nationality := test_nationalities[((model_count - 1) % 10) + 1];
    hair_color := test_hair_colors[((model_count - 1) % 5) + 1];
    eye_color := test_eye_colors[((model_count - 1) % 5) + 1];
    age := 20 + (model_count % 10);
    height_cm := 160 + (model_count * 2);
    weight_kg := 50 + model_count;
    bust_cm := 85 + (model_count % 10);
    waist_cm := 60 + (model_count % 5);
    hip_cm := 90 + (model_count % 8);
    
    RAISE NOTICE 'Processing model % with email %', model_count, user_record.email;
    
    -- 1. Update profiles
    UPDATE profiles 
    SET 
      username = 'model' || model_count,
      role = 'model',
      is_verified = true,
      profile_status = 'active',
      updated_at = now()
    WHERE id = model_id;
    
    -- 2. Insert/Update model_details
    INSERT INTO model_details (
      model_id,
      showname,
      ethnicity,
      nationality,
      age,
      hair_color,
      eye_color,
      height_cm,
      weight_kg,
      dress_size,
      bust_cm,
      waist_cm,
      hip_cm,
      pubic_hair,
      smoking,
      drinking,
      special_characteristics,
      about_me,
      city,
      incall_options,
      outcall_options,
      sexual_orientation,
      services_for,
      created_at,
      updated_at
    ) VALUES (
      model_id,
      showname,
      ethnicity::ethnicity_type,
      nationality,
      age,
      hair_color::hair_color_type,
      eye_color::eye_color_type,
      height_cm,
      weight_kg,
      'S',
      bust_cm,
      waist_cm,
      hip_cm,
      'Shaved'::pubic_hair_type,
      'No'::smoking_type,
      'Socially'::drinking_type,
      'Tattoos on arm',
      'Hello! I am ' || showname || ', a professional escort offering premium companionship services. I am passionate about creating unforgettable moments and providing exceptional experiences. Discreet, elegant, and always professional.',
      city,
      ARRAY['Private Apartment', 'Hotel'],
      ARRAY['Hotel Visit', 'Home Visit'],
      'Heterosexual'::sexual_orientation_type,
      ARRAY['Men', 'Couples'],
      now(),
      now()
    )
    ON CONFLICT (model_id) 
    DO UPDATE SET
      showname = EXCLUDED.showname,
      ethnicity = EXCLUDED.ethnicity,
      nationality = EXCLUDED.nationality,
      age = EXCLUDED.age,
      hair_color = EXCLUDED.hair_color,
      eye_color = EXCLUDED.eye_color,
      height_cm = EXCLUDED.height_cm,
      weight_kg = EXCLUDED.weight_kg,
      dress_size = EXCLUDED.dress_size,
      bust_cm = EXCLUDED.bust_cm,
      waist_cm = EXCLUDED.waist_cm,
      hip_cm = EXCLUDED.hip_cm,
      pubic_hair = EXCLUDED.pubic_hair,
      smoking = EXCLUDED.smoking,
      drinking = EXCLUDED.drinking,
      special_characteristics = EXCLUDED.special_characteristics,
      about_me = EXCLUDED.about_me,
      city = EXCLUDED.city,
      incall_options = EXCLUDED.incall_options,
      outcall_options = EXCLUDED.outcall_options,
      sexual_orientation = EXCLUDED.sexual_orientation,
      services_for = EXCLUDED.services_for,
      updated_at = now();
    
    -- 3. Insert model_languages
    DELETE FROM model_languages WHERE model_id = model_id;
    INSERT INTO model_languages (model_id, language, level, created_at)
    VALUES 
      (model_id, 'English', 'fluent'::language_level_type, now()),
      (model_id, 'German', 'good'::language_level_type, now());
    
    -- 4. Insert model_working_hours (24/7)
    DELETE FROM model_working_hours WHERE model_id = model_id;
    INSERT INTO model_working_hours (model_id, schedule_type, created_at)
    VALUES (model_id, '24_7'::schedule_type, now());
    
    -- 5. Insert model_rates
    DELETE FROM model_rates WHERE model_id = model_id;
    INSERT INTO model_rates (model_id, rate_type, duration, amount, custom_time, custom_unit, created_at)
    VALUES 
      (model_id, 'incall'::rate_type, '30_minutes', 200, null, null, now()),
      (model_id, 'incall'::rate_type, '1_hour', 350, null, null, now()),
      (model_id, 'outcall'::rate_type, '1_hour', 400, null, null, now()),
      (model_id, 'outcall'::rate_type, '2_hours', 700, null, null, now());
    
    -- 6. Insert model_contact_details
    INSERT INTO model_contact_details (
      model_id,
      show_phone_number,
      country_code,
      phone_number,
      has_viber,
      has_whatsapp,
      has_telegram,
      contact_instruction,
      no_withheld_numbers,
      other_instructions,
      created_at,
      updated_at
    ) VALUES (
      model_id,
      true,
      '+41',
      '7612345' || LPAD(model_count::text, 2, '0'),
      true,
      true,
      false,
      'sms_and_call'::contact_instruction_type,
      true,
      'Please be respectful and professional.',
      now(),
      now()
    )
    ON CONFLICT (model_id)
    DO UPDATE SET
      show_phone_number = EXCLUDED.show_phone_number,
      country_code = EXCLUDED.country_code,
      phone_number = EXCLUDED.phone_number,
      has_viber = EXCLUDED.has_viber,
      has_whatsapp = EXCLUDED.has_whatsapp,
      has_telegram = EXCLUDED.has_telegram,
      contact_instruction = EXCLUDED.contact_instruction,
      no_withheld_numbers = EXCLUDED.no_withheld_numbers,
      other_instructions = EXCLUDED.other_instructions,
      updated_at = now();
    
    -- 7. Insert model_services (sample services)
    DELETE FROM model_services WHERE model_id = model_id;
    INSERT INTO model_services (model_id, service_name, created_at)
    SELECT model_id, service_name, now()
    FROM (VALUES 
      ('Kissing'),
      ('GFE (Girlfriend Experience)'),
      ('Erotic Massage'),
      ('French Kissing'),
      ('69 Position'),
      ('Oral Without Condom'),
      ('CIM (Come in Mouth)'),
      ('Anal Sex'),
      ('Couple'),
      ('Striptease')
    ) AS services(service_name);
    
    RAISE NOTICE 'Completed model % - % (%) in %', model_count, showname, user_record.email, city;
  END LOOP;
  
  RAISE NOTICE 'Successfully populated % test models', model_count;
END $$;

-- Verify results
SELECT 
  p.username,
  p.role,
  p.is_verified,
  p.profile_status,
  md.showname,
  md.city,
  md.age,
  md.ethnicity
FROM profiles p
LEFT JOIN model_details md ON p.id = md.model_id
WHERE p.username LIKE 'model%'
ORDER BY p.username;
