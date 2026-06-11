# Email setup — NiceModels.ch

Sve ispod je već povezano u kodu. Ovaj dokument je korak-po-korak šta uraditi
**na dan kada kupiš Supabase Pro + Resend** da sve odmah krene.

## Arhitektura (jedna re­čenica)

- **Supabase Auth** šalje *auth* email-ove (signup confirmation, password reset, email change).
- **Resend** šalje *transactional* email-ove (block / unblock / delete, verifikacija, fav digest).
- Svi naši mejlovi prolaze kroz `src/lib/email/sendEmail.ts` — silent no-op kad nema `RESEND_API_KEY`.
- Sve šalje server-side (API rute, cron); EmailJS se zadržava SAMO za javnu kontakt formu.

## 1. Resend (custom transactional)

1. Otvori nalog: <https://resend.com> → Free tier (3 000 mesečno) je dovoljan za start.
2. **Add Domain** → unesi `nicemodels.ch`.
3. Dodaj DNS zapise koje Resend prikaže (SPF, DKIM, DMARC). Sačekaj zelenu kvačicu.
4. **Create API Key** (Full access). Sačuvaj ga.
5. Postavi env varijable u Netlify (ili gde se hostuje):
   ```
   RESEND_API_KEY=re_xxx
   EMAIL_FROM="NiceModels <noreply@nicemodels.ch>"
   EMAIL_REPLY_TO=info@nicemodels.ch
   NEXT_PUBLIC_SITE_URL=https://www.nicemodels.ch
   EMAIL_UNSUB_SECRET=<openssl rand -hex 32>
   CRON_SECRET=<openssl rand -hex 32>
   ```
   Dok ovo nije postavljeno, kod nastavlja normalno da radi i samo loguje
   "would send" u dev konzoli — nikada ne baca grešku.

## 2. Supabase Auth (sign-up / reset / change-email)

Default Supabase šalje preko svog mailera koji ima rate limit 3-4 mejla na sat
(dovoljno za dev, ali za prod neupotrebljivo).

### Free tier (privremeno)
Radi kako jeste. Korisnici dobijaju `Confirm signup`, `Reset password` itd.

### Kada kupiš Pro ($25/mes):
1. Supabase dashboard → **Project Settings → Auth → SMTP Settings**.
2. Enable **Custom SMTP**.
3. Resend SMTP credentials (iz Resend → Settings → SMTP):
   ```
   Host: smtp.resend.com
   Port: 465 (SSL) ili 587 (TLS)
   Username: resend
   Password: <RESEND_API_KEY>
   Sender email: noreply@nicemodels.ch
   Sender name: NiceModels
   ```
4. **Auth → Email Templates** — prilagodi tekstove (German + English) za:
   - Confirm signup
   - Reset password
   - Magic link
   - Change email address

Sad *svi* email-ovi (auth + transactional) idu iz iste Resend domene → bolja deliverability.

## 3. SQL migracije (jednom u Supabase SQL Editor)

```bash
# Run each file in order from supabase-docs/
1. CREATE-email-tables.sql                      # email_unsubscribes + email_log
2. ALTER-order-items-add-email-reminders.sql    # sedcard expiry email tracking
3. (already deployed)                           # CREATE-saved-searches-and-radius.sql etc.
```

## 4. Cron za favorite digest

Endpoint: `POST /api/cron/email/fav-digest` sa header-om `x-cron-secret: <CRON_SECRET>`.

Koristi jedno od:

- **Supabase Scheduled Functions**: `CREATE EXTENSION pg_cron; SELECT cron.schedule('fav-digest', '0 8 * * *', $$ SELECT net.http_post(...) $$);` — jednom dnevno u 08:00.
- **GitHub Actions cron** (besplatno):
  ```yaml
  on:
    schedule: [{ cron: '0 7 * * *' }]
  jobs:
    digest:
      runs-on: ubuntu-latest
      steps:
        - run: |
            curl -X POST https://www.nicemodels.ch/api/cron/email/fav-digest \
              -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
  ```
- **Netlify Scheduled Functions** ili **Vercel Cron** ako tu hostujemo.

## 4b. Cron za sedcard reminder + expired (OBAVEZNO)

Endpoint: `POST /api/cron/email/sedcard-reminders` sa header-om `x-cron-secret: <CRON_SECRET>`.

Šta radi (idempotentno, preko `order_items.reminder_email_sent_at` / `expired_email_sent_at`):

- **24h pre isteka** sedcard-a (ad_package) → `sedcard_expiring` mejl modelu.
- **Po isteku** sedcard-a (ako model nema drugi aktivan oglas) → `sedcard_expired` mejl.

Preduslov: pokrenuti `ALTER-order-items-add-email-reminders.sql`.

Preporučeni raspored: **na svaki sat** (npr. GitHub Actions cron `0 * * * *`):
```yaml
on:
  schedule: [{ cron: '0 * * * *' }]
jobs:
  sedcard:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://www.nicemodels.ch/api/cron/email/sedcard-reminders \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

## 5. Šta je u kodu već povezano

| Trigger | Email | Recipient |
|---|---|---|
| Admin blokira/odblokira korisnika | `admin_account_blocked` / `admin_account_unblocked` | korisnik |
| Korisnik / admin obriše nalog | `admin_account_deleted` | bivši korisnik |
| Admin blokira/odblokira oglas | `admin_listing_blocked` / `admin_listing_unblocked` | vlasnik oglasa (klub) |
| Admin odobri/odbije verifikaciju | `verification_approved` / `verification_rejected` | korisnik |
| Daily cron `fav-digest` | `fav_digest` (agregat poslednja 24h) | useri sa favoritima |

## 6. Šta nije pokriveno (sledeće faze)

- **Saved-search match** kao mejl (sad ide samo u in-app inbox). Trigger postoji, treba dodati `sendSavedSearchMatchEmail` u `match_saved_searches` ili poseban cron.
- **Purchase**: order paid / banner aktiviran / oglas istekao za 3 dana — treba dodati u `/api/order/...` rute.
- **Engagement**: nova chat poruka offline, novi club invite, collaboration invite — postoje notifikacije, dodati `sendEngagement*Email`.
- **Reports**: `report_received` / `report_resolved` — kuke u `/api/reports/*`.
- **Email preferences UI** u dashboardu (`/dashboard/.../email-preferences`). Trenutno je samo unsubscribe link u mejlu.

## 7. Lokalno testiranje

Kada postaviš `RESEND_API_KEY` u `.env.local`:
```
RESEND_API_KEY=re_xxx
EMAIL_FROM="NiceModels Dev <onboarding@resend.dev>"   # Resend test sender
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EMAIL_UNSUB_SECRET=dev-secret
CRON_SECRET=dev-secret
```
Resend ima sandbox sender `onboarding@resend.dev` koji šalje samo na vlasnikov email — savršeno za testiranje pre nego što se domena verifikuje.

## 8. Compliance

- **GDPR / CAN-SPAM / RFC 8058**: svaki email ima `List-Unsubscribe` header i vidljiv unsubscribe link.
- **Mandatory transactional** (account block / unblock / delete) ne nudi unsubscribe — tako i mora po praksi.
- **Audit trail**: tabela `email_log` čuva svaki pokušaj 30+ dana.

---

**Ako sve gore odradiš, idemo live.** Kod kao kod nikoga ne treba menjati.
