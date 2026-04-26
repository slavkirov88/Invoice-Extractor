import Link from "next/link";

export default function PrivacyContentEn() {
  return (
    <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground [&_li]:mb-1">
      <section>
        <h2>1. Data Controller</h2>
        <p>
          The data controller is{" "}
          <strong>СЛАМАР ЕООД</strong>, EIK: 208287248, with registered office
          at: Chernomorets, Akladi, fl. 2, apt. 222, operating the
          TravelInvoices platform (&quot;we&quot;, &quot;us&quot;,
          &quot;the Platform&quot;). You can contact us at:
        </p>
        <ul className="list-none pl-0 space-y-1">
          <li>
            <strong>Email:</strong> support@travelinvoices.com
          </li>
          <li>
            <strong>Website:</strong> www.travelinvoices.com
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Legal basis for processing</h2>
        <p>
          We process your personal data on the following grounds, pursuant to
          Art. 6 of Regulation (EU) 2016/679 (GDPR):
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Performance of a contract</strong> (Art. 6(1)(b)) — to
            provide the service, manage your account, and process payments
          </li>
          <li>
            <strong>Legal obligation</strong> (Art. 6(1)(c)) — to comply with
            tax and accounting legislation (ЗДДС, ЗСч, ЗКПО)
          </li>
          <li>
            <strong>Legitimate interest</strong> (Art. 6(1)(f)) — to improve the
            service, ensure technical security, and prevent abuse
          </li>
          <li>
            <strong>Consent</strong> (Art. 6(1)(a)) — for marketing
            communications and non-essential cookies
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Data we collect</h2>
        <h3>3.1. Registration data</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Email address</li>
          <li>Name (when signing in via Google OAuth)</li>
          <li>Password (encrypted, when registering with email)</li>
        </ul>

        <h3>3.2. Service usage data</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Contents of uploaded PDF invoices (document number, date, amount,
            counterparty VAT/EIK numbers)
          </li>
          <li>Protocol data (supplier name, EIK, dates)</li>
          <li>Created invoices and protocols</li>
        </ul>

        <h3>3.3. Technical data</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>IP address</li>
          <li>Browser type and operating system</li>
          <li>Access dates and times</li>
          <li>Pages visited on the Platform</li>
        </ul>

        <h3>3.4. Payment data</h3>
        <p>
          Payment data (card number, CVC) is processed entirely by{" "}
          <strong>Stripe, Inc.</strong> and never passes through our servers. We
          only store the Stripe customer identifier and subscription status.
        </p>

        <h3>3.5. Data we do NOT collect</h3>
        <p>
          We do not collect special categories of personal data (sensitive data)
          such as: health data, biometric data, racial or ethnic origin,
          political opinions, religious beliefs.
        </p>
      </section>

      <section>
        <h2>4. Purposes of processing</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Creating and managing your account</li>
          <li>
            Providing the service — extracting data from invoices, managing
            protocols, VAT calculations
          </li>
          <li>Processing payments and managing subscriptions</li>
          <li>Technical support and communication</li>
          <li>Improving and optimizing the Platform</li>
          <li>Ensuring security and preventing abuse</li>
          <li>
            Fulfilling legal obligations (tax reporting, accounting)
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Data recipients and third parties</h2>
        <p>We may share your data with:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Supabase, Inc.</strong> — database hosting and
            authentication (EU servers)
          </li>
          <li>
            <strong>Vercel, Inc.</strong> — web application hosting (EU servers)
          </li>
          <li>
            <strong>Stripe, Inc.</strong> — payment processing (PCI DSS Level 1
            certified)
          </li>
          <li>
            <strong>Mistral AI</strong> — AI processing of PDF invoices for data
            extraction (EU servers)
          </li>
        </ul>
        <p>
          We do not sell, rent, or share your personal data with third parties
          for marketing purposes.
        </p>
        <p>
          When required by law, we may provide data to competent authorities
          (НАП, courts) in accordance with applicable legislation.
        </p>
      </section>

      <section>
        <h2>6. Data transfers outside the EU/EEA</h2>
        <p>
          We strive to process your data entirely within the European Union.
          When a transfer outside the EU/EEA is necessary (e.g., to Stripe in
          the USA), such transfer is carried out based on:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            An adequacy decision by the European Commission (EU-US Data Privacy
            Framework)
          </li>
          <li>Standard Contractual Clauses (SCC) approved by the EC</li>
        </ul>
      </section>

      <section>
        <h2>7. Retention periods</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account data:</strong> while you have an active account and
            up to 30 days after deletion
          </li>
          <li>
            <strong>Invoices and protocols:</strong> 10 years pursuant to the
            Accounting Act (ЗСч, Art. 12)
          </li>
          <li>
            <strong>Payment records:</strong> 5 years pursuant to tax
            legislation
          </li>
          <li>
            <strong>Technical logs:</strong> up to 12 months
          </li>
          <li>
            <strong>Marketing consent:</strong> until withdrawn
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Your rights</h2>
        <p>
          Under GDPR (Arts. 15–22), you have the following rights regarding your
          personal data:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Right of access</strong> (Art. 15) — to obtain confirmation
            of whether we process your data and a copy thereof
          </li>
          <li>
            <strong>Right to rectification</strong> (Art. 16) — to request
            correction of inaccurate data
          </li>
          <li>
            <strong>Right to erasure</strong> (Art. 17) — to request deletion of
            your data (&quot;right to be forgotten&quot;), except where retention
            is legally required
          </li>
          <li>
            <strong>Right to restriction</strong> (Art. 18) — to request
            restriction of processing
          </li>
          <li>
            <strong>Right to portability</strong> (Art. 20) — to receive your
            data in a structured, machine-readable format
          </li>
          <li>
            <strong>Right to object</strong> (Art. 21) — to object to the
            processing of your data
          </li>
          <li>
            <strong>Right not to be subject to automated decisions</strong>{" "}
            (Art. 22) — not to be subject to a decision based solely on
            automated processing
          </li>
          <li>
            <strong>Right to withdraw consent</strong> (Art. 7) — at any time,
            without affecting the lawfulness of processing carried out prior to
            withdrawal
          </li>
        </ul>
        <p>
          To exercise your rights, contact us at{" "}
          <strong>support@travelinvoices.com</strong>. We will respond within 30
          days.
        </p>
      </section>

      <section>
        <h2>9. Data security</h2>
        <p>
          We implement appropriate technical and organizational measures to
          protect your data, including:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Data encryption in transit (TLS/HTTPS)</li>
          <li>Data encryption at rest (AES-256)</li>
          <li>
            Row Level Security (RLS) in the database — each user can only
            access their own data
          </li>
          <li>Access control through authentication and authorization</li>
          <li>Regular data backups</li>
        </ul>
      </section>

      <section>
        <h2>10. Data breach notification</h2>
        <p>
          In the event of a personal data breach, we will notify the Commission
          for Personal Data Protection (КЗЛД) within 72 hours pursuant to Art.
          33 of the GDPR. If there is a high risk to your rights and freedoms,
          we will notify you without undue delay (Art. 34 of the GDPR).
        </p>
      </section>

      <section>
        <h2>11. Cookies</h2>
        <p>
          We use cookies and similar technologies for the functioning of the
          Platform. Details can be found in our{" "}
          <Link href="/cookies" className="text-violet-400 hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>12. Processing third-party data</h2>
        <p>
          When you upload invoices containing personal data of your clients or
          counterparties, you act as the <strong>data controller</strong> for
          that data, and TravelInvoices acts as a{" "}
          <strong>data processor</strong> within the meaning of Art. 28 of the
          GDPR.
        </p>
        <p>
          You are responsible for having a legal basis for processing such data
          and for informing the affected individuals.
        </p>
      </section>

      <section>
        <h2>13. Children</h2>
        <p>
          The service is not intended for persons under the age of 14 (age of
          consent pursuant to Art. 25c of ЗЗЛД). If we discover that we have
          collected data from a person under this age, we will delete it
          immediately.
        </p>
      </section>

      <section>
        <h2>14. Supervisory authority</h2>
        <p>
          You have the right to file a complaint with the Commission for
          Personal Data Protection (КЗЛД):
        </p>
        <ul className="list-none pl-0 space-y-1">
          <li>
            <strong>Address:</strong> 2 Prof. Tsvetan Lazarov Blvd., 1592 Sofia
          </li>
          <li>
            <strong>Website:</strong> www.cpdp.bg
          </li>
          <li>
            <strong>Email:</strong> kzld@cpdp.bg
          </li>
          <li>
            <strong>Phone:</strong> +359 2 915 35 18
          </li>
        </ul>
      </section>

      <section>
        <h2>15. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy periodically. In case of significant
          changes, we will notify you by email or through a notice on the
          Platform. The date of the last update is indicated at the top of this
          document.
        </p>
      </section>
    </div>
  );
}
