import type { Metadata } from "next";
import LegalPage, { Section } from "@/components/legal/LegalPage";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Privacy Policy | ConstroBID",
  description:
    "How ConstroBID collects, uses, shares and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="How we collect, use and protect your personal data."
    >
      <Section heading="1. Introduction">
        <p>
          {COMPANY.legalName} (&ldquo;{COMPANY.brandName}&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;) operates the {COMPANY.brandName} platform. This policy explains what
          personal data we collect, why we collect it, who we share it with, and the rights you have
          over it.
        </p>
        <p>
          We handle personal data in accordance with applicable Indian law, including the Digital
          Personal Data Protection Act, 2023 and the Information Technology Act, 2000 with its
          rules.
        </p>
      </Section>

      <Section heading="2. Data we collect">
        <p>
          <strong>Account data.</strong> Name, email address, phone number, password (stored only in
          hashed form) and your role on the platform.
        </p>
        <p>
          <strong>Homeowner project data.</strong> Property address and city, property type, area,
          budget, project category and description, and any photographs or documents you upload.
        </p>
        <p>
          <strong>Contractor verification data.</strong> Company name, years of experience, service
          cities, contact details, and identity documents including PAN and Aadhaar details, which
          we collect to verify that a contractor is genuine before allowing them to bid.
        </p>
        <p>
          <strong>Project activity data.</strong> Messages exchanged on the platform, design layouts
          and Bills of Quantity, inspection reports and site photographs, quotations, progress
          updates and dispute records.
        </p>
        <p>
          <strong>Payment data.</strong> Transaction records including order and payment reference
          identifiers, amount and status.{" "}
          <strong>
            We do not collect or store card numbers, UPI PINs, CVVs or net-banking credentials.
          </strong>{" "}
          Those are handled entirely by our payment gateway.
        </p>
        <p>
          <strong>Technical data.</strong> Log data such as IP address, browser type and timestamps,
          used to keep the platform secure and working.
        </p>
      </Section>

      <Section heading="3. Sensitive personal data">
        <p>
          Aadhaar and PAN details collected from contractors are sensitive. We collect them only for
          identity verification, restrict access to authorised verification staff, do not use them
          for marketing, and never sell them. Homeowners are never shown a contractor&rsquo;s
          Aadhaar or PAN.
        </p>
      </Section>

      <Section heading="4. Why we use your data">
        <ul className="list-disc space-y-2 pl-5">
          <li>To create and manage your account.</li>
          <li>To schedule inspections and prepare your Design and Bill of Quantity.</li>
          <li>To verify contractors and review the quotations they submit.</li>
          <li>To let homeowners, inspectors and contractors communicate about a project.</li>
          <li>To process payments and maintain transaction records.</li>
          <li>To send service notifications such as inspection updates and new messages.</li>
          <li>To investigate disputes, prevent fraud and secure the platform.</li>
          <li>To meet legal, tax and regulatory obligations.</li>
        </ul>
      </Section>

      <Section heading="5. Who we share data with">
        <p>We share personal data only as needed to run the platform:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Between project participants.</strong> A homeowner&rsquo;s project scope and
            property location are shared with our inspection team, and with contractors bidding on
            that project. Contractors see the information needed to quote, not your identity
            documents.
          </li>
          <li>
            <strong>Payment gateway (Razorpay).</strong> To process payments and confirm them.
          </li>
          <li>
            <strong>Cloud storage and hosting providers.</strong> Including Cloudinary, where
            uploaded images and documents are stored.
          </li>
          <li>
            <strong>Email service providers.</strong> To deliver transactional email.
          </li>
          <li>
            <strong>Authorities.</strong> Where disclosure is required by law or to establish or
            defend a legal claim.
          </li>
        </ul>
        <p>We do not sell your personal data, and we do not share it for third-party advertising.</p>
      </Section>

      <Section heading="6. Uploaded files and links">
        <p>
          Files you upload &mdash; project photographs, designs, Bills of Quantity, inspection
          reports and quotation documents &mdash; are stored with our cloud storage provider. Access
          within the platform is restricted to the participants on that project, and a Bill of
          Quantity is released to a homeowner only once the applicable access fee is paid.
        </p>
      </Section>

      <Section heading="7. How long we keep data">
        <p>
          We keep account and project data for as long as your account is active and afterwards only
          for as long as needed to meet legal, tax, accounting or dispute-resolution obligations.
          Payment records are retained for the period required by Indian tax law. Data no longer
          needed is deleted or anonymised.
        </p>
      </Section>

      <Section heading="8. Security">
        <p>
          We use access controls, encrypted transport (HTTPS), hashed passwords and role-based
          permissions to protect your data. No system is completely secure, but we work to protect
          personal data against unauthorised access, alteration and disclosure, and will notify you
          and the relevant authority of a breach where the law requires it.
        </p>
      </Section>

      <Section heading="9. Your rights">
        <p>Subject to applicable law, you may:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Access the personal data we hold about you.</li>
          <li>Ask us to correct data that is inaccurate or incomplete.</li>
          <li>Ask us to delete data we no longer need to keep.</li>
          <li>Withdraw consent where our processing relies on it.</li>
          <li>Raise a grievance about how your data has been handled.</li>
        </ul>
        <p>
          To exercise any of these, email us at{" "}
          <a href={`mailto:${COMPANY.supportEmail}`}>
            {COMPANY.supportEmail}
          </a>
          . We may need to verify your identity before acting on a request.
        </p>
        <p>
          Please note that deleting certain data may end our ability to provide the service &mdash;
          for example, a contractor whose verification documents are deleted can no longer bid.
        </p>
      </Section>

      <Section heading="10. Cookies">
        <p>
          We use cookies and similar browser storage to keep you signed in and to remember
          preferences such as the conversation you last had open. We do not use advertising cookies.
          You can clear or block cookies in your browser, though signing in will not work without
          them.
        </p>
      </Section>

      <Section heading="11. Children">
        <p>
          The platform is not intended for anyone under 18, and we do not knowingly collect data from
          children. If you believe a child has provided us data, contact us and we will delete it.
        </p>
      </Section>

      <Section heading="12. Changes to this policy">
        <p>
          We may update this policy. The revised version takes effect when published on this page,
          with the &ldquo;last updated&rdquo; date amended. Where a change materially affects your
          rights, we will make reasonable efforts to notify you.
        </p>
      </Section>

      <Section heading="13. Grievance Officer">
        <p>
          In line with Indian law, you may contact our Grievance Officer for any complaint about
          your personal data:
        </p>
        <p>
          {COMPANY.grievanceOfficer.name}
          <br />
          {COMPANY.legalName}
          <br />
          {COMPANY.registeredAddress}
          <br />
          Email:{" "}
          <a href={`mailto:${COMPANY.grievanceOfficer.email}`}
          >
            {COMPANY.grievanceOfficer.email}
          </a>
        </p>
        <p>We aim to acknowledge complaints within 48 hours and resolve them within 30 days.</p>
      </Section>
    </LegalPage>
  );
}
