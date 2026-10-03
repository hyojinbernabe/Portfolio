// Project rows. No links yet: rows open the preview but don't navigate.
// Images live in public/projects/<slug>.png, 1170x460.
export type Project = {
  title: string; // big row text
  image: string;
  alt: string;
};

const project = (title: string, slug: string, alt: string): Project => ({
  title,
  image: `/projects/${slug}.png`,
  alt,
});

export const PROJECTS: Project[] = [
  project("Globit Transient", "globit", "Globit Transient booking site"),
  project("Mini Redis", "mini-redis", "Mini Redis server answering redis-cli"),
  project("Collab Board", "collab-board", "Realtime collaborative board"),
  project("Repo Docs Chat", "repo-docs-chat", "Chat that answers questions about a repo's docs"),
  project("Phantom", "phantom", "Phantom desktop dashboard"),
  project("Hati", "hati", "Hati expense splitter app"),
  project("Job Highlighter", "job-highlighter", "Chrome extension highlighting job post skills"),
  project("Clinic Records", "clinic-records", "University clinic records system"),
  project("E-commerce Store", "ecommerce", "Laravel online store"),
  project("Freelance Market", "freelance-market", "Freelance marketplace design in Figma"),
  project("Retail Inventory", "retail-inventory", "Retail inventory system design"),
  project("CSV Cleanup", "csv-cleanup", "Python CSV cleanup scripts"),
];
