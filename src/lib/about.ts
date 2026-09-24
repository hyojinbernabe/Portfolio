export type AboutChapter = {
  /** Two heading lines, rendered stacked in the display font. */
  title: [string, string];
  description: string;
  /** Exactly three short keyword tags, stacked bottom-left of the card. */
  tags: [string, string, string];
};

export const ABOUT_BIO =
  "I'm Hyojin, a developer from Baguio. I build web and mobile apps in " +
  "TypeScript, React, Next.js, and Flutter, and my favorite part is when an " +
  "idea finally turns into something people can click on.";

export const ABOUT_CHAPTERS: AboutChapter[] = [
  {
    title: ["Who", "I am"],
    description:
      "A computer science grad from the University of Baguio. I'd rather ship something small than plan something huge.",
    tags: ["Developer", "CS grad", "Baguio"],
  },
];
