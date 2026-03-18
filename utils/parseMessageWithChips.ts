interface ParsedChipLink {
  title: string;
  url: string;
}

interface ParsedMessageWithChips {
  cleanText: string;
  links: ParsedChipLink[];
}

const VERIFIED_RESOURCES_HEADING = '### Verified Resources';
const MARKDOWN_LINK_REGEX = /-\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

export const parseMessageWithChips = (text: string): ParsedMessageWithChips => {
  const headingIndex = text.indexOf(VERIFIED_RESOURCES_HEADING);
  if (headingIndex === -1) {
    return {
      cleanText: text,
      links: [],
    };
  }

  const cleanText = text.slice(0, headingIndex).trimEnd();
  const resourcesBlock = text.slice(headingIndex + VERIFIED_RESOURCES_HEADING.length);
  const links: ParsedChipLink[] = [];
  const seenUrls = new Set<string>();

  for (const match of resourcesBlock.matchAll(MARKDOWN_LINK_REGEX)) {
    const title = match[1]?.trim();
    const url = match[2]?.trim();

    if (!title || !url || seenUrls.has(url)) {
      continue;
    }

    seenUrls.add(url);
    links.push({ title, url });
  }

  return {
    cleanText: cleanText || text.trim(),
    links,
  };
};

export type { ParsedChipLink, ParsedMessageWithChips };
