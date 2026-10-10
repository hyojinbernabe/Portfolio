export type NavSection = { id: string; label: string };

// One source of truth for both the right-bar scroll-spy dots and the
// menu overlay. Only list sections that actually render an element with this id.
export const SECTIONS: NavSection[] = [
  { id: "hero", label: "Home" },
  { id: "about", label: "About" },
  { id: "process", label: "Process" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Projects" },
];

// Email link for the social rail / menu.
export const EMAIL_HREF = "mailto:hyojinbernabe7@gmail.com";
