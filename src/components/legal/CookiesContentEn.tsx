import Link from "next/link";

export default function CookiesContentEn() {
  return (
    <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground [&_li]:mb-1">
      <section>
        <h2>1. What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device (computer, tablet,
          smartphone) when you visit a website. They allow the site to remember
          information about your visit, making subsequent visits easier and the
          site more useful to you.
        </p>
        <p>
          This policy has been prepared in accordance with Directive 2002/58/EC
          (ePrivacy Directive), Regulation (EU) 2016/679 (GDPR), and the
          Electronic Communications Act of the Republic of Bulgaria.
        </p>
      </section>

      <section>
        <h2>2. Types of cookies we use</h2>

        <h3>2.1. Strictly necessary</h3>
        <p>
          These cookies are essential for the basic functioning of the Platform.
          Without them, you cannot use the service. They do not require your
          consent.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-foreground">
                  Cookie
                </th>
                <th className="px-3 py-2 text-left font-medium text-foreground">
                  Purpose
                </th>
                <th className="px-3 py-2 text-left font-medium text-foreground">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-3 py-2">sb-*-auth-token</td>
                <td className="px-3 py-2">
                  User authentication (Supabase Auth)
                </td>
                <td className="px-3 py-2">Session</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2">sb-*-auth-token-code-verifier</td>
                <td className="px-3 py-2">
                  PKCE verification for OAuth login
                </td>
                <td className="px-3 py-2">Session</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2">__stripe_mid</td>
                <td className="px-3 py-2">
                  Payment fraud prevention (Stripe)
                </td>
                <td className="px-3 py-2">1 year</td>
              </tr>
              <tr>
                <td className="px-3 py-2">__stripe_sid</td>
                <td className="px-3 py-2">
                  Payment session (Stripe)
                </td>
                <td className="px-3 py-2">30 minutes</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>2.2. Functional</h3>
        <p>
          These cookies remember your preferences and improve your experience.
          They require your consent.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-foreground">
                  Cookie
                </th>
                <th className="px-3 py-2 text-left font-medium text-foreground">
                  Purpose
                </th>
                <th className="px-3 py-2 text-left font-medium text-foreground">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2">cookie-consent</td>
                <td className="px-3 py-2">
                  Remembers your cookie preferences
                </td>
                <td className="px-3 py-2">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>2.3. Analytics</h3>
        <p>
          These cookies help us understand how users interact with the Platform
          so we can improve it. Data is anonymized. They require your consent.
        </p>
        <p className="text-xs">
          TravelInvoices does not currently use analytics cookies. If introduced
          in the future, we will update this section and request your consent.
        </p>

        <h3>2.4. Marketing</h3>
        <p>
          Marketing cookies are used to display advertisements tailored to your
          interests. They require explicit consent.
        </p>
        <p className="text-xs">
          TravelInvoices does not currently use marketing cookies. If introduced
          in the future, we will update this section and request your explicit
          consent.
        </p>
      </section>

      <section>
        <h2>3. Third-party cookies</h2>
        <p>
          Some cookies are placed by third-party services that we use:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Supabase</strong> — for authentication and session
            management. Privacy policy:{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:underline"
            >
              supabase.com/privacy
            </a>
          </li>
          <li>
            <strong>Stripe</strong> — for secure payment processing.
            Privacy policy:{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:underline"
            >
              stripe.com/privacy
            </a>
          </li>
          <li>
            <strong>Vercel</strong> — for hosting and performance optimization.
            Privacy policy:{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:underline"
            >
              vercel.com/legal/privacy-policy
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Your choices</h2>
        <h3>4.1. Consent</h3>
        <p>
          On your first visit to the Platform, we display a cookie banner
          through which you can:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Accept all</strong> — enable all cookie categories
          </li>
          <li>
            <strong>Necessary only</strong> — accept only strictly necessary
            cookies
          </li>
        </ul>
        <p>
          You can change your choice at any time through your browser settings.
        </p>

        <h3>4.2. Browser management</h3>
        <p>
          You can manage cookies through your browser settings. Most browsers
          allow you to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>View stored cookies</li>
          <li>Delete individual or all cookies</li>
          <li>Block cookies from specific sites</li>
          <li>Block third-party cookies</li>
        </ul>
        <p>
          <strong>Warning:</strong> Blocking strictly necessary cookies may
          prevent the Platform from functioning properly.
        </p>
      </section>

      <section>
        <h2>5. Retention period</h2>
        <p>Cookies are divided into two types by retention period:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Session cookies</strong> — automatically deleted when you
            close your browser
          </li>
          <li>
            <strong>Persistent cookies</strong> — remain on your device for a
            specified period (as indicated in the tables above)
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Changes to this policy</h2>
        <p>
          We may update this Cookie Policy periodically. When introducing new
          cookie categories, we will request your consent again. The date of
          the last update is indicated at the top of this document.
        </p>
      </section>

      <section>
        <h2>7. Contact</h2>
        <p>
          If you have questions about cookies, please contact us:
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
        <p>
          For more information about data protection, see our{" "}
          <Link href="/privacy" className="text-violet-400 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
