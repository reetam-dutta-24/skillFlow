import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using SkillFlow: your account, Premium, what you share, and what SkillFlow can and cannot promise.",
};

const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreeing to these terms",
    body: (
      <>
        <p>
          These terms are an agreement between you and SkillFlow. By creating an account or using SkillFlow you accept them, and the{" "}
          <Link href="/privacy">Privacy Policy</Link>, which explains how your data is used. If you do not agree, do not use SkillFlow.
        </p>
      </>
    ),
  },
  {
    id: "age",
    title: "Who can use SkillFlow",
    body: (
      <p>
        You must be 18 or older to use SkillFlow on your own. If you are 13 to 17, a parent or guardian must agree to these terms and the
        Privacy Policy for you, and is responsible for your use of SkillFlow. SkillFlow is not for anyone under 13.
      </p>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <ul>
        <li>Give a real email address and keep your details accurate.</li>
        <li>Keep your password private. You are responsible for what happens under your account.</li>
        <li>One account per person. Do not share it or sign in as someone else.</li>
        <li>Tell us at {mail} if you think someone else is using your account.</li>
      </ul>
    ),
  },
  {
    id: "service",
    title: "What SkillFlow is",
    body: (
      <>
        <p>
          Thirty paths are free, with every stage, the explain-back, notes, and the certificate. Each stage gathers resources from other
          websites, and the next stage opens after you pass the explain-back on this one.
        </p>
        <p>
          A transcript lists the stages you passed. A certificate appears when every stage on a path is passed. Both are SkillFlow&apos;s own
          record of your explain-backs. They are not a degree, a license, or an accredited qualification, and you must not present them as
          one.
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "Reviews written by AI",
    body: (
      <p>
        Your explanations, recall answers, and practice answers are reviewed by an AI model. A review can be wrong, too strict, or too
        generous. It is feedback on your learning, not professional, medical, financial, legal, or safety advice. Paths such as Personal
        Finance, Nutrition, Emergency Preparedness, or Cybersecurity teach general knowledge; check anything important with a qualified
        person. Do not try to trick the review into passing an answer you did not write or do not understand.
      </p>
    ),
  },
  {
    id: "premium",
    title: "Premium",
    body: (
      <>
        <p>
          Premium is an optional subscription. It opens the niches outside the thirty free paths and lets you appear on the learner map. The
          price is shown on the <Link href="/upgrade">upgrade page</Link> before you pay.
        </p>
        <ul>
          <li>Stripe processes the payment. Its terms apply to the payment itself.</li>
          <li>The subscription renews each period until you cancel it.</li>
          <li>
            Cancel any time from Manage subscription on the upgrade page. Cancelling stops the next renewal; the Stripe page shows what
            happens to the period you already paid for.
          </li>
          <li>Payments are not refunded, except where the law requires it.</li>
          <li>The free paths stay open whether or not you have Premium.</li>
        </ul>
        <p>
          The Premium niches are still being built, and many have no stages yet. Premium lets you open and follow them now; their stages are
          added over time. If we change the price, we will tell you before it applies to your next renewal.
        </p>
      </>
    ),
  },
  {
    id: "content",
    title: "What you share",
    body: (
      <>
        <p>
          You keep ownership of what you write and upload: explanations, notes, Open Source contributions, suggested resources, events, and
          videos. You give SkillFlow a non-exclusive, worldwide, royalty-free permission to store, display, and adapt it as needed to run the
          app, for example to show a published contribution to other learners or a live video in a niche&apos;s clip feed. That permission
          ends when you delete the item or your account, except for copies already shared under these terms.
        </p>
        <p>
          Share only what you have the right to share. A video you upload must be yours. A contribution must credit its sources. Moderators
          review contributions, events, and videos before they are public, and may decline or hide them with a reason.
        </p>
      </>
    ),
  },
  {
    id: "rules",
    title: "Rules",
    body: (
      <>
        <p>Do not use SkillFlow to:</p>
        <ul>
          <li>break the law, or help someone else break it;</li>
          <li>harass, threaten, or impersonate anyone, or share someone else&apos;s personal data;</li>
          <li>post hateful, sexual, violent, or misleading content, or spam;</li>
          <li>share material that infringes someone&apos;s copyright or other rights;</li>
          <li>upload malware, or probe, overload, or break the service or its security;</li>
          <li>scrape the app, or reach Premium or a locked stage by getting around the checks;</li>
          <li>submit fake events, or links that lead somewhere other than what they claim.</li>
        </ul>
        <p>We may remove content that breaks these rules, and suspend or close an account that breaks them seriously or repeatedly.</p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "Other websites",
    body: (
      <p>
        Lessons link to videos, articles, and courses on websites we do not run. They belong to their owners, can change or disappear, and
        have their own terms. We check the links we publish but cannot promise every one stays available or accurate. Events on Nearby come
        from Ticketmaster, Google, and other learners; SkillFlow does not organise them or sell tickets.
      </p>
    ),
  },
  {
    id: "ours",
    title: "SkillFlow's own material",
    body: (
      <p>
        The SkillFlow name, design, code, and the way paths are put together belong to SkillFlow. You may use them to learn on SkillFlow. You
        may not copy, resell, or build a competing service from them.
      </p>
    ),
  },
  {
    id: "ending",
    title: "Closing your account",
    body: (
      <p>
        You can stop using SkillFlow at any time. To delete your account, write to {mail}; the{" "}
        <Link href="/privacy#keep">Privacy Policy</Link> explains what is removed. If you have Premium, cancel it first so it does not renew.
        We may close an account under the Rules section, or if we stop offering SkillFlow, and will tell you in advance where we reasonably
        can.
      </p>
    ),
  },
  {
    id: "warranty",
    title: "No guarantees",
    body: (
      <p>
        We work to keep SkillFlow running and correct, but it is provided as it is and as available. We do not promise it will always be
        available, free of errors, or that passing a path will lead to a job, a grade, or any other result.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limits on liability",
    body: (
      <p>
        To the extent the law allows, SkillFlow is not liable for indirect or consequential losses, such as lost opportunities or lost data,
        arising from your use of the service. Our total liability for any claim is limited to the amount you paid SkillFlow in the twelve
        months before the claim, or ₹1,000 if you paid nothing. Nothing in these terms limits a liability that the law does not allow to be
        limited.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of India. Before going to court, write to {mail} and give us 30 days to put things right. If a
        dispute is not resolved, the courts of India have jurisdiction.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms as SkillFlow changes. We will change the date at the top, and tell you in the app or by email before a
        change that affects your rights or your payments applies. Using SkillFlow after that means you accept the new terms.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      lede="The rules for using SkillFlow: your account, Premium, what you share, and what SkillFlow can and cannot promise."
      summary={[
        "18 or older, or 13 to 17 with a parent or guardian's consent.",
        "Thirty paths are free. Premium is optional and can be cancelled any time.",
        "AI reviews can be wrong, and a SkillFlow certificate is not a degree or a license.",
        "You own what you share; moderators review it before it is public.",
        "Indian law applies.",
      ]}
      sections={sections}
      other={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
