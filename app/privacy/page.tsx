import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What SkillFlow collects, why, who else handles it, and how to see, change, or delete it.",
};

const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

const sections: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <>
        <p>
          SkillFlow is a learning app. You follow a path, open a stage of real resources, and explain each idea back in your own words before
          the stage is recorded. This policy covers the SkillFlow website and app. SkillFlow decides why and how your personal data is used, so
          it is the Data Fiduciary for that data under India&apos;s Digital Personal Data Protection Act, 2023.
        </p>
        <p>Questions and requests go to {mail}.</p>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <h3>Your account</h3>
        <ul>
          <li>Your name and email address.</li>
          <li>Your password, stored only as a one-way bcrypt hash. We cannot read it.</li>
          <li>
            If you sign in with Google: your Google account ID, name, email address, whether Google verified that email, and your profile photo.
            We do not get your Google password or access to your Gmail, Drive, or contacts.
          </li>
          <li>Your role (learner, or admin for the team).</li>
        </ul>
        <h3>Your learning</h3>
        <ul>
          <li>The paths you follow.</li>
          <li>
            What you tell us in onboarding: your age range, whether a parent or guardian agreed (for ages 13 to 17), what you are doing now
            (school, college, work, and so on), your goals, experience, pace, weekly time, how you like to learn, the languages you learn in,
            and an optional one-line headline. The headline is shown on your public profile; the rest is private.
          </li>
          <li>Your explain-back answers, the written review each one received, and the ideas kept as notes.</li>
          <li>Answers to recall cards, the stages you passed and when, your streak, and your mastery on each path.</li>
          <li>
            Personal plan preferences if you set them: level, time per week, deadline, resource types, language, goal, data and caption needs,
            and topics you already know. If you describe your goals in your own words, we keep the preferences, not that description.
          </li>
          <li>Practice notes, and the link, file, or passage you practised against.</li>
          <li>
            If you take the career-fit test: your answers to its 180 questions, the personality and interest scores worked out from them,
            and your written report. The test is optional, and you can delete it at any time from the report.
          </li>
          <li>Your theme and accent color.</li>
        </ul>
        <h3>Your city, only if you add it</h3>
        <p>
          In Settings you can save a city. We store the city name, the country, and the coordinates of the city centre. We never read your
          device&apos;s location or GPS. &ldquo;Show me on the learner map&rdquo; is off until you turn it on.
        </p>
        <h3>What you share</h3>
        <ul>
          <li>Open Source contributions: text, images or image links, and source links, plus the questions and answers on them.</li>
          <li>Resources you suggest through Submit, and events you submit to Nearby.</li>
          <li>Videos you upload to the Creator studio, with their title and description.</li>
        </ul>
        <h3>Payments</h3>
        <p>
          If you buy Premium, Stripe collects your card details on its own page. We never see or store your card number. We keep the Stripe
          customer and subscription IDs, the subscription status, the price, and when the current period ends.
        </p>
        <h3>How the app is used</h3>
        <ul>
          <li>Which Open Source contributions you have opened, so a niche can show how many are new to you.</li>
          <li>Plays of creator videos: seconds watched and whether a play reached most of the video. The creator sees totals, never who watched.</li>
          <li>A count of calls to outside event services, to keep within their limits. That count is not linked to you.</li>
        </ul>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <ul>
        <li>To run your account, sign you in, and keep you signed in.</li>
        <li>To review your explanations, record the stages you pass, and open the next one.</li>
        <li>To show your progress, streak, notes, transcript, and certificate, and to build a personal plan if you ask for one.</li>
        <li>To give Premium to a paid account and stop it when the subscription ends.</li>
        <li>To review what people share before it is public, and to hide what breaks these rules.</li>
        <li>To count learners per city on the map, and to list events near the city you saved.</li>
        <li>To keep the service secure and to fix problems.</li>
      </ul>
    ),
  },
  {
    id: "basis",
    title: "Why we may use it",
    body: (
      <>
        <p>
          We process your data with your consent, which you give when you create an account and agree to this policy, and for the
          legitimate uses the law allows, such as keeping the service secure or meeting a legal duty. Some parts depend on a choice you make
          later: saving a city, appearing on the map, buying Premium, or sharing a contribution.
        </p>
        <p>
          You can withdraw consent at any time by writing to {mail}. Withdrawing means we stop that processing and, for your account as a
          whole, close and delete it. It does not undo what was done before.
        </p>
      </>
    ),
  },
  {
    id: "others",
    title: "Who else handles it",
    body: (
      <>
        <p>We do not sell your data and we do not show advertising. These services handle a part of it so the app can work:</p>
        <ul>
          <li>
            <strong>Google (Gemini) or OpenAI.</strong> Your explanation, the idea it is about, and that stage&apos;s title and notes are sent
            to an AI model, which writes the review. The same goes for recall answers, practice answers, note summaries, and a plan
            description you write. For the career-fit report, only your scores, your onboarding goals and stage, and the names and first
            stages of your top paths are sent, never your 180 answers. Your name and email are not sent.
          </li>
          <li>
            <strong>Google sign-in.</strong> If you choose Continue with Google, Google confirms who you are and shares the details listed
            above. Google&apos;s own policy applies to that sign-in.
          </li>
          <li>
            <strong>Stripe.</strong> Payments and the customer portal where you manage or cancel Premium.
          </li>
          <li>
            <strong>OpenStreetMap.</strong> The text you type in the city search goes to Nominatim. Map images load from OpenStreetMap&apos;s
            tile servers, which see your IP address, as any website you load does.
          </li>
          <li>
            <strong>YouTube.</strong> Lesson videos use YouTube&apos;s privacy-enhanced player and load only when you press play. YouTube&apos;s
            own policy applies to what it collects.
          </li>
          <li>
            <strong>Ticketmaster and SerpApi.</strong> To find events we send a city and a few search words for a niche, never your identity.
          </li>
          <li>
            <strong>Pages you practise against.</strong> When you give a link, our server fetches that page to read its text.
          </li>
        </ul>
        <p>
          Lessons link to websites run by other people. When you open one, that site&apos;s own policy applies. Some of these services may
          process data outside India.
        </p>
      </>
    ),
  },
  {
    id: "public",
    title: "What other people can see",
    body: (
      <ul>
        <li>
          Your profile, with your name, your photo if you have one, the names of the paths you follow, your published contributions, and your
          live videos, can be seen by other signed-in learners.
        </li>
        <li>A contribution or a video becomes visible only after a moderator approves it, with your name on it.</li>
        <li>
          Your transcript and certificate pages show your name and the stages you passed with their dates. Anyone with the link can open them.
          Search engines are told not to index them.
        </li>
        <li>
          The learner map shows a number per city and never a name. A city with fewer than five learners who opted in is not shown at all.
        </li>
        <li>Your explanations, notes, recall answers, plan, city, progress, and career-fit test results are private to you.</li>
        <li>A career-fit image leaves SkillFlow only when you download it and share it yourself.</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and storage on your device",
    body: (
      <>
        <p>SkillFlow uses only what it needs to work. There are no advertising or tracking cookies and no third-party analytics.</p>
        <ul>
          <li>
            <strong>Sign-in cookie.</strong> Keeps you signed in. It is required.
          </li>
          <li>
            <strong>
              <code>skillflow-theme</code> and <code>skillflow-accent</code>.
            </strong>{" "}
            Remember light or dark, and your accent color.
          </li>
          <li>
            <strong>
              <code>skillflow-recall-hold</code>.
            </strong>{" "}
            Remembers a recall card until you answer it. It ends when you close the browser.
          </li>
          <li>
            <strong>Browser storage.</strong> An unsent explain-back draft stays on your device until the stage is saved, and a practice
            result stays until the tab is closed. Neither is sent to us until you submit.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: (
      <>
        <p>
          We keep your account data while your account is open. When you ask us to delete your account, we delete it and the data linked to
          it, including your answers, notes, plan, city, progress, and career-fit results. Retaking or deleting the career-fit test removes
          its answers and report straight away. Your published contributions and videos are removed with it.
        </p>
        <p>
          We may keep a small amount for longer where the law requires it, for example payment records, which Stripe also keeps under its
          own legal duties. We also remove an inactive account&apos;s data once it is no longer needed for the purpose it was collected for.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the Digital Personal Data Protection Act, 2023, you can:</p>
        <ul>
          <li>Ask for a summary of the personal data we hold about you, and who we shared it with.</li>
          <li>Ask us to correct, complete, or update it. You can change your name and city yourself in Settings.</li>
          <li>Ask us to erase it, which closes your account.</li>
          <li>Withdraw your consent.</li>
          <li>Nominate someone to act for you if you die or cannot act yourself.</li>
          <li>Complain to us, and if we do not resolve it, to the Data Protection Board of India.</li>
        </ul>
        <p>
          Write to {mail}. We will reply within 30 days. There is no self-serve delete button yet, so deletion is done by request.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        You must be 18 to use SkillFlow on your own. Learners aged 13 to 17 may use it only with the consent of a parent or guardian, who
        agrees to this policy for them. SkillFlow is not for children under 13. We do not track children or show them targeted advertising.
        If you believe a child is using SkillFlow without that consent, write to {mail} and we will delete the account.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        Passwords are stored as hashes, admin pages check the account&apos;s role on every request, and card details never reach our servers.
        No system is perfectly secure. If we learn of a breach that affects your data, we will tell you and the Data Protection Board of India
        as the law requires.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        When we change this policy, we update the date at the top. If a change affects how we use data you have already given us, we will tell
        you in the app or by email before it applies. The <Link href="/terms">Terms of Service</Link> cover the rest of how SkillFlow works.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      lede="What SkillFlow collects, why, who else handles it, and how to see, change, or delete it."
      summary={[
        "We collect what the app needs: your account, your learning, and what you choose to share.",
        "Your explanations are reviewed by an AI model. Your name and email are not sent to it.",
        "No advertising, no tracking cookies, and we never sell your data.",
        "Your city is optional, never your GPS, and the map shows counts, never names.",
        `Write to ${LEGAL_CONTACT_EMAIL} to see, correct, or delete your data.`,
      ]}
      sections={sections}
      other={{ href: "/terms", label: "Terms of Service" }}
    />
  );
}
