import Link from "next/link";

export default function TermsContentEn() {
  return (
    <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground [&_li]:mb-1">
      <section>
        <h2>1. General Provisions</h2>
        <p>
          These Terms of Service govern the relationship between{" "}
          <strong>СЛАМАР ЕООД</strong>, EIK: 208287248, with registered office
          at: Chernomorets, Akladi, fl. 2, apt. 222, operating the
          TravelInvoices platform (&quot;the Platform&quot;, &quot;the
          Service&quot;, &quot;we&quot;) and the users (&quot;User&quot;,
          &quot;you&quot;) who use the TravelInvoices web application available
          at <strong>www.travelinvoices.com</strong>.
        </p>
        <p>
          By registering and/or using the Service, you confirm that you have
          read, understood, and accept these Terms of Service. If you do not
          agree with them, please do not use the Platform.
        </p>
      </section>

      <section>
        <h2>2. Service Description</h2>
        <p>
          TravelInvoices is a cloud platform (SaaS) designed for travel
          agencies, providing:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Automatic data extraction from PDF invoices using AI technology
            (document number, issue date, amount)
          </li>
          <li>
            Management of protocols under Art. 117 of the VAT Act (ЗДДС) for
            general tourist services (margin scheme)
          </li>
          <li>
            Automatic VAT calculation using the margin scheme (Section C of the
            protocol)
          </li>
          <li>Export of protocols in Excel and PDF format</li>
          <li>Organization and storage of invoices by protocol</li>
        </ul>
        <p>
          The Service is not a substitute for accounting services and does not
          provide tax or legal advice. The User is responsible for the accuracy
          of the entered data and for compliance with tax legislation.
        </p>
      </section>

      <section>
        <h2>3. Registration and Account</h2>
        <p>
          To use the Service, you need to create an account with a valid email
          address. You agree to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provide accurate and up-to-date information upon registration</li>
          <li>Maintain the confidentiality of your account credentials</li>
          <li>
            Notify us immediately if you suspect unauthorized access
          </li>
          <li>Update your information within 7 days of any changes</li>
        </ul>
        <p>
          You are responsible for all actions performed through your account.
        </p>
      </section>

      <section>
        <h2>4. Subscription Plans and Payment</h2>
        <h3>4.1. Free trial period</h3>
        <p>
          Upon registration, you may activate a 14-day free trial with full
          access to all features. A payment card via Stripe is required for
          activation. No charges are made during the trial period.
        </p>

        <h3>4.2. Paid subscription</h3>
        <p>
          After the trial period expires, the subscription automatically
          converts to a paid plan unless canceled by the user. Prices are in EUR
          and include VAT. Current prices are published on the website.
        </p>

        <h3>4.3. Automatic renewal</h3>
        <p>
          The subscription renews automatically at each billing period. You can
          cancel at any time from your account settings. Cancellation takes
          effect from the next billing period.
        </p>

        <h3>4.4. Refunds</h3>
        <p>
          Under the Consumer Protection Act, you have the right to withdraw
          within 14 days of the subscription start, provided you have not
          actively used the Service. No refunds are provided for already
          activated services.
        </p>
      </section>

      <section>
        <h2>5. Intellectual Property</h2>
        <p>
          All rights to the Platform — including software, design, text,
          graphics, and logo — belong to TravelInvoices. You receive a limited,
          non-exclusive license to use the Service under these terms.
        </p>
        <p>
          The data you upload and enter (invoices, protocols) remains your
          property. We do not acquire rights to your content.
        </p>
      </section>

      <section>
        <h2>6. Data Protection</h2>
        <p>
          Personal data processing is carried out in accordance with Regulation
          (EU) 2016/679 (GDPR) and the Personal Data Protection Act (ЗЗЛД).
          Details can be found in our{" "}
          <Link href="/privacy" className="text-violet-400 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <p>
          When uploading invoices containing third-party data, you act as the
          data controller, and TravelInvoices acts as the data processor.
        </p>
      </section>

      <section>
        <h2>7. Acceptable Use</h2>
        <p>When using the Service, you agree not to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Use the Platform for illegal purposes or in violation of applicable
            law
          </li>
          <li>
            Upload files containing viruses, malicious code, or other harmful
            content
          </li>
          <li>
            Perform actions that may harm the functionality, security, or
            availability of the Service
          </li>
          <li>
            Attempt to gain unauthorized access to systems or data
          </li>
          <li>
            Copy, decompile, or extract the source code of the Platform
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Availability and Limitations</h2>
        <p>
          We strive to keep the Service available 24/7 but do not guarantee
          uninterrupted or error-free access. The Service is provided &quot;as
          is&quot;.
        </p>
        <p>
          We reserve the right to perform scheduled maintenance during which the
          Service may be temporarily unavailable. We will notify you in advance
          of extended planned maintenance.
        </p>
      </section>

      <section>
        <h2>9. Limitation of Liability</h2>
        <p>TravelInvoices is not liable for:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Damages arising from inaccurately extracted data by the AI system —
            the user is obligated to verify extracted data
          </li>
          <li>
            Data loss caused by circumstances beyond our control
          </li>
          <li>
            Service interruptions due to technical issues, hosting providers, or
            force majeure
          </li>
          <li>
            Indirect, incidental, or consequential damages from using the
            Service
          </li>
        </ul>
        <p>
          Our maximum liability is limited to the subscription fees paid by you
          in the last 12 months.
        </p>
      </section>

      <section>
        <h2>10. Termination</h2>
        <p>
          You can terminate your account at any time from profile settings or by
          written notice to our email address.
        </p>
        <p>
          We may terminate or restrict your access to the Service in case of:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Violation of these Terms of Service</li>
          <li>Non-payment of subscription fees</li>
          <li>Use of the Service for illegal purposes</li>
        </ul>
        <p>
          Upon termination, your data is retained according to legal
          requirements (10 years for accounting documents under the Accounting
          Act), after which it is deleted.
        </p>
      </section>

      <section>
        <h2>11. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms of Service. In case of
          significant changes, we will notify you by email or through a notice
          on the Platform at least 15 days in advance. Continued use of the
          Service after the changes take effect constitutes acceptance of the
          new terms.
        </p>
      </section>

      <section>
        <h2>12. Governing Law and Disputes</h2>
        <p>
          These Terms of Service are governed by the laws of the Republic of
          Bulgaria. All disputes arising from or in connection with them shall be
          resolved by the competent Bulgarian court.
        </p>
        <p>
          Applicable legislation: Obligations and Contracts Act (ЗЗД), Consumer
          Protection Act (ЗЗП), Electronic Commerce Act (ЗЕТ), VAT Act (ЗДДС),
          Accounting Act (ЗСч).
        </p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <p>
          If you have questions about these Terms of Service, please contact us
          at:
        </p>
        <ul className="list-none pl-0 space-y-1">
          <li>
            <strong>СЛАМАР ЕООД</strong>, EIK: 208287248
          </li>
          <li>
            <strong>Address:</strong> Chernomorets, Akladi, fl. 2, apt. 222
          </li>
          <li>
            <strong>Email:</strong> support@travelinvoices.com
          </li>
          <li>
            <strong>Website:</strong> www.travelinvoices.com
          </li>
        </ul>
      </section>
    </div>
  );
}
