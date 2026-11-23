# Prompt-Dock Frontend

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui.

## Setup

```bash
cp .env.example .env.local   # sets NEXT_PUBLIC_API_URL
npm install
npm run dev                  # http://localhost:3000
```

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - production build
- `npm run start` - serve the production build
- `npm run typecheck` - generate Next.js route types and run `tsc --noEmit`
- `npm run lint` - ESLint

## Adding components

```bash
npx shadcn@latest add button
```

Components are placed in `src/components/ui` and imported as:

```tsx
import { Button } from "@/components/ui/button"
```
