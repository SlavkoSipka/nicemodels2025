# 🆕 New Tables - Invite System

**Added:** 2026-02-09

## Tables Added:

### 1. `club_invites`
```sql
- id: uuid (PK)
- club_id: uuid (FK → profiles.id) - Club koji šalje invite
- invited_model_id: uuid (FK → profiles.id) - Model koji prima invite (REQUIRED)
- status: text (pending/accepted/rejected/cancelled)
- message: text - opciona poruka od kluba
- invited_at: timestamp (default: now())
- responded_at: timestamp - kada je model odgovorio
- created_at: timestamp (default: now())
```

**Key Points:**
- ✅ Samo postojeći modeli (invited_email removed)
- ✅ Nema expiration
- ✅ Model može biti u više klubova (no unique constraint on model_id)

### 2. `notifications`
```sql
- id: uuid (PK)
- user_id: uuid (FK → profiles.id) - Kome je notifikacija
- type: text (club_invite, verification_approved, system_message, etc.)
- title: text
- message: text
- is_read: boolean (default: false)
- related_entity_type: text (club_invite, verification, etc.)
- related_entity_id: uuid - ID invite-a ili drugi entity
- action_url: text - link gde ide korisnik
- created_at: timestamp (default: now())
- read_at: timestamp
```

**Key Points:**
- ✅ Generička tabela za sve notifikacije
- ✅ Model može da ukloni (DELETE) notifikaciju
- ✅ Refresh-based (no realtime)

## Triggers:

### `notify_model_on_invite()`
- Automatski kreira notifikaciju kada se napravi novi invite
- Triggeruje se AFTER INSERT na club_invites

## RLS Policies:

- Clubs: view/create/cancel own invites
- Models: view/respond to invites sent to them
- Users: view/update/delete own notifications
