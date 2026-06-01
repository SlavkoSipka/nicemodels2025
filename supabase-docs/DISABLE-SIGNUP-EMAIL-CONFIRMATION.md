# Disable signup email confirmation (instant onboarding)

Registration is designed to log users in immediately after `signUp()` and redirect to `/dashboard` (Model/Club → `/onboarding`, Visitor → `/dashboard/user`).

## Required: Supabase dashboard setting

1. Open **Supabase Dashboard** → your project.
2. Go to **Authentication** → **Providers** → **Email**.
3. Turn **OFF** **Confirm email** (signup confirmation).
4. Save.

If this stays enabled, `signUp()` will not return an active session and the app cannot auto-login after registration.

## What still uses email links

Keep these enabled / unchanged:

- **Password recovery** — uses `/auth/confirm` with `type=recovery`
- **Email change** — uses `/auth/confirm` with `type=email_change`

Optional: disable or simplify the **signup confirmation** email template in **Authentication → Email Templates** (no longer sent for new signups).

## Verify after change

1. Register a new test account on `/register`.
2. You should land on `/onboarding` (model/club) or `/dashboard/user` (visitor) with **no** “check your email” step.
3. Password reset from `/forgot-password` should still send an email and work.
