# Database schema reference

Generated on 2026-11-22 from the PostgREST (OpenAPI) description of the production database. It lists every table and view the API exposes, with column types, nullability, defaults and foreign keys. Row Level Security policies, triggers and indexes are not part of the API description; they are defined in the SQL scripts in `supabase-docs/`.

Regenerate this file after schema changes, as described in [database.md](database.md#schema-reference).

## Contents

- **Accounts**: [`deleted_accounts`](#deleted_accounts), [`online_status`](#online_status), [`profiles`](#profiles), [`verifications`](#verifications)
- **Models**: [`model_collaborations`](#model_collaborations), [`model_contact_details`](#model_contact_details), [`model_details`](#model_details), [`model_languages`](#model_languages), [`model_photos`](#model_photos), [`model_rates`](#model_rates), [`model_services`](#model_services), [`model_status_messages`](#model_status_messages), [`model_stories`](#model_stories), [`model_videos`](#model_videos), [`model_working_hours`](#model_working_hours)
- **Clubs**: [`club_amenities`](#club_amenities), [`club_analytics`](#club_analytics), [`club_contact_details`](#club_contact_details), [`club_details`](#club_details), [`club_invites`](#club_invites), [`club_photos`](#club_photos), [`club_videos`](#club_videos), [`club_working_hours`](#club_working_hours)
- **Jobs and rentals**: [`job_listing_photos`](#job_listing_photos), [`job_listing_services`](#job_listing_services), [`job_listings`](#job_listings)
- **Commerce and advertising**: [`banner_region_pricing`](#banner_region_pricing), [`banners`](#banners), [`order_items`](#order_items), [`orders`](#orders), [`products`](#products)
- **Messaging and notifications**: [`conversations`](#conversations), [`messages`](#messages), [`notifications`](#notifications)
- **Community**: [`discussion_posts`](#discussion_posts), [`discussion_topics`](#discussion_topics), [`favorites`](#favorites), [`model_comments`](#model_comments), [`photo_likes`](#photo_likes), [`reports`](#reports), [`saved_searches`](#saved_searches), [`story_views`](#story_views)
- **Analytics**: [`banner_clicks`](#banner_clicks), [`banner_impressions`](#banner_impressions), [`daily_statistics`](#daily_statistics), [`listing_clicks`](#listing_clicks), [`listing_views`](#listing_views), [`model_statistics`](#model_statistics), [`model_statistics_daily`](#model_statistics_daily), [`model_statistics_summary`](#model_statistics_summary), [`page_views`](#page_views), [`profile_statistics`](#profile_statistics), [`site_actions`](#site_actions), [`view_logs`](#view_logs)
- **Email**: [`email_log`](#email_log), [`email_unsubscribes`](#email_unsubscribes)
- **Reference data**: [`cities`](#cities), [`services`](#services)
- [Database functions (RPC)](#database-functions-rpc)

## Accounts

### deleted_accounts

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `original_user_id` | uuid | no |  |  |
| `email` | text | no |  |  |
| `username` | text | yes |  |  |
| `role` | text | yes |  |  |
| `reason` | text | yes |  |  |
| `deleted_by` | text | no | `self` |  |
| `snapshot` | jsonb | yes |  |  |
| `deleted_at` | timestamptz | no | `now()` |  |

### online_status

Tracks user online status and chat availability

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `user_id` | uuid | no |  | → profiles.id |
| `is_online` | boolean | yes | `false` |  |
| `is_available_for_chat` | boolean | yes | `false` |  |
| `last_seen_at` | timestamptz | yes | `now()` |  |
| `created_at` | timestamptz | yes | `now()` |  |
| `updated_at` | timestamptz | yes | `now()` |  |

### profiles

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no |  | PK |
| `email` | text | no |  |  |
| `username` | text | yes |  |  |
| `phone` | text | yes |  | Phone number — required at registration |
| `role` | app_role (user, model, company, admin) | no | `user` |  |
| `profile_status` | profile_status (pending, active, inactive, suspended) | no | `pending` |  |
| `onboarding_completed` | boolean | no | `false` |  |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | no | `now()` |  |
| `is_draft` | boolean | yes | `false` | True if profile created by club without auth account |
| `invited_email` | text | yes |  | Email to send registration invite to |
| `invite_token` | text | yes |  | Unique token for registration link |
| `invited_by` | uuid | yes |  | → profiles.id; Club/Agency that created this draft profile |
| `is_blocked` | boolean | yes | `false` |  |
| `blocked_at` | timestamptz | yes |  |  |
| `blocked_reason` | text | yes |  |  |
| `is_verified` | boolean | yes | `false` |  |
| `newsletter_enabled` | boolean | yes | `false` |  |
| `city` | text | yes |  | City/area for user profiles |
| `description` | text | yes |  | User bio/description |
| `public_id` | integer | yes |  |  |
| `avatar_url` | text | yes |  |  |
| `date_of_birth` | date | yes |  | Date of birth — required at registration for age verification (18+) |
| `first_name` | text | yes |  | Real first name — optional, only visible to the user themselves |
| `last_name` | text | yes |  | Real last name — optional, only visible to the user themselves |
| `is_active` | boolean | no | `true` |  |
| `tutorial_completed` | boolean | no | `false` |  |

### verifications

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `user_id` | uuid | no |  | → profiles.id |
| `first_name` | text | no |  |  |
| `surname` | text | no |  |  |
| `date_of_birth` | date | no |  |  |
| `id_number` | text | no |  |  |
| `id_card_photo_path` | text | no |  |  |
| `selfie_photo_path` | text | no |  |  |
| `video_path` | text | yes |  |  |
| `status` | text | no | `pending` |  |
| `submitted_at` | timestamptz | no | `now()` |  |
| `reviewed_at` | timestamptz | yes |  |  |
| `reviewed_by` | uuid | yes |  | → profiles.id |
| `rejection_reason` | text | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |

## Models

### model_collaborations

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `sender_id` | uuid | no |  | → profiles.id |
| `receiver_id` | uuid | no |  | → profiles.id |
| `status` | text | no | `pending` |  |
| `message` | text | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |
| `responded_at` | timestamptz | yes |  |  |

### model_contact_details

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `model_id` | uuid | no |  | → profiles.id |
| `show_phone_number` | boolean | yes | `false` |  |
| `country_code` | varchar | yes | `+41` |  |
| `phone_number` | varchar | yes |  |  |
| `has_viber` | boolean | yes | `false` |  |
| `has_whatsapp` | boolean | yes | `false` |  |
| `has_telegram` | boolean | yes | `false` |  |
| `contact_instruction` | contact_instruction_type (sms_and_call, sms_only, no_sms) | yes | `sms_and_call` |  |
| `no_withheld_numbers` | boolean | yes | `false` |  |
| `other_instructions` | text | yes |  |  |
| `created_at` | timestamptz | yes | `now()` |  |
| `updated_at` | timestamptz | yes | `now()` |  |
| `show_phone_on_card` | boolean | no | `false` |  |

### model_details

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `model_id` | uuid | no |  | → profiles.id |
| `showname` | text | yes |  |  |
| `slogan` | text | yes |  |  |
| `gender` | gender_type (female, male, trans) | yes |  |  |
| `ethnicity` | ethnicity_type (asian, black, caucasian_white, latin, mixed, indian, arab, caucasian) | yes |  |  |
| `nationality` | text | yes |  |  |
| `age` | integer | yes |  |  |
| `hair_color` | hair_color_type (blond, light_brown, brunette, black, red, other) | yes |  |  |
| `eye_color` | eye_color_type (black, brown, green, blue, gray) | yes |  |  |
| `height_cm` | integer | yes |  |  |
| `weight_kg` | numeric | yes |  |  |
| `dress_size` | dress_size_type (xs, s, m, l, xl, xxl) | yes |  |  |
| `bust_cm` | integer | yes |  |  |
| `waist_cm` | integer | yes |  |  |
| `hip_cm` | integer | yes |  |  |
| `pubic_hair` | pubic_hair_type (shaved_completely, shaved_mostly, trimmed, all_natural) | yes |  |  |
| `smoking` | yes_no_occasionally (yes, no, occasionally) | yes |  |  |
| `drinking` | yes_no_occasionally (yes, no, occasionally) | yes |  |  |
| `special_characteristics` | text | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | no | `now()` |  |
| `about_me` | text | yes |  |  |
| `city` | text | yes |  |  |
| `incall_options` | array | yes |  |  |
| `outcall_options` | array | yes |  |  |
| `sexual_orientation` | sexual_orientation_type (heterosexual, bisexual, homosexual) | yes |  |  |
| `services_for` | array | yes |  |  |
| `club_id` | uuid | yes |  | → profiles.id; Reference to the club/agency this model belongs to (NULL for independent models) |
| `chat_available` | boolean | no | `false` |  |
| `share_live_location` | boolean | yes | `false` |  |
| `live_location_city` | text | yes |  |  |
| `live_location_postal_code` | text | yes |  |  |
| `live_location_updated_at` | timestamptz | yes |  |  |
| `other_services` | text | yes |  |  |
| `zip_code` | text | yes |  |  |
| `street` | text | yes |  |  |
| `street_number` | text | yes |  |  |
| `sedcard_visible` | boolean | no | `true` |  |

### model_languages

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `model_id` | uuid | no |  | → profiles.id |
| `language` | text | no |  |  |
| `level` | language_level (basic, fair, good, excellent_native) | no |  |  |
| `created_at` | timestamptz | no | `now()` |  |

### model_photos

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `model_id` | uuid | no |  | → profiles.id |
| `file_path` | text | no |  |  |
| `file_name` | text | no |  |  |
| `uploaded_at` | timestamptz | yes | `now()` |  |
| `is_approved` | boolean | yes | `false` |  |
| `display_order` | integer | no | `0` |  |

### model_rates

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `model_id` | uuid | no |  | → profiles.id |
| `rate_type` | rate_type (incall, outcall) | no |  |  |
| `duration` | duration_type (30_minutes, 1_hour, 2_hours, specific_time, additional_hour, overnight, dinner_date, weekend) | no |  |  |
| `amount` | numeric | no |  |  |
| `currency` | varchar | yes | `CHF` |  |
| `created_at` | timestamptz | yes | `now()` |  |
| `updated_at` | timestamptz | yes | `now()` |  |
| `custom_time_value` | integer | yes |  |  |
| `custom_time_unit` | text | yes |  |  |

### model_services

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `model_id` | uuid | no |  | → profiles.id |
| `service_id` | uuid | no |  | → services.id |
| `created_at` | timestamptz | no | `now()` |  |

### model_status_messages

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `model_id` | uuid | no |  | → profiles.id |
| `message` | text | no |  |  |
| `is_active` | boolean | no | `true` |  |
| `created_at` | timestamptz | no | `now()` |  |
| `expires_at` | timestamptz | no | `(now() + '7 days'::interval)` |  |

### model_stories

Instagram-style stories for models - auto-expire after 24 hours

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `extensions.uuid_generate_v4()` | PK |
| `model_id` | uuid | no |  | → profiles.id |
| `media_type` | text | no |  |  |
| `media_url` | text | no |  |  |
| `thumbnail_url` | text | yes |  |  |
| `caption` | text | yes |  |  |
| `duration` | integer | yes | `5` | How long to show this story (seconds) - for images only |
| `created_at` | timestamptz | yes | `now()` |  |
| `expires_at` | timestamptz | yes | `(now() + '24:00:00'::interval)` | Story automatically becomes inactive after this time |
| `views_count` | integer | yes | `0` |  |
| `is_active` | boolean | yes | `true` |  |

### model_videos

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `model_id` | uuid | no |  | → profiles.id |
| `file_path` | text | no |  |  |
| `file_name` | text | no |  |  |
| `uploaded_at` | timestamptz | yes | `now()` |  |
| `is_approved` | boolean | yes | `false` |  |

### model_working_hours

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `model_id` | uuid | no |  | → profiles.id |
| `schedule_type` | schedule_type (custom, same_every_day, 24_7) | no | `custom` |  |
| `day_of_week` | day_of_week (monday, tuesday, wednesday, thursday, friday, saturday, sunday) | yes |  |  |
| `start_time` | time without time zone | yes |  |  |
| `end_time` | time without time zone | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | no | `now()` |  |

## Clubs

### club_amenities

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `club_id` | uuid | no |  | → profiles.id |
| `amenity_name` | text | no |  |  |
| `amenity_description` | text | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |

### club_analytics

Analytics tracking for club profiles - views and contact clicks

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `club_id` | uuid | no |  | → profiles.id; Club profile being tracked |
| `event_type` | text | no |  | Type of event: profile_view or contact_click |
| `viewer_id` | uuid | yes |  | → profiles.id; User who triggered the event (null for guests) |
| `viewer_role` | text | yes |  | Role of viewer: authenticated or guest |
| `created_at` | timestamptz | no | `now()` |  |

### club_contact_details

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `club_id` | uuid | no |  | → profiles.id |
| `show_phone_number` | boolean | yes | `true` |  |
| `country_code` | varchar | yes | `+41` |  |
| `phone_number` | varchar | yes |  |  |
| `has_viber` | boolean | yes | `false` |  |
| `has_whatsapp` | boolean | yes | `false` |  |
| `has_telegram` | boolean | yes | `false` |  |
| `email` | varchar | yes |  |  |
| `website` | text | yes |  |  |
| `contact_instruction` | text | yes |  |  |
| `created_at` | timestamptz | yes | `now()` |  |
| `updated_at` | timestamptz | yes | `now()` |  |
| `no_withheld_numbers` | boolean | yes | `false` |  |
| `other_instructions` | text | yes |  |  |
| `contact_methods` | array | no |  | Channels the club allows publicly: call, sms, whatsapp, viber, telegram, email |
| `hide_contact_info` | boolean | no | `false` | When true, contact info is hidden on the public club profile. |

### club_details

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `club_id` | uuid | no |  | → profiles.id |
| `club_name` | text | no |  |  |
| `display_name` | text | yes |  |  |
| `area` | text | yes |  |  |
| `about_description` | text | yes |  |  |
| `is_club` | boolean | yes | `true` |  |
| `entrance_fee` | entrance_fee_type (na, free, with_cost) | yes | `na` |  |
| `wellness` | wellness_type (na, yes, no) | yes | `na` |  |
| `food_and_drinks` | food_drinks_type (na, yes, no) | yes | `na` |  |
| `outdoor_area` | outdoor_area_type (na, yes, no) | yes | `na` |  |
| `city` | text | yes |  |  |
| `zip_code` | text | yes |  |  |
| `street` | text | yes |  |  |
| `street_number` | text | yes |  |  |
| `country` | text | yes | `Switzerland` |  |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | no | `now()` |  |
| `additional_info` | text | yes |  |  |

### club_invites

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `club_id` | uuid | no |  | → profiles.id |
| `invited_model_id` | uuid | yes |  | → profiles.id |
| `invited_email` | text | yes |  |  |
| `status` | text | no | `pending` |  |
| `message` | text | yes |  |  |
| `invited_at` | timestamptz | no | `now()` |  |
| `responded_at` | timestamptz | yes |  |  |
| `expires_at` | timestamptz | yes | `(now() + '7 days'::interval)` |  |
| `created_at` | timestamptz | no | `now()` |  |

### club_photos

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `club_id` | uuid | no |  | → profiles.id |
| `file_path` | text | no |  |  |
| `file_name` | text | no |  |  |
| `is_verified` | boolean | yes | `false` |  |
| `uploaded_at` | timestamptz | yes | `now()` |  |
| `is_approved` | boolean | yes | `false` |  |
| `display_order` | integer | no | `0` |  |

### club_videos

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `club_id` | uuid | no |  | → profiles.id |
| `file_path` | text | no |  |  |
| `file_name` | text | no |  |  |
| `uploaded_at` | timestamptz | yes | `now()` |  |
| `is_approved` | boolean | yes | `false` |  |

### club_working_hours

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `club_id` | uuid | no |  | → profiles.id |
| `day_of_week` | text | no |  |  |
| `opens_at` | time without time zone | yes |  |  |
| `closes_at` | time without time zone | yes |  |  |
| `is_closed` | boolean | yes | `false` |  |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | no | `now()` |  |

## Jobs and rentals

### job_listing_photos

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `listing_id` | uuid | no |  | → job_listings.id |
| `file_path` | text | no |  |  |
| `file_name` | text | no |  |  |
| `display_order` | integer | yes | `0` |  |
| `uploaded_at` | timestamptz | no | `now()` |  |

### job_listing_services

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `listing_id` | uuid | no |  | → job_listings.id |
| `service_id` | uuid | no |  | → services.id |

### job_listings

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `club_id` | uuid | no |  | → profiles.id |
| `listing_type` | text | no | `job` |  |
| `location` | text | no |  |  |
| `description` | text | no |  |  |
| `country_code` | text | yes | `+41` |  |
| `phone_number` | text | yes |  |  |
| `has_whatsapp` | boolean | yes | `false` |  |
| `has_viber` | boolean | yes | `false` |  |
| `has_telegram` | boolean | yes | `false` |  |
| `email` | text | yes |  |  |
| `website` | text | yes |  |  |
| `status` | text | no | `pending_payment` |  |
| `starts_at` | timestamptz | yes | `now()` |  |
| `expires_at` | timestamptz | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | yes | `now()` |  |
| `title` | text | yes |  |  |
| `is_blocked` | boolean | no | `false` |  |
| `rent_price_daily` | numeric | yes |  |  |
| `rent_price_weekly` | numeric | yes |  |  |
| `rent_price_monthly` | numeric | yes |  |  |
| `rent_work_permit` | boolean | yes | `false` |  |
| `rent_room_size` | text | yes |  |  |
| `rent_furnished` | boolean | yes | `false` |  |
| `rent_kitchen` | boolean | yes | `false` |  |
| `rent_bathroom` | boolean | yes | `false` |  |
| `rent_air_conditioning` | boolean | yes | `false` |  |
| `rent_towels` | boolean | yes | `false` |  |
| `has_sms` | boolean | yes | `false` |  |
| `regions` | array | no |  |  |
| `address_street` | text | yes |  |  |
| `address_number` | text | yes |  |  |

## Commerce and advertising

### banner_region_pricing

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `placement` | text | no |  |  |
| `duration_days` | integer | no |  |  |
| `region_count` | integer | no |  |  |
| `price_chf` | numeric | no | `0` |  |
| `is_active` | boolean | no | `true` |  |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | no | `now()` |  |

### banners

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `owner_id` | uuid | no |  | → profiles.id |
| `owner_type` | text | no |  |  |
| `title` | text | no |  |  |
| `slogan` | text | yes |  |  |
| `image_path` | text | yes |  |  |
| `logo_path` | text | yes |  |  |
| `location` | text | yes |  |  |
| `cta_label` | text | yes | `View Profile` |  |
| `cta_url` | text | yes |  |  |
| `accent_color` | text | yes | `#EC4899` |  |
| `status` | text | no | `pending_payment` |  |
| `starts_at` | timestamptz | yes |  |  |
| `expires_at` | timestamptz | yes |  |  |
| `display_order` | integer | yes | `0` |  |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | no | `now()` |  |
| `placement` | text | no | `feed_wide` | Where the banner renders: wide row in feed, single grid cell, or left rail |
| `target_cantons` | array | yes |  | ISO codes of Swiss cantons this banner targets. NULL or empty = all of CH (no targeting). |

### order_items

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `order_id` | uuid | no |  | → orders.id |
| `product_id` | uuid | no |  | → products.id |
| `price_chf` | numeric | no |  |  |
| `activation_type` | text | yes |  |  |
| `activation_date` | timestamptz | yes |  |  |
| `banner_file_path` | text | yes |  |  |
| `advertising_text` | text | yes |  |  |
| `contact_phone` | text | yes |  |  |
| `contact_email` | text | yes |  |  |
| `contact_website` | text | yes |  |  |
| `created_at` | timestamptz | yes | `now()` |  |
| `banner_id` | uuid | yes |  | → banners.id |
| `listing_id` | uuid | yes |  | → job_listings.id |
| `reminder_email_sent_at` | timestamptz | yes |  |  |
| `expired_email_sent_at` | timestamptz | yes |  |  |

### orders

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `user_id` | uuid | no |  | → profiles.id |
| `total_amount` | numeric | no |  |  |
| `status` | text | yes | `pending` |  |
| `payment_method` | text | yes |  |  |
| `created_at` | timestamptz | yes | `now()` |  |
| `stripe_session_id` | text | yes |  |  |
| `stripe_payment_intent_id` | text | yes |  |  |
| `stripe_customer_id` | text | yes |  |  |
| `stripe_receipt_url` | text | yes |  |  |
| `paid_at` | timestamptz | yes |  |  |
| `failed_at` | timestamptz | yes |  |  |
| `metadata` | jsonb | yes |  |  |

### products

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `product_type` | text | no |  |  |
| `name` | text | no |  |  |
| `description` | text | yes |  |  |
| `price_chf` | numeric | no |  |  |
| `duration_days` | integer | yes |  |  |
| `duration_hours` | integer | yes |  |  |
| `discount_percent` | integer | yes | `0` |  |
| `banner_type` | text | yes |  |  |
| `is_active` | boolean | yes | `true` |  |
| `display_order` | integer | yes | `0` |  |
| `created_at` | timestamptz | yes | `now()` |  |

## Messaging and notifications

### conversations

Stores conversations between users and models

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `participant1_id` | uuid | no |  | → profiles.id |
| `participant2_id` | uuid | no |  | → profiles.id |
| `last_message_text` | text | yes |  |  |
| `last_message_at` | timestamptz | yes |  |  |
| `last_message_sender_id` | uuid | yes |  | → profiles.id |
| `participant1_unread_count` | integer | yes | `0` |  |
| `participant2_unread_count` | integer | yes | `0` |  |
| `created_at` | timestamptz | yes | `now()` |  |
| `updated_at` | timestamptz | yes | `now()` |  |
| `participant1_typing_at` | timestamptz | yes |  | Last time participant1 started typing (null = not typing) |
| `participant2_typing_at` | timestamptz | yes |  | Last time participant2 started typing (null = not typing) |

### messages

Stores individual messages in conversations

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `conversation_id` | uuid | no |  | → conversations.id |
| `sender_id` | uuid | no |  | → profiles.id |
| `message_text` | text | no |  |  |
| `is_read` | boolean | yes | `false` |  |
| `read_at` | timestamptz | yes |  | Timestamp when message was read by recipient (null = not read yet) |
| `created_at` | timestamptz | yes | `now()` |  |
| `updated_at` | timestamptz | yes | `now()` |  |

### notifications

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `user_id` | uuid | no |  | → profiles.id |
| `type` | text | no |  |  |
| `title` | text | no |  |  |
| `message` | text | no |  |  |
| `is_read` | boolean | no | `false` |  |
| `related_entity_type` | text | yes |  |  |
| `related_entity_id` | uuid | yes |  |  |
| `action_url` | text | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |
| `read_at` | timestamptz | yes |  |  |

## Community

### discussion_posts

Nested replies in a discussion topic

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `topic_id` | uuid | no |  | → discussion_topics.id |
| `parent_id` | uuid | yes |  | → discussion_posts.id |
| `author_id` | uuid | no |  | → profiles.id |
| `body` | text | no |  |  |
| `is_deleted` | boolean | no | `false` |  |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | no | `now()` |  |

### discussion_topics

Admin-managed discussion threads (blog)

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `slug` | text | no |  |  |
| `title` | text | no |  |  |
| `body` | text | no | `` |  |
| `status` | text | no | `draft` |  |
| `is_pinned` | boolean | no | `false` |  |
| `created_by` | uuid | no |  | → profiles.id |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | no | `now()` |  |
| `cover_image` | text | yes |  |  |

### favorites

User favorites - models/clubs that users have saved

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `user_id` | uuid | no |  | → profiles.id; User who favorited |
| `model_id` | uuid | no |  | → profiles.id; Model/club that was favorited |
| `created_at` | timestamptz | no | `now()` |  |

### model_comments

User comments/reviews for models - requires admin approval

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `user_id` | uuid | no |  | → profiles.id; User who left the comment |
| `model_id` | uuid | no |  | → profiles.id; Model being reviewed |
| `comment_text` | text | no |  | The actual comment/review text |
| `rating` | integer | yes |  | Optional 1-5 star rating |
| `status` | text | no | `pending` | pending (legacy), approved (online, awaiting admin review), reviewed (admin 2nd-approved), rejected (offline, user can edit) |
| `admin_notes` | text | yes |  | Internal notes from admin reviewer |
| `reviewed_by` | uuid | yes |  | → profiles.id; Admin who reviewed the comment |
| `reviewed_at` | timestamptz | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | no | `now()` |  |
| `reply_text` | text | yes |  |  |
| `replied_at` | timestamptz | yes |  |  |

### photo_likes

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `photo_id` | uuid | no |  | → model_photos.id |
| `user_id` | uuid | no |  | → profiles.id |
| `created_at` | timestamptz | yes | `now()` |  |

### reports

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `reporter_id` | uuid | no |  | → profiles.id |
| `reported_id` | uuid | no |  | → profiles.id |
| `conversation_id` | uuid | yes |  | → conversations.id |
| `reason` | text | yes |  |  |
| `screenshot_path` | text | yes |  |  |
| `status` | text | no | `pending` |  |
| `admin_note` | text | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |
| `reviewed_at` | timestamptz | yes |  |  |

### saved_searches

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `user_id` | uuid | no |  | → profiles.id |
| `name` | text | no |  |  |
| `entity_type` | text | no |  |  |
| `criteria` | jsonb | no |  |  |
| `is_active` | boolean | no | `true` |  |
| `last_matched_at` | timestamptz | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |
| `updated_at` | timestamptz | no | `now()` |  |

### story_views

Track who viewed which stories

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `extensions.uuid_generate_v4()` | PK |
| `story_id` | uuid | no |  | → model_stories.id |
| `viewer_id` | uuid | yes |  | → profiles.id |
| `viewed_at` | timestamptz | yes | `now()` |  |

## Analytics

### banner_clicks

Tracks banner ad clicks

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `banner_id` | uuid | no |  | → banners.id |
| `viewer_id` | uuid | yes |  | → profiles.id |
| `click_type` | text | yes |  |  |
| `page_path` | text | yes |  |  |
| `user_agent` | text | yes |  |  |
| `ip_address` | inet | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |

### banner_impressions

Tracks banner ad impressions

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `banner_id` | uuid | no |  | → banners.id |
| `viewer_id` | uuid | yes |  | → profiles.id |
| `page_path` | text | yes |  |  |
| `user_agent` | text | yes |  |  |
| `ip_address` | inet | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |

### daily_statistics

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `profile_id` | uuid | no |  | → profiles.id |
| `date` | date | no |  |  |
| `views` | integer | yes | `0` |  |
| `unique_views` | integer | yes | `0` |  |
| `phone_clicks` | integer | yes | `0` |  |
| `whatsapp_clicks` | integer | yes | `0` |  |
| `viber_clicks` | integer | yes | `0` |  |
| `telegram_clicks` | integer | yes | `0` |  |
| `email_clicks` | integer | yes | `0` |  |
| `website_clicks` | integer | yes | `0` |  |
| `search_appearances` | integer | yes | `0` |  |
| `created_at` | timestamptz | yes | `now()` |  |

### listing_clicks

Tracks contact-button clicks on job / rent listings

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `listing_id` | uuid | no |  | → job_listings.id |
| `viewer_id` | uuid | yes |  | → profiles.id |
| `click_type` | text | no |  |  |
| `user_agent` | text | yes |  |  |
| `ip_address` | inet | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |

### listing_views

Tracks page views of job / rent listings

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `listing_id` | uuid | no |  | → job_listings.id |
| `viewer_id` | uuid | yes |  | → profiles.id |
| `viewer_role` | text | yes |  |  |
| `user_agent` | text | yes |  |  |
| `ip_address` | inet | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |

### model_statistics

Tracks all user interactions with model profiles

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `model_id` | uuid | no |  | → profiles.id |
| `user_id` | uuid | yes |  | → profiles.id |
| `action_type` | text | no |  | Types: profile_view, contact_view, favorite_add, share |
| `user_agent` | text | yes |  |  |
| `ip_address` | inet | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |

### model_statistics_daily

Read-only view.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `model_id` | uuid | yes |  | → profiles.id |
| `date` | date | yes |  |  |
| `profile_views` | bigint | yes |  |  |
| `contact_views` | bigint | yes |  |  |
| `favorites` | bigint | yes |  |  |
| `shares` | bigint | yes |  |  |
| `unique_visitors` | bigint | yes |  |  |

### model_statistics_summary

Read-only view.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `model_id` | uuid | yes |  | → profiles.id |
| `total_profile_views` | bigint | yes |  |  |
| `total_contact_views` | bigint | yes |  |  |
| `total_favorites` | bigint | yes |  |  |
| `total_shares` | bigint | yes |  |  |
| `unique_profile_views` | bigint | yes |  |  |
| `last_profile_view` | timestamptz | yes |  |  |
| `last_activity` | timestamptz | yes |  |  |

### page_views

Global site-wide page view log. Written only by the server through /api/track/event.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `path` | text | no |  |  |
| `viewer_id` | uuid | yes |  | → profiles.id |
| `viewer_role` | text | yes |  |  |
| `session_id` | text | yes |  |  |
| `referrer` | text | yes |  |  |
| `user_agent` | text | yes |  |  |
| `ip_address` | inet | yes |  |  |
| `country` | text | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |

### profile_statistics

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `profile_id` | uuid | no |  | → profiles.id |
| `total_views` | integer | yes | `0` |  |
| `total_unique_views` | integer | yes | `0` |  |
| `phone_clicks` | integer | yes | `0` |  |
| `whatsapp_clicks` | integer | yes | `0` |  |
| `viber_clicks` | integer | yes | `0` |  |
| `telegram_clicks` | integer | yes | `0` |  |
| `email_clicks` | integer | yes | `0` |  |
| `website_clicks` | integer | yes | `0` |  |
| `search_appearances` | integer | yes | `0` |  |
| `favorites_count` | integer | yes | `0` |  |
| `last_viewed_at` | timestamptz | yes |  |  |
| `created_at` | timestamptz | yes | `now()` |  |
| `updated_at` | timestamptz | yes | `now()` |  |

### site_actions

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `action_type` | text | no |  |  |
| `actor_id` | uuid | yes |  | → profiles.id |
| `target_id` | uuid | yes |  |  |
| `target_type` | text | yes |  |  |
| `title` | text | no |  |  |
| `description` | text | yes |  |  |
| `metadata` | jsonb | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |

### view_logs

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `profile_id` | uuid | no |  | → profiles.id |
| `viewer_id` | uuid | yes |  | → profiles.id |
| `session_id` | text | yes |  |  |
| `ip_address` | text | yes |  |  |
| `user_agent` | text | yes |  |  |
| `referrer` | text | yes |  |  |
| `country` | text | yes |  |  |
| `city` | text | yes |  |  |
| `created_at` | timestamptz | yes | `now()` |  |

## Email

### email_log

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `recipient_user_id` | uuid | yes |  | → profiles.id |
| `recipient_email` | text | no |  |  |
| `kind` | text | no |  |  |
| `status` | text | no |  |  |
| `provider_id` | text | yes |  |  |
| `error` | text | yes |  |  |
| `created_at` | timestamptz | no | `now()` |  |

### email_unsubscribes

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `user_id` | uuid | no |  | → profiles.id |
| `category` | text | no |  |  |
| `unsubscribed_at` | timestamptz | no | `now()` |  |
| `source` | text | yes | `email_link` |  |

## Reference data

### cities

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `name` | text | no |  |  |
| `canton` | text | yes |  |  |
| `display_order` | integer | no | `0` |  |
| `is_active` | boolean | yes | `true` |  |
| `created_at` | timestamptz | no | `now()` |  |
| `postal_code` | text | yes |  |  |
| `municipality` | text | yes |  |  |
| `bfs_nr` | integer | yes |  |  |
| `coordinates_e` | double precision | yes |  |  |
| `coordinates_n` | double precision | yes |  |  |
| `language` | text | yes |  |  |

### services

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `name` | text | no |  |  |
| `category` | service_category_type (main, extra, fetish_bizarre, virtual, massage) | no |  |  |
| `display_order` | integer | no | `0` |  |
| `created_at` | timestamptz | no | `now()` |  |

## Database functions (RPC)

Called with `supabase.rpc(name, args)`. Arguments are listed as exposed by the API. Functions installed by extensions (pg_trgm) and internal helpers prefixed with `_` are omitted.

| Function | Arguments |
|---|---|
| `admin_delete_user` | `target_id` uuid |
| `admin_get_verifications` | `p_status` text (optional) |
| `admin_review_verification` | `p_id` uuid, `p_reason` text (optional), `p_status` text |
| `cleanup_pending_payments` | `age` interval (optional) |
| `clubs_with_active_ads` | none |
| `delete_expired_stories` | none |
| `discussion_post_parent_is_valid` | `p_parent_id` uuid, `p_topic_id` uuid |
| `entities_near_origin` | `p_entity` text, `p_origin_city` text, `p_radius_km` integer |
| `entities_near_origin_bundle` | `p_origin_city` text, `p_radius_km` integer |
| `expire_old_stories` | none |
| `fav_notify_all` | `p_action_url` text, `p_message` text, `p_model_id` uuid, `p_title` text, `p_type` text |
| `find_nearest_city_by_wgs84` | `p_lat` double precision, `p_lng` double precision |
| `generate_order_number` | none |
| `get_active_model_stories` | none |
| `get_club_view_counts` | `club_ids` array |
| `get_listing_view_counts` | `listing_ids` array |
| `get_model_view_counts` | `model_ids` array |
| `get_nearby_cities` | `radius` integer (optional), `target_plz` text |
| `get_or_create_conversation` | `p_other_user_id` uuid, `p_user_id` uuid |
| `get_photo_like_counts` | `photo_ids` array |
| `get_role_distribution_v1` | none |
| `get_traffic_aggregates_v1` | `p_since` timestamptz (optional) |
| `increment_contact_click` | `p_contact_type` text, `p_profile_id` uuid |
| `increment_profile_view` | `p_is_unique` boolean (optional), `p_profile_id` uuid, `p_session_id` text (optional) |
| `is_admin` | none |
| `mark_story_viewed` | `p_story_id` uuid |
| `match_saved_searches` | `p_entity_id` uuid, `p_entity_type` text |
| `model_ids_with_active_ads` | none |
| `models_with_active_ads` | none |
| `preview_saved_search` | `p_criteria` jsonb, `p_entity_type` text |
| `reset_unread_count` | `p_conversation_id` uuid, `p_user_id` uuid |
| `resolve_city_coords` | `p_city` text |
| `search_cities` | `max_results` integer (optional), `query` text |
| `ss_match_entity` | `p_criteria` jsonb, `p_entity_id` uuid, `p_entity_type` text |
| `track_model_action` | `p_action_type` text, `p_ip_address` inet (optional), `p_model_id` uuid, `p_user_agent` text (optional), `p_user_id` uuid (optional) |
| `user_has_active_ad` | `p_user_id` uuid |
