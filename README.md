# SkillFlow

A mastery-first learning platform that replaces fragmented, attention-optimized
learning with one structured system — curated roadmaps, AI-grounded quizzes, and
a mandatory Socratic explain-back gate that verifies real comprehension, not just
watch-time or passive completion.

## Status

Actively in development. The Full-Stack path is loaded. A dead resource link can be marked unavailable, and the lesson keeps the saved title and notes.

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

## Catalog links

Check the researched catalog file. This does not change stored resources:

```bash
npx tsx scripts/verify-catalog.ts full-stack-web-dev
```

Check the links already stored for a skill. A removed, private, failed, or non-embeddable source is marked unavailable and stamped with the check time. A link that only needs a person to look at it is left as it is. The saved title, description, and key points stay on the lesson.

```bash
npx tsx scripts/verify-catalog.ts full-stack-web-dev --from-db
```

## Core Differentiator

Most learning platforms gate progress on watch-time or a multiple-choice quiz.
SkillFlow gates each roadmap milestone on a short, adaptive comprehension check:
explain the concept in your own words, answer a targeted AI follow-up question
on whatever was vague or incomplete, and only then does the next stage unlock.

## License

TBD
