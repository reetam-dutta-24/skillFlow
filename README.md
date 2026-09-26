# SkillFlow

A mastery-first learning platform that replaces fragmented, attention-optimized
learning with one structured system — curated roadmaps, AI-grounded quizzes, and
a mandatory Socratic explain-back gate that verifies real comprehension, not just
watch-time or passive completion.

## Status

Actively in development. Currently in Phase 3 (Core Backend: Content & Roadmap System).

## Tech Stack

- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js App Router, Server Actions
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Auth.js — Google OAuth + email/password (bcrypt), JWT sessions
- **Infrastructure:** Docker (local dev), AWS, Vercel, Redis
- **AI:** Anthropic/OpenAI API — grounded quiz generation and multi-turn explain-back grading

## Getting Started

```bash
npm install
docker compose up -d
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Copy `.env.example` to `.env` and fill in real values before running.

## Core Differentiator

Most learning platforms gate progress on watch-time or a multiple-choice quiz.
SkillFlow gates each roadmap milestone on a short, adaptive comprehension check:
explain the concept in your own words, answer a targeted AI follow-up question
on whatever was vague or incomplete, and only then does the next stage unlock.

## License

TBD