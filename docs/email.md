# Email

Two systems send email:

- **Supabase Auth** sends authentication emails: password reset and email change. Sign-up confirmation is switched off (see [database.md](database.md#auth)).
- **Resend** sends every transactional email from the application, through `src/lib/email/sendEmail.ts`.

The public contact form is the only exception: it sends through EmailJS directly from the browser (`NEXT_PUBLIC_EMAILJS_*`).

## How sending works

All transactional mail goes through `sendEmail()`:

- Without `RESEND_API_KEY` it does nothing and never throws, so development and preview deploys run without an email account.
- It skips recipients who unsubscribed from the email's category (`email_unsubscribes`), except for mandatory kinds (`NON_OPT_OUT_KINDS` in `src/lib/email/types.ts`): account blocked, unblocked, deleted or type changed, the welcome email and the internal sign-up notice.
- Opt-out emails carry a signed unsubscribe link and `List-Unsubscribe` / `List-Unsubscribe-Post` headers (RFC 8058 one-click). Links are signed with `EMAIL_UNSUB_SECRET`.
- Every attempt is written to `email_log`.

Templates live in `src/lib/email/templates.ts` and share the layout in `src/lib/email/layout.ts`.

## Emails and triggers

| Email | Sent from | Recipient |
|---|---|---|
| `welcome` | `POST /api/email/welcome` after registration | New user |
| `admin_new_signup` | `POST /api/email/new-registration` | `info@nicemodels.ch` |
| `admin_account_blocked`, `admin_account_unblocked` | `/api/admin/block-user` | User |
| `admin_account_deleted` | `/api/account/delete` | Former user |
| `admin_account_type_changed` | `/api/admin/change-role` | User |
| `admin_listing_blocked`, `admin_listing_unblocked` | `/api/admin/block-listing` | Listing owner |
| `admin_custom_message` | `/api/admin/send-message` | User |
| `verification_approved`, `verification_rejected` | `/api/admin/verifications`, `/api/admin/email-verification-decision` | User |
| `report_received` | `/api/reports/submit` | `info@nicemodels.ch` |
| `report_resolved` | `/api/reports/update-status` | Reporter |
| `fav_digest` | Cron `/api/cron/email/fav-digest` | Users with favourites that changed in the last 24 hours |
| `sedcard_expiring`, `sedcard_expired` | Cron `/api/cron/email/sedcard-reminders` | Model whose sedcard expires within 24 hours, or has expired |

Sedcard reminders are sent once per order item; `order_items.reminder_email_sent_at` and `expired_email_sent_at` record what was sent.

## Setup

### Resend

1. Add and verify the sending domain (`nicemodels.ch`) in Resend: add the SPF, DKIM and DMARC records it lists.
2. Create an API key.
3. Set the environment variables:

   ```env
   RESEND_API_KEY=re_...
   EMAIL_FROM="NiceModels <noreply@nicemodels.ch>"
   EMAIL_REPLY_TO=info@nicemodels.ch
   NEXT_PUBLIC_SITE_URL=https://www.nicemodels.ch
   EMAIL_UNSUB_SECRET=<random, e.g. openssl rand -hex 32>
   CRON_SECRET=<random, e.g. openssl rand -hex 32>
   ```

For local testing, Resend's sandbox sender `onboarding@resend.dev` delivers to the account owner's address without a verified domain.

### Supabase Auth

Supabase's built-in mailer is rate-limited to a few emails per hour. For production, send auth emails through Resend SMTP (Project Settings → Auth → SMTP Settings):

| Setting | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (TLS) |
| Username | `resend` |
| Password | the Resend API key |
| Sender | `noreply@nicemodels.ch`, name `NiceModels` |

Then adjust the templates under Authentication → Email Templates. The reset-password and change-email templates link to `/auth/confirm` with the token hash, for example:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
```

Sign-up confirmation must stay disabled (Authentication → Providers → Email → Confirm email: off). With it enabled, `signUp()` returns no session and new users cannot finish registration.

### Database

The email tables come from two scripts in `supabase-docs/`:

1. `CREATE-email-tables.sql`: `email_unsubscribes` and `email_log`.
2. `ALTER-order-items-add-email-reminders.sql`: the sedcard reminder columns on `order_items`.

### Scheduled jobs

The cron endpoints are described in [deployment.md](deployment.md#scheduled-jobs).

## Not covered yet

- Saved-search matches notify in the app only, not by email.
- The application sends no purchase confirmation of its own. Stripe can send receipts (Stripe Dashboard → Settings → Customer emails).
- New chat messages, club invites and collaboration requests create in-app notifications but no email.
- There is no email-preferences page; users opt out through the link in each email.
