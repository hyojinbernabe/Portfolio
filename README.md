# Portfolio

My personal site. One page: hero, about, how I work, skills, experience, and projects.

The keyboard in the hero is built in code with react-three-fiber, so there's no 3D model file.

## Stack

- Next.js 16 (App Router) and React 19
- Tailwind CSS v4
- GSAP, Motion, and Lenis for the animations
- react-three-fiber, drei, and Three.js for the keyboard

## Running it

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

Content lives in `src/lib/` (projects, about text, links), so most edits don't touch the components.
