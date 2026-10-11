// Project rows. Rows with an href link to the repo, the rest only open the preview.
// Images live in public/projects/<slug>.png, 1170x460.
export type Project = {
  title: string; // big row text
  image: string;
  alt: string;
  href?: string;
};

const project = (
  title: string,
  slug: string,
  alt: string,
  href?: string,
): Project => ({
  title,
  image: `/projects/${slug}.png`,
  alt,
  href,
});

const repo = (name: string) => `https://github.com/hyojinbernabe/${name}`;

export const PROJECTS: Project[] = [
  project("Globit Transient", "globit", "Globit Transient booking site"),
  project(
    "Mini Redis",
    "mini-redis",
    "Mini Redis server answering redis-cli",
    repo("mini-redis"),
  ),
  project(
    "Collab Board",
    "collab-board",
    "Realtime collaborative board",
    repo("collab-board"),
  ),
  project(
    "Repo Docs Chat",
    "repo-docs-chat",
    "Chat that answers questions about a repo's docs",
    repo("repo-docs-chat"),
  ),
  project("Phantom", "phantom", "Phantom desktop dashboard"),
  project("Hati", "hati", "Hati expense splitter app", repo("hati")),
  project(
    "Job Highlighter",
    "job-highlighter",
    "Chrome extension highlighting job post skills",
    repo("job-post-highlighter"),
  ),
  project(
    "Clinic Records",
    "clinic-records",
    "University clinic records system",
  ),
  project("E-commerce Store", "ecommerce", "Laravel online store"),
  project(
    "Freelance Market",
    "freelance-market",
    "Freelance marketplace design in Figma",
  ),
  project(
    "Retail Inventory",
    "retail-inventory",
    "Retail inventory system design",
  ),
  project("CSV Cleanup", "csv-cleanup", "Python CSV cleanup scripts"),
];
