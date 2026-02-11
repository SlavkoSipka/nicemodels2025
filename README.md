# 💎 Nice Models - Escort Platform

A modern, full-featured escort platform built with Next.js 16, Supabase, and TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js 20 or higher
- npm or yarn
- Supabase account

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd nicemodels2025
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project:
- Dashboard → Project Settings → API

4. **Set up Supabase database**

Execute SQL scripts in order from `supabase-docs/` folder:
- Start with table creation scripts
- Then add RLS policies
- Finally add functions

See `supabase-docs/README.md` for detailed instructions.

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Icons:** Lucide React
- **Deployment:** Netlify

---

## 🏗️ Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/         # Dashboard pages (model, company, user, admin)
│   │   ├── models/            # Model profile pages
│   │   ├── clubs/             # Club profile pages
│   │   ├── auth/              # Authentication callbacks
│   │   └── ...
│   ├── components/            # React components
│   │   ├── auth/             # Login, register forms
│   │   ├── layout/           # Navbar, sidebar, footer
│   │   ├── home/             # Homepage components
│   │   └── ...
│   └── lib/                   # Utilities and configurations
│       ├── supabase/         # Supabase client/server setup
│       └── api/              # API helper functions
├── supabase-docs/             # Database schema and documentation
├── public/                    # Static assets
└── netlify.toml              # Netlify configuration
```

---

## 👥 User Roles

### 1. **Models** 👤
- Create and manage profile
- Upload photos and videos
- Set rates and services
- Activate ads
- View statistics
- Respond to invites from clubs

### 2. **Clubs/Agencies** 🏢
- Manage club profile
- Invite models
- Activate ads
- View analytics
- Manage multiple models

### 3. **Regular Users** 💝
- Browse models and clubs
- Save favorites
- Leave reviews (admin-approved)
- View public comments

### 4. **Admin** ⚙️
- Review and approve content
- Verify users
- Manage comments
- View all statistics
- Block/unblock users

---

## 🎨 Key Features

### For Models
- ✅ Complete profile management
- ✅ Photo/video gallery with admin approval
- ✅ Service and rate management
- ✅ Working hours scheduler
- ✅ Ad packages (currently free during beta)
- ✅ Statistics and analytics
- ✅ Club invitations system

### For Clubs/Agencies
- ✅ Club profile with photos
- ✅ Model invitation system
- ✅ Multiple model management
- ✅ Club ad packages
- ✅ Analytics (profile views, contact clicks)

### For Users
- ✅ Browse models and clubs
- ✅ Advanced search and filters
- ✅ Save favorites
- ✅ Leave reviews (admin moderated)
- ✅ View public comments

### General Features
- ✅ Supabase authentication
- ✅ Role-based access control
- ✅ File upload (photos, banners)
- ✅ Real-time notifications
- ✅ Blog system (template ready)
- ✅ Contact page
- ✅ Responsive design

---

## 🚀 Deployment

**For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Quick Deploy to Netlify

1. Push code to GitHub
2. Connect to Netlify
3. Add environment variables
4. Deploy!

Detailed step-by-step guide available in `DEPLOYMENT.md`.

---

## 📚 Documentation

- **Database Schema:** `supabase-docs/DATABASE-STRUCTURE.md`
- **Deployment Guide:** `DEPLOYMENT.md`
- **Invite System:** `INVITE-SYSTEM-README.md`
- **Supabase Setup:** `supabase-docs/README.md`

---

## 🔐 Security

- ✅ Row Level Security (RLS) on all tables
- ✅ Secure authentication with Supabase
- ✅ Environment variables for sensitive data
- ✅ Admin-only routes protected
- ✅ File upload validation

---

## 🐛 Troubleshooting

### Build fails
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Database connection issues
- Verify `.env.local` has correct Supabase credentials
- Check Supabase project is active
- Ensure RLS policies are set up correctly

### Photos not displaying
- Check Supabase Storage bucket permissions
- Verify photos are marked as `is_approved: true`
- Check CORS settings in Supabase

---

## 🔄 Development Workflow

1. **Local Development**
```bash
npm run dev
```

2. **Type Checking**
```bash
npx tsc --noEmit
```

3. **Build for Production**
```bash
npm run build
```

4. **Test Production Build Locally**
```bash
npm run build
npm run start
```

---

## 📝 Environment Variables

Required variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## 🎯 Beta Features

Currently in beta (free):
- Model ad activation (normally paid)
- Club ad activation (normally paid)
- Banner ads (normally paid)

These will require payment integration when going live.

---

## 📧 Support

For issues or questions:
1. Check existing documentation
2. Review Supabase logs
3. Check browser console for errors
4. Review deployment logs on Netlify

---

## 📄 License

This project is private and proprietary.

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Version:** 0.1.0 (Beta)  
**Last Updated:** February 2026
