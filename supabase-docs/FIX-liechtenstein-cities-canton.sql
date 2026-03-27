-- Liechtenstein (FL): PLZ 9485–9499 — nije švajcarski kanton.
-- Ako su redovi uvezani sa praznim canton, ovim ih vezujemo za regiju „FL“
-- (u aplikaciji: CANTON_NAMES.FL → „Liechtenstein“).

UPDATE cities
SET canton = 'FL'
WHERE is_active = true
  AND (canton IS NULL OR canton = '')
  AND postal_code >= '9485'
  AND postal_code <= '9499';

-- Provera:
-- SELECT name, postal_code, canton FROM cities WHERE canton = 'FL' ORDER BY postal_code;
