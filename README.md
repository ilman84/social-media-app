# Sociality

A modern social media app built with Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query, and ShadCN/Sonner toasts. Mobile‑first UI with feed, likes, comments, saves, profiles, and modals.

## Features

- Feed with like, comment, share, and save
- Accurate counts via API + optimistic updates
- Comment & Likes modals (emoji picker, delete own comment)
- User profiles (gallery, saved/liked tabs, followers/following modals)
- Fixed top navbar + mobile search input, bottom nav on key pages
- Avatar dropdown (Profile, Logout)
- Add Post (upload image + caption) with toast feedback
- Edit Profile (update profile + avatar) with toast feedback
- Responsive (desktop and 393px mobile optimized)

## Tech Stack

- Next.js 15 • React • TypeScript
- Tailwind CSS
- TanStack Query (data fetching, mutations)
- ShadCN UI + Sonner (toasts)
- Deployed API (Railway): Sociality backend

## Getting Started

Prerequisites:

- Node 18+ and npm (or pnpm/yarn/bun)

Install and run dev server:

```bash
npm i
npm run dev
# open http://localhost:3000
```

Build and start:

```bash
npm run build
npm run start
```

## Environment

Auth tokens are stored in localStorage (`token`, `username`, `avatarUrl`). The app calls the hosted API; no extra `.env` is required for local development.

## Project Structure (key paths)

- `src/app/` – App Router pages
  - `page.tsx` – Home (feed)
  - `users/[username]/page.tsx` – Public user profile
  - `users/profile/page.tsx` – My profile
  - `users/profile/edit/page.tsx` – Edit profile (with toasts)
  - `posts/new/page.tsx` – Add post (with toasts)
- `src/components/` – UI components
  - `Navbar.tsx`, `Feed.tsx`, `CommentModal.tsx`, `LikesModal.tsx`, etc.
- `src/lib/api.ts` – API client functions

## Common Scripts

```bash
npm run dev       # start dev server
npm run build     # production build
npm run start     # start production server
```

## Notes

- Favicon: `public/images/like-icon.svg`
- Mobile navbar: search icon inside the field; background shim avoids white edges
- Feed avatars/names are clickable → self: `/users/profile`, others: `/users/[username]`

## License

This project is for learning/demo purposes. Adapt as needed.
