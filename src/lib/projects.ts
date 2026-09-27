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
];
