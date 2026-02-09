-- WARNING: Ovaj fajl je za kontekst/pregled. Nije namenjen direktnom pokretanju.
-- Za punu strukturu eksportuj iz Supabase: Table Editor → Copy as SQL ili Schema diff.
-- Poslednje ažuriranje: 2025-01-27

-- Tabele u public (pregled):
-- cities, club_amenities, club_contact_details, club_details, club_photos, club_videos,
-- club_working_hours, daily_statistics, model_contact_details, model_details, model_languages,
-- model_photos, model_rates, model_services, model_videos, model_working_hours,
-- order_items, orders, products, profile_statistics, profiles, services, verifications, view_logs

-- Ključne veze:
-- profiles.id → FK u: model_details, orders, club_*, model_photos, verifications, ...
-- orders.user_id → profiles.id; orders.id → order_items.order_id
-- model_details.model_id, model_photos.model_id → profiles.id
-- products.id → order_items.product_id
