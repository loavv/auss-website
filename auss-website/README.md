# USSAU — United Scholars' Society of Adamson University

Official website for the United Scholars' Society of Adamson University, built with React, TypeScript, Tailwind CSS, Framer Motion, and Supabase.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Routing | React Router v7 |
| UI Components | Radix UI primitives |
| Forms | React Hook Form + Zod |
| Data Fetching | TanStack Query |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Charts | Recharts |
| Notifications | Sonner |

---

## Getting Started

### 1. Clone and Install

```bash
cd ussau-website
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
copy .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Navigate to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Storage** and create the following buckets (set all as **Public**):
   - `logos`
   - `announcements`
   - `events`
   - `gallery`
   - `officers`
   - `achievements`
   - `documents`
4. Go to **Authentication** → **Settings** and configure your site URL

### 4. Create First Admin User

In Supabase Dashboard → **Authentication** → **Users**, click "Add User" and create an admin account, then manually insert the admin record in the `admins` table:

```sql
INSERT INTO admins (id, full_name, email, role, status)
VALUES ('<auth-user-uuid>', 'Your Name', 'your@email.com', 'super_admin', 'active');
```

### 5. Run Development Server

```bash
npm run dev
```

---

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin-specific components (DataTable)
│   ├── auth/           # ProtectedRoute
│   ├── layout/         # Navbar, Footer, PublicLayout, AdminLayout
│   ├── shared/         # AnimatedCounter, CountdownTimer
│   └── ui/             # Base UI components (Button, Input, etc.)
├── contexts/
│   └── AuthContext.tsx # Supabase auth state
├── lib/
│   ├── supabase.ts     # Supabase client + storage helpers
│   └── utils.ts        # Utility functions
├── pages/
│   ├── admin/          # All admin dashboard pages
│   └── public/         # All public-facing pages
├── types/
│   ├── database.ts     # Supabase DB type definitions
│   └── index.ts        # Shared types
├── App.tsx             # Route configuration
└── main.tsx            # Entry point
```

---

## Available Pages

### Public Website

| Route | Page |
|-------|------|
| `/` | Home Page |
| `/about` | About Page |
| `/events` | Events & Programs |
| `/feedback` | Feedback Form |
| `/contact` | Contact Page |

### Admin Portal

| Route | Page |
|-------|------|
| `/admin/login` | Login |
| `/admin/forgot-password` | Forgot Password |
| `/admin/dashboard` | Dashboard |
| `/admin/announcements` | Announcements CRUD |
| `/admin/events` | Events CRUD |
| `/admin/projects` | Projects CRUD |
| `/admin/officers` | Officers CRUD |
| `/admin/achievements` | Achievements CRUD |
| `/admin/gallery` | Gallery Manager |
| `/admin/feedback` | Feedback Viewer |
| `/admin/inquiries` | Inquiries Viewer |
| `/admin/administrators` | Admin Management (Super Admin only) |
| `/admin/activity-logs` | Activity Logs |
| `/admin/settings` | Website Settings |

---

## Key Features

- **Premium UI** — Modern, clean design with Royal Blue (#0056D2) and Academic Gold (#F4C430)
- **Framer Motion** — Page transitions, scroll reveals, floating blobs, animated counters
- **Responsive** — Fully responsive across all screen sizes
- **Supabase Auth** — Secure JWT-based authentication with session persistence
- **Row Level Security** — Public can read; only admins can write
- **Multi-Admin** — Super Admin can manage other admins
- **Activity Logs** — All admin actions are automatically logged
- **Event Registration** — External registration links (Google Forms, Eventbrite, etc.)
- **Countdown Timers** — Live countdown for upcoming events
- **Anonymous Feedback** — Students can submit feedback anonymously
- **Code Splitting** — All pages are lazy-loaded for optimal performance

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to Vercel, Netlify, or any static host.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |
