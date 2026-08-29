import type { Metadata } from "next";
import LegalPage, { Section } from "@/components/legal/LegalPage";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Terms & Conditions | ConstroBID",
  description:
    "The terms governing use of the ConstroBID inspection-managed construction marketplace.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="Please read these terms carefully before using ConstroBID."
    >
      <Section heading="1. About these terms">
        <p>
          These Terms &amp; Conditions govern your use of the {COMPANY.brandName} website and
          platform, operated by {COMPANY.legalName} (&ldquo;{COMPANY.brandName}&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or using the platform you
          agree to these terms. If you do not agree, please do not use the platform.
        </p>
        <p>
          CIN: {COMPANY.cin}
          <br />
          GSTIN: {COMPANY.gstin}
          <br />
          Registered office: {COMPANY.registeredAddress}
        </p>
      </Section>

      <Section heading="2. Eligibility and accounts">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            You must be at least 18 years old and able to enter a binding contract under Indian law.
          </li>
          <li>You agree to provide accurate information and to keep it up to date.</li>
          <li>
            You are responsible for activity on your account and for keeping your password secure.
          </li>
          <li>
            We may suspend or terminate an account that provides false information, misuses the
            platform, or breaches these terms.
          </li>
        </ul>
      </Section>

      <Section heading="3. Our role">
        <p>
          {COMPANY.brandName} is a marketplace and project-management platform. We provide
          inspection services, prepare design layouts and Bills of Quantity, verify contractor
          submissions, and facilitate communication between homeowners and contractors.
        </p>
        <p>
          <strong>The construction contract is between the homeowner and the contractor.</strong>{" "}
          {COMPANY.brandName} is not the builder and is not a party to that contract. We do not
          perform construction work and do not guarantee a contractor&rsquo;s workmanship, timeline
          or conduct. Our inspection and verification services are provided with reasonable care but
          do not amount to a warranty of the finished work.
        </p>
      </Section>

      <Section heading="4. Inspection, Design and BOQ">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Our inspection team visits the property, records measurements and prepares a design
            layout and Bill of Quantity based on what is observable at the time of the visit.
          </li>
          <li>
            Measurements, quantities and cost figures are professional estimates. Actual quantities
            and costs may vary once work begins, particularly where conditions are concealed at the
            time of inspection.
          </li>
          <li>
            Homeowners may request revisions to the Design and BOQ. After three revision requests on
            the same project, a {COMPANY.brandName} specialist will contact the homeowner directly
            and finalise the set on their behalf.
          </li>
        </ul>
      </Section>

      <Section heading="5. Fees and payments">
        <p>
          <strong>BOQ access fee.</strong> Viewing the Design layout is free. Unlocking the Bill of
          Quantity for a project requires a one-time payment of &#8377;{COMPANY.boqUnlockFeeInr}{" "}
          (inclusive of applicable taxes unless stated otherwise at checkout). This payment is per
          project and covers every subsequent BOQ revision for that project &mdash; you will not be
          charged again if you request changes.
        </p>
        <p>
          <strong>Payment processing.</strong> Payments are processed by Razorpay. We do not collect
          or store your card, UPI or banking credentials. Your use of the payment gateway is also
          subject to the payment provider&rsquo;s own terms.
        </p>
        <p>
          <strong>Contractor payments.</strong> Amounts payable to a contractor for construction
          work are governed by the agreement between the homeowner and that contractor.
        </p>
        <p>
          <strong>Changes to fees.</strong> We may revise platform fees. Any revision applies only to
          transactions made after the change is published.
        </p>
      </Section>

      <Section heading="6. Contractor obligations">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Contractors must submit accurate company, experience and identity details for
            verification, and may only bid once approved.
          </li>
          <li>
            Quotations must be genuine, and must reflect the scope defined in the approved Design and
            BOQ.
          </li>
          <li>
            Contractors must hold the licences, registrations and insurance required for the work
            they undertake, and must comply with applicable safety and labour laws.
          </li>
          <li>
            Attempting to take a project off-platform to avoid platform fees is a breach of these
            terms and may result in removal.
          </li>
        </ul>
      </Section>

      <Section heading="7. Homeowner obligations">
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide accurate property details and lawful access for the site inspection.</li>
          <li>
            Confirm that you own the property or are authorised by the owner to commission the work.
          </li>
          <li>Obtain any society, municipal or statutory permissions required for the work.</li>
        </ul>
      </Section>

      <Section heading="8. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Upload unlawful, misleading, infringing or offensive content.</li>
          <li>Impersonate another person or misrepresent your credentials.</li>
          <li>
            Share, resell, publish or redistribute a Design, BOQ or inspection report obtained
            through the platform to any third party outside your project.
          </li>
          <li>
            Attempt to access another user&rsquo;s data, bypass access controls or payment gates, or
            interfere with the platform&rsquo;s operation.
          </li>
          <li>Use automated tools to scrape or harvest data from the platform.</li>
        </ul>
      </Section>

      <Section heading="9. Intellectual property">
        <p>
          The platform, its software, branding and content are owned by {COMPANY.legalName}. Design
          layouts, Bills of Quantity and inspection reports prepared by our team are licensed to the
          homeowner for use on their own project only, and remain our intellectual property.
        </p>
        <p>
          Content you upload remains yours. By uploading it, you grant us a licence to host, process
          and display it as needed to operate the platform and deliver your project.
        </p>
      </Section>

      <Section heading="10. Disputes between users">
        <p>
          Where a dispute arises between a homeowner and a contractor, either party may raise it
          through the platform. Our team will review the record and may mediate, but our decision is
          not binding arbitration and does not restrict either party&rsquo;s legal rights.
        </p>
      </Section>

      <Section heading="11. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {COMPANY.brandName} is not liable for indirect,
          incidental or consequential loss, loss of profit, or loss arising from a
          contractor&rsquo;s acts or omissions. Our total liability for any claim relating to the
          platform is limited to the platform fees you paid to us in respect of the project
          concerned.
        </p>
        <p>Nothing in these terms excludes liability that cannot be excluded under Indian law.</p>
      </Section>

      <Section heading="12. Suspension and termination">
        <p>
          You may close your account at any time by contacting us. We may suspend or terminate access
          where these terms are breached, where required by law, or to protect other users.
          Obligations that by their nature survive termination will continue to apply.
        </p>
      </Section>

      <Section heading="13. Changes to these terms">
        <p>
          We may update these terms from time to time. The revised version takes effect when
          published on this page, with the &ldquo;last updated&rdquo; date amended. Continued use of
          the platform after that constitutes acceptance.
        </p>
      </Section>

      <Section heading="14. Governing law and jurisdiction">
        <p>
          These terms are governed by the laws of India. The courts at {COMPANY.jurisdiction} have
          exclusive jurisdiction over any dispute arising from them.
        </p>
      </Section>

      <Section heading="15. Contact">
        <p>
          {COMPANY.legalName}
          <br />
          {COMPANY.registeredAddress}
          <br />
          Email:{" "}
          <a href={`mailto:${COMPANY.supportEmail}`}>
            {COMPANY.supportEmail}
          </a>
          <br />
          Phone: {COMPANY.supportPhone}
        </p>
      </Section>
    </LegalPage>
  );
}
