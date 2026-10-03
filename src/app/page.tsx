import { HeroSection } from "@/components/sections/hero-section";
import { ProjectsShowcase } from "@/components/sections/projects-showcase";
import { AboutSection } from "@/components/sections/about-section";
import { MarqueeBand } from "@/components/sections/marquee-band";
import { ProcessSection } from "@/components/sections/process-section";
import { PitchSection } from "@/components/sections/pitch-section";
import {
  SkillsSection,
  ExperienceSection,
} from "@/components/sections/capability-sections";

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
      <PitchSection />
    </>
  );
}
