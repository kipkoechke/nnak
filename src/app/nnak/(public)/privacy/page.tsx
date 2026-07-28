import Link from "next/link";
import { MdArrowBack } from "react-icons/md";

export const metadata = {
  title: "Privacy Policy · NNAK",
  description:
    "How the National Nurses Association of Kenya collects, uses and safeguards your personal data.",
};

/**
 * Public Privacy Policy, linked from the consent checkbox on the registration
 * and account-claim forms. Content mirrors the NNAK Digital Platform Privacy
 * Policy (last updated July 2026).
 */
export default function PrivacyPolicyPage() {
  return (
    <article className="prose-sm max-w-none text-slate-700">
      <div className="mb-5">
        <Link
          href="/nnak/login"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <MdArrowBack className="w-4 h-4" /> Back
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          NNAK Digital Platform Privacy Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1">Last updated: July 2026</p>
      </header>

      <p className="text-sm leading-relaxed">
        The National Nurses Association of Kenya (&ldquo;NNAK&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to
        protecting the privacy and security of your personal data. This Privacy
        Policy explains how we collect, use, disclose, and safeguard your
        personal and professional information when you register and utilize the
        NNAK Digital Member Portal and Event Management System. This Policy is
        formulated in accordance with the Kenya Data Protection Act, 2019. By
        checking the consent box at registration, you explicitly authorize the
        processing of your data as described herein.
      </p>

      <Section title="1. Data We Collect">
        <p>
          To manage your membership and provide self-service access, we process
          the following categories of data:
        </p>
        <ul>
          <li>
            <strong>Personal Identification &amp; Contact Data:</strong> Full
            Name, National ID/Passport Number, Phone Number, Email Address, and
            Passport Photo.
          </li>
          <li>
            <strong>Professional Data:</strong> Nursing Council of Kenya (NCK)
            Registration Number, Nurse Cadre, Primary Employer/Institution, and
            Branch/County affiliation.
          </li>
          <li>
            <strong>Financial &amp; Transaction Data:</strong> Mobile money
            (M-Pesa) number, transaction reference codes, payment dates,
            subscription amounts, and monthly branch check-off/by-product
            remittance details.
          </li>
          <li>
            <strong>System Usage Data:</strong> Login credentials (securely
            hashed), IP addresses, access timestamps, and immutable audit trails
            of account modifications.
          </li>
        </ul>
      </Section>

      <Section title="2. Purpose of Data Processing">
        <p>
          Your data is processed under legal bases defined by the Data
          Protection Act, 2019, specifically for:
        </p>
        <ul>
          <li>
            <strong>Contractual Obligation:</strong> Validating your membership
            eligibility, assigning pricing tiers, creating your Digital
            Membership ID, and enabling online event registration.
          </li>
          <li>
            <strong>Legitimate Interests:</strong> Automating renewal reminders,
            verifying event attendance via QR code scanning, and generating
            operational analytics to improve association management.
          </li>
          <li>
            <strong>Legal Compliance:</strong> Keeping financial logs for
            mandatory statutory tax and audit.
          </li>
        </ul>
      </Section>

      <Section title="3. Data Retention and Archiving">
        <p>
          NNAK enforces strict information lifecycle rules to prevent indefinite
          data storage:
        </p>
        <ul>
          <li>
            <strong>Active Records:</strong> Your profile data is retained for
            the entire duration of your active membership plus seven (7) years
            post-lapse.
          </li>
          <li>
            <strong>Automated Archiving:</strong> If an account remains
            completely inactive (no logins, payments, or event interactions) for
            more than three (3) consecutive years, the platform automatically
            transitions your record to &ldquo;Archived&rdquo; status, removing
            it from active views while locking the history securely for audit
            purposes.
          </li>
          <li>
            <strong>Financial Records:</strong> Pursuant to Kenyan financial
            laws, all payment and transactional logs are retained for a
            mandatory minimum of seven (7) years.
          </li>
        </ul>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Data Category</th>
                <th className="px-3 py-2 font-semibold">Active Retention</th>
                <th className="px-3 py-2 font-semibold">Archive Trigger</th>
                <th className="px-3 py-2 font-semibold">Max Retention</th>
                <th className="px-3 py-2 font-semibold">Disposal Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RETENTION_ROWS.map((r) => (
                <tr key={r[0]}>
                  {r.map((cell, i) => (
                    <td
                      key={i}
                      className={`px-3 py-2 align-top ${i === 0 ? "font-medium text-slate-800" : "text-slate-600"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="4. Data Sharing and Third-Party Disclosures">
        <p>
          We do not sell your data. Your data is shared strictly with authorized
          partners under data processing agreements:
        </p>
        <ul>
          <li>
            <strong>Technology Providers:</strong> Data Systems Engineering Ltd
            (DSE) handles technical administration and continuous system
            maintenance.
          </li>
          <li>
            <strong>Payment Gateways:</strong> Safaricom M-Pesa Daraja API
            triggers payment requests and processes real-time subscription
            renewals.
          </li>
          <li>
            <strong>Branch Administrators:</strong> Local branch executives are
            granted access strictly to membership numbers within their
            geographical county bounds.
          </li>
        </ul>
      </Section>

      <Section title="5. Data Security Measures">
        <ul>
          <li>
            <strong>Access Control:</strong> Strict Role-Based Access Control
            (RBAC) ensures only authorized officers see specific fields.
          </li>
          <li>
            <strong>Encryption:</strong> Personal and financial data are
            encrypted both during transmission (in-transit) and while sitting in
            databases (at-rest).
          </li>
          <li>
            <strong>Session Protocols:</strong> Mandatory automatic session
            timeouts take effect after thirty (30) minutes of inactivity to
            protect accounts on shared terminal screens.
          </li>
          <li>
            <strong>Immutable Tracking:</strong> System logs are write-protected,
            establishing an unalterable audit history of user activities.
          </li>
        </ul>
      </Section>

      <Section title="6. Your Data Protection Rights">
        <p>
          Under Section 26 of Kenya&apos;s Data Protection Act, 2019, you retain
          the following rights:
        </p>
        <ul>
          <li>
            <strong>Right to Access:</strong> View and verify all historical and
            profile information held about you in the member portal.
          </li>
          <li>
            <strong>Right to Rectification:</strong> Update inaccurate personal
            data (changes to professional NCK numbers require secretariat
            validation).
          </li>
          <li>
            <strong>Right to Erasure (Right to be Forgotten):</strong> Request
            account deletion. Upon request, the platform will permanently
            anonymize your personal identifiers within thirty (30) days, except
            for financial transaction archives required to be legally preserved.
          </li>
        </ul>
      </Section>

      <Section title="7. Contact Information">
        <p>
          For any inquiries regarding your data privacy, or to exercise your
          statutory data protection rights, please contact the NNAK Data
          Protection Lead at{" "}
          <a
            href="mailto:info@nnak.or.ke"
            className="text-primary hover:underline"
          >
            info@nnak.or.ke
          </a>{" "}
          or visit the NNAK Secretariat Headquarters.
        </p>
      </Section>
    </article>
  );
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mt-6">
    <h2 className="text-base font-semibold text-slate-900 mb-2">{title}</h2>
    <div className="text-sm leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
      {children}
    </div>
  </section>
);

const RETENTION_ROWS: string[][] = [
  [
    "Member Personal Profile",
    "While membership is active",
    "3 years inactivity",
    "7 years post-lapse",
    "Anonymization of personal identifiers; financial records retained in anonymized form",
  ],
  [
    "Payment & Financial Records",
    "7 years",
    "Immediate upon account closure",
    "7 years minimum (Income Tax Act Cap 470)",
    "Secure deletion after statutory period; audit log retained",
  ],
  [
    "Event Attendance Records",
    "3 years",
    "3 years from event date",
    "3 years",
    "Anonymization or secure deletion",
  ],
  [
    "Audit Logs",
    "12 months (hot)",
    "After 12 months",
    "24 months",
    "Secure deletion after 24 months; compliance logs retained per ODPC guidance",
  ],
  [
    "Communication Logs",
    "12 months",
    "After 12 months",
    "12 months",
    "Automated purge",
  ],
  [
    "M-Pesa Payment Method Details",
    "Duration of subscription",
    "Subscription termination",
    "Subscription end + 30 days",
    "Cryptographic erasure of encryption keys",
  ],
  [
    "By-Product Remittance Files",
    "7 years",
    "Immediate on upload and reconciliation",
    "7 years",
    "Secure deletion after statutory period",
  ],
];
