import { HeroSection } from "@/components/sections/hero-section";
import { AboutSection } from "@/components/sections/about-section";
import { ProcessSection } from "@/components/sections/process-section";
import {
  SkillsSection,
  ExperienceSection,
} from "@/components/sections/capability-sections";
import { MarqueeBand } from "@/components/sections/marquee-band";
import { ProjectsShowcase } from "@/components/sections/projects-showcase";

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ProcessSection />
      <SkillsSection />
      <ExperienceSection />
      <MarqueeBand />
      <ProjectsShowcase />
    </>
  );
}
