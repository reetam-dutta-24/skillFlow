import Link from "next/link";
import { Icon } from "@/components/core/Icon.jsx";

/**
 * The top bar's create buttons, where other platforms put them: Create content (primary, to the Creator studio) and
 * Submit a resource (secondary). Labels shorten on smaller screens; on a phone only the round Create button stays and
 * Submit a resource lives in the account menu.
 */
export function CreateActions() {
  return (
    <div className="sf-create-actions">
      <Link className="sf-btn sf-btn--gradient sf-btn--sm sf-create-primary" href="/creator" aria-label="Create content">
        <Icon name="plus" size={14} />
        <span className="sf-create-full" aria-hidden="true">
          Create content
        </span>
        <span className="sf-create-short" aria-hidden="true">
          Create
        </span>
      </Link>
      <Link className="sf-btn sf-btn--outline sf-btn--sm sf-create-secondary" href="/submit" aria-label="Submit a resource">
        <Icon name="file-plus" size={14} />
        <span className="sf-create-full" aria-hidden="true">
          Submit a resource
        </span>
        <span className="sf-create-short" aria-hidden="true">
          Submit
        </span>
      </Link>
    </div>
  );
}
