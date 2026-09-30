import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

const components: Components = {
  img: () => null,
  a: ({ href, children }) => (
    <a href={href} rel="nofollow ugc noopener noreferrer" target="_blank">
      {children}
    </a>
  ),
};

/** Community writing. Raw HTML and images stay out. */
export function CommunityMarkdown({ text }: { text: string }) {
  return (
    <div className="sf-community-md">
      <ReactMarkdown components={components}>{text}</ReactMarkdown>
    </div>
  );
}
