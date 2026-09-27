import {
  Braces,
  Database,
  Globe,
  GraduationCap,
  LayoutTemplate,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FxHeading } from "@/components/ui/fx-heading";

/*
 * Skills & Stack + Experience, same card layout: sticky giant label (cols 1-3) beside a 2-up card grid (cols
 * 5-12). Each card is a fixed-height flex column where the visual disc is
 * the flexible child; hovering (or focusing) the card grows the detail
 * area's grid row from 0fr to 1fr, which squeezes the disc smaller as the
 * text reveals. Pure CSS, no JS, server component.
 */

type Capability = {
  icon: LucideIcon;
  title: string;
  role: string;
  body: string;
  chips?: string[];
};

const SKILLS: Capability[] = [
  {
    icon: Braces,
    title: "Languages",
    role: "What I write every day",
    body: "TypeScript for almost everything on the web, Dart for Flutter, and PHP or Python when a project calls for it.",
    chips: ["TypeScript", "JavaScript", "Dart", "PHP", "Python"],
  },
  {
    icon: LayoutTemplate,
    title: "Frontend",
    role: "Interfaces and motion",
    body: "React and Next.js apps styled with Tailwind, with scroll animations in GSAP when a page needs to feel alive.",
    chips: ["React", "Next.js", "Tailwind CSS", "GSAP"],
  },
  {
    icon: Smartphone,
    title: "Mobile & Desktop",
    role: "Apps that live on a device",
    body: "Flutter for iOS and Android, Expo when the team is on React Native, and Tauri for desktop apps.",
    chips: ["Flutter", "Expo", "React Native", "Tauri"],
  },
  {
    icon: Database,
    title: "Backend & Data",
    role: "APIs, databases, real-time",
    body: "Node.js APIs on PostgreSQL through Prisma, WebSockets for live updates, and Docker to run it all locally.",
    chips: ["Node.js", "PostgreSQL", "Prisma", "WebSockets", "Docker"],
  },
];

const EXPERIENCE: Capability[] = [
  {
    icon: Smartphone,
    title: "ZuraLog",
    role: "Mobile Developer · Mar to Aug 2026",
    body: "Built features for a Flutter health app on iOS and Android: the AI chat that streams replies over WebSockets, social sign-in, and push notifications.",
    chips: ["Flutter", "Riverpod", "Firebase", "WebSockets"],
  },
  {
    icon: Globe,
    title: "FLH Media",
    role: "Full Stack Developer · Jul to Sep 2026",
    body: "Built the agency's website in Next.js with GSAP scroll animations and a contact form that emails inquiries, deployed on Vercel.",
    chips: ["Next.js", "Tailwind CSS", "GSAP", "Vercel"],
  },
  {
    icon: GraduationCap,
    title: "Money Trees",
    role: "Full Stack Intern · Feb to Apr 2025",
    body: "Made the user onboarding for a Bible study app in Expo inside a monorepo, redesigned web dashboards, and shipped production hotfixes. Fully remote.",
    chips: ["Expo", "React", "Monorepo"],
  },
];

function RevealCard({ item, accent }: { item: Capability; accent: boolean }) {
  const Icon = item.icon;
  return (
    // tabIndex: the card itself is focusable so keyboard users get the
    // focus-within reveal.
    // h-112: enough headroom that even the chip-heavy Skills reveals leave
    // the disc visibly large while squeezed (the +4% scale stays readable).
    <div tabIndex={0} className="group flex h-112 flex-col outline-none">
      {/* Flexible child: shrinks as the detail area below grows. The disc
          keeps height:100% + square aspect capped by width, so it renders
          as a tall oval and visibly squeezes on reveal.
          Hovering floods the disc brand green and the icon flips white +
          swells slightly, the bold state. */}
      <div className="grid min-h-0 flex-1 place-items-center">
        {/* +4% scale offsets a bit of the reveal squeeze so the disc reads
            deliberate, not just crushed. */}
        <div className="grid aspect-square h-full max-w-full place-items-center rounded-full bg-secondary transition-[background-color,scale] duration-600 ease-[cubic-bezier(0.19,1,0.22,1)] group-focus-within:scale-[1.04] group-focus-within:bg-brand group-hover:scale-[1.04] group-hover:bg-brand">
          <Icon
            className={cn(
              "size-28 transition-[color,scale] duration-600 ease-[cubic-bezier(0.19,1,0.22,1)] group-focus-within:scale-110 group-focus-within:text-brand-foreground group-hover:scale-110 group-hover:text-brand-foreground sm:size-36",
              accent ? "text-brand" : "text-foreground",
            )}
            strokeWidth={2}
            aria-hidden
          />
        </div>
      </div>
      <div className="pt-6">
        <h4 className="text-2xl leading-tight font-medium sm:text-[1.8rem]">
          {item.title}
        </h4>
        <p className="mt-1 text-lg text-muted-foreground sm:text-[22px]">
          {item.role}
        </p>
        {/* The 0fr to 1fr grid-row trick: animatable auto-height, no JS. */}
        <div className="grid grid-rows-[0fr] overflow-clip transition-[grid-template-rows] duration-600 ease-[cubic-bezier(0.19,1,0.22,1)] group-focus-within:grid-rows-[1fr] group-hover:grid-rows-[1fr]">
          <div className="min-h-0 overflow-hidden">
            <p className="pt-4 text-[17px] leading-[1.8] text-muted-foreground">
              {item.body}
            </p>
            {item.chips && (
              <ul className="flex flex-wrap gap-2 pt-4 pb-1">
                {item.chips.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-border px-3 py-1 text-sm"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StickyCardSection({
  id,
  ariaLabel,
  label,
  blurb,
  items,
}: {
  id: string;
  ariaLabel: string;
  label: React.ReactNode;
  blurb: string;
  items: Capability[];
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className="px-6 py-32 sm:px-12 lg:px-0"
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="@container lg:col-span-3">
          <div className="lg:sticky lg:top-32">
            <FxHeading
              tag="h3"
              threshold={0.2}
              className="font-display leading-[0.85] tracking-[-0.01em] uppercase"
            >
              {label}
            </FxHeading>
            <p className="mt-6 max-w-sm text-base text-muted-foreground">
              {blurb}
            </p>
          </div>
        </div>
        {/* col 4 stays empty on lg for breathing room */}
        <div className="lg:col-span-8 lg:col-start-5">
          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2">
            {items.map((item, i) => (
              <RevealCard key={item.title} item={item} accent={i % 2 === 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SkillsSection() {
  return (
    <StickyCardSection
      id="skills"
      ariaLabel="Skills and stack"
      label={
        <span className="block text-[max(3rem,24cqw)]">
          Skills
          <span className="block">& Stack</span>
        </span>
      }
      blurb="The tools I actually use, grouped by what they're for."
      items={SKILLS}
    />
  );
}

export function ExperienceSection() {
  return (
    <StickyCardSection
      id="experience"
      ariaLabel="Experience"
      label={
        <span className="block text-[max(2.75rem,15.5cqw)]">Experience</span>
      }
      blurb="Three remote roles so far. Hover a card for what I did there."
      items={EXPERIENCE}
    />
  );
}
