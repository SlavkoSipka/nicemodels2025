-- ============================================================
-- Provera: gradovi / PLZ i dodela kantona (cities.canton)
-- Pokreni u Supabase SQL Editor
-- ============================================================

-- 1) Koliko redova po kantonu (26 CH + FL za LI + eventualno prazno)
SELECT canton, COUNT(*) AS rows
FROM cities
WHERE is_active = true
GROUP BY canton
ORDER BY canton NULLS LAST;

-- 2) Redovi bez kantona (trebalo bi da bude 0 ili vrlo malo)
SELECT COUNT(*) AS missing_canton
FROM cities
WHERE is_active = true AND (canton IS NULL OR canton = '');

-- 3) Nepoznati kodovi kantona (sve što NIJE u zvaničnoj listi 26)
--    Ako ovde ima redova, ispravi podatke ili proširi listu u aplikaciji
WITH valid_canton(c) AS (
  VALUES
    ('AG'),('AI'),('AR'),('BE'),('BL'),('BS'),('FR'),('GE'),('FL'),('GL'),('GR'),
    ('JU'),('LU'),('NE'),('NW'),('OW'),('SG'),('SH'),('SO'),('SZ'),('TG'),
    ('TI'),('UR'),('VD'),('VS'),('ZG'),('ZH')
)
SELECT DISTINCT ci.canton, COUNT(*) AS n
FROM cities ci
WHERE ci.is_active = true
  AND ci.canton IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM valid_canton WHERE valid_canton.c = ci.canton)
GROUP BY ci.canton;

-- 4) Duplikati istog (name, postal_code) – ne bi smelo da bude
SELECT name, postal_code, COUNT(*) AS n
FROM cities
WHERE is_active = true
GROUP BY name, postal_code
HAVING COUNT(*) > 1;

-- 5) Isti naziv mesta u različitim kantonima (normalno u CH) – ručno uzorkuj
SELECT name, array_agg(DISTINCT canton ORDER BY canton) AS cantons, COUNT(DISTINCT canton)::int AS n_cantons
FROM cities
WHERE is_active = true
GROUP BY name
HAVING COUNT(DISTINCT canton) > 1
ORDER BY n_cantons DESC, name
LIMIT 30;

-- 6) Slučajni uzorak: PLZ + grad + kanton (vizuelna provera)
SELECT city.name, city.postal_code, city.canton
FROM cities city
WHERE city.is_active = true
ORDER BY random()
LIMIT 40;
