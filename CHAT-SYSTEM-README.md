# 💬 Chat/Messaging System - Implementation Guide

## ✅ Šta je Urađeno:

### 1. Database Tables ✅
- `conversations` - Čuva konverzacije između usera i modela
- `messages` - Čuva pojedinačne poruke
- `online_status` - Prati ko je online i dostupan za chat

### 2. RLS Policies ✅
- Participants mogu videti samo svoje konverzacije
- Participants mogu slati poruke u svojim konverzacijama
- Admin može videti sve
- Svi logged-in users mogu videti online status

### 3. Functions ✅
- `update_conversation_last_message()` - Auto-update konverzacije
- `reset_unread_count()` - Resetuje unread count
- `get_or_create_conversation()` - Kreira ili vraća postojeću konverzaciju

### 4. UI Components ✅
- `ChatWidget` - Floating chat button sa conversation listom
- `ChatPageClient` - Puna chat stranica sa messages
- `StartChatButton` - Button na model profilu za početak chata

### 5. Features ✅
- Real-time messaging (Supabase subscriptions)
- Online status tracking
- Unread message counters
- Conversation list with last message
- Beautiful UI sa gradients i animations

---

## 🚀 Kako Aktivirati:

### Step 1: Pokreni SQL Script
Otvori Supabase SQL Editor i pokreni:
```
supabase-docs/CREATE-TABLE-chat-system.sql
```

### Step 2: Proveri Da Li Je Sve OK
Pokreni:
```
supabase-docs/TEST-chat-system.sql
```

Trebalo bi da vidiš:
- 3 tabele: `conversations`, `messages`, `online_status`
- RLS policies za sve 3 tabele
- 3 functions

### Step 3: Build & Test
```bash
npm run build
```

---

## 📋 Kako Funkcioniše:

### Početak Chata:
1. User klikne "Send Message" na model profilu
2. `StartChatButton` poziva `get_or_create_conversation()`
3. Redirect na `/chat/{conversation_id}`

### Slanje Poruka:
1. User kuca poruku i klikne Send
2. Insert u `messages` tabelu
3. Trigger automatski update-uje `conversations` (last_message, unread_count)
4. Real-time subscription obaveštava oba korisnika

### Online Status:
1. Kada se user loguje, `ChatWidget` set-uje `is_online: true`
2. Pokazuje se green dot pored avatara
3. Real-time subscription update-uje status u listi

### Unread Messages:
1. Svaka poruka automatski increment-uje unread count za primaoca
2. Kada user otvori konverzaciju, `reset_unread_count()` se poziva
3. Sve poruke se mark-uju kao read

---

## 🎨 UI Details:

### ChatWidget (Floating Button):
- Sticky bottom-right corner
- Shows total unread count badge
- Opens conversation list panel
- Tabs: "Conversations" & "Online Now"
- Search functionality
- "You are available to chat" indicator

### ChatPageClient (Full Chat):
- Header sa username i online status
- Scrollable message list
- Date separators
- Own messages (right, pink gradient)
- Other messages (left, white)
- Sticky input footer
- Auto-scroll to bottom
- Real-time updates

### StartChatButton:
- Na model profilu
- Blue gradient (različito od "Show Contact")
- Redirects to login ako nije logged in

---

## 🔧 Integration Points:

### Navbar:
```tsx
import ChatWidget from '@/components/chat/ChatWidget'

{user && <ChatWidget />}
```

### Model Profile:
```tsx
import StartChatButton from '@/components/chat/StartChatButton'

<StartChatButton modelId={profile.id} />
```

---

## 📊 Database Schema:

### conversations
- `id` - UUID
- `user_id` - UUID (participant 1)
- `model_id` - UUID (participant 2)
- `last_message_text` - TEXT
- `last_message_at` - TIMESTAMP
- `user_unread_count` - INTEGER
- `model_unread_count` - INTEGER

### messages
- `id` - UUID
- `conversation_id` - UUID (FK)
- `sender_id` - UUID (FK to profiles)
- `message_text` - TEXT
- `is_read` - BOOLEAN
- `created_at` - TIMESTAMP

### online_status
- `id` - UUID
- `user_id` - UUID (FK to profiles)
- `is_online` - BOOLEAN
- `is_available_for_chat` - BOOLEAN
- `last_seen_at` - TIMESTAMP

---

## 🔐 Security (RLS):

- ✅ Users can only see their own conversations
- ✅ Users can only send messages in their conversations
- ✅ Users can only mark messages as read in their conversations
- ✅ Admin can see everything
- ✅ Online status visible to all logged-in users

---

## 🎯 Testing Checklist:

- [ ] Pokreni SQL script
- [ ] Proveri da tabele postoje
- [ ] Kreiraj test conversation
- [ ] Pošalji poruku
- [ ] Proveri unread count
- [ ] Otvori konverzaciju (unread should reset)
- [ ] Proveri real-time updates (otvori u 2 prozora)
- [ ] Proveri online status
- [ ] Proveri ChatWidget u Navbar-u
- [ ] Klikni "Send Message" na model profilu

---

## 🚨 Potential Issues:

### "Function not found"
- Pokreni SQL script ponovo
- Proveri da su functions kreirane sa `SECURITY DEFINER`

### "RLS policy denied"
- Proveri da je user logged in
- Proveri da user učestvuje u konverzaciji

### Real-time ne radi
- Proveri Supabase Realtime enabled na projektu
- Proveri da je channel subscription aktivan

### Messages ne stižu
- Proveri trigger `trigger_update_conversation_last_message`
- Proveri permissions na `messages` tabeli

---

## ✨ Future Enhancements:

- [ ] Typing indicators
- [ ] Image/file attachments
- [ ] Voice messages
- [ ] Read receipts (checkmarks)
- [ ] Block/Report users
- [ ] Group chats (clubs)
- [ ] Push notifications
- [ ] Delete messages
- [ ] Edit messages
- [ ] Search messages
- [ ] Pin conversations

---

## 📝 Notes:

- Chat je dostupan za SVE logged-in users (user, model, company, admin)
- Models mogu slati poruke user-ima (recipročno)
- Online status se automatski update-uje kada user otvori app
- Conversation se automatski kreira kada neko pošalje prvu poruku
- Unread count se automatski increment-uje sa svakom novom porukom
- Conversation list se sort-uje po `last_message_at` (najnovije gore)

---

**Chat sistem je spreman! 💬🎉**
