import type { Metadata } from "next";
import LegalPage, { Section } from "@/components/legal/LegalPage";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "About Us | ConstroBID",
  description:
    "ConstroBID is an inspection-managed construction and interior marketplace connecting homeowners with verified builders across India.",
};

export default function AboutPage() {
  return (
    <LegalPage
      title="About Us"
      intro="An inspection-managed marketplace for construction and interior projects."
    >
      <Section heading="Who we are">
        <p>
          {COMPANY.legalName} operates {COMPANY.brandName}, an online platform that connects
          homeowners planning construction, renovation and interior projects with verified
          contractors across India. We are registered in India with our office at{" "}
          {COMPANY.registeredAddress}.
        </p>
      </Section>

      <Section heading="What makes us different">
        <p>
          Most marketplaces introduce a homeowner to a builder and step away. We do not. Every
          project on {COMPANY.brandName} passes through our own inspection team before a single
          quote is compared.
        </p>
        <p>
          Our inspectors visit the property, measure it, document its condition, and prepare the
          design layout and the Bill of Quantity (BOQ) themselves. Contractors then bid against
          that same verified scope. Because everyone is quoting for identical work, the homeowner
          is comparing like with like — not guessing why one estimate is half the price of another.
        </p>
      </Section>

      <Section heading="How a project works">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Post your requirement.</strong> The homeowner shares the property details,
            budget, category and photographs.
          </li>
          <li>
            <strong>Site inspection.</strong> Our inspection team schedules a visit, measures the
            property and records its condition.
          </li>
          <li>
            <strong>Design &amp; BOQ.</strong> The inspector prepares the layout and the Bill of
            Quantity and shares both with the homeowner.
          </li>
          <li>
            <strong>Revisions.</strong> The homeowner can request changes; the inspector issues a
            revised set. Beyond three revisions a ConstroBID specialist takes over personally.
          </li>
          <li>
            <strong>Verified bidding.</strong> Registered contractors submit quotations against the
            approved scope. Our team reviews each one before the homeowner sees it.
          </li>
          <li>
            <strong>Selection and execution.</strong> The homeowner chooses a contractor. Work
            progress, site visits and quality audits are logged on the platform.
          </li>
          <li>
            <strong>Completion.</strong> Our inspectors verify the finished work before handover is
            approved.
          </li>
        </ol>
      </Section>

      <Section heading="Verified contractors">
        <p>
          Contractors do not self-certify on {COMPANY.brandName}. Each applicant submits company
          details, experience and identity documents, which our team reviews before the account is
          approved to bid. Contractors who fail verification cannot quote on projects.
        </p>
      </Section>

      <Section heading="Who we serve">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Homeowners</strong> who want an independent, measured scope and comparable
            quotes rather than sales estimates.
          </li>
          <li>
            <strong>Contractors and builders</strong> who want to bid on genuine, pre-inspected
            projects instead of chasing unqualified leads.
          </li>
        </ul>
      </Section>

      <Section heading="Contact us">
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
