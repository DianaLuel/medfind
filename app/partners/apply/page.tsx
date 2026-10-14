import type { Metadata } from "next";
import { PharmacyApplicationForm } from "@/components/pharmacy-application-form";

export const metadata: Metadata = { title: "Pharmacy partner application" };

export default function PartnerApplicationPage() {
  return (
    <main className="shell">
      <section className="page-heading">
        <p className="section-kicker">Pharmacy partners</p>
        <h1>Bring your pharmacy into the directory.</h1>
        <p>Submit your business details for review. An application does not create a public listing or display medicine stock.</p>
      </section>
      <section className="content-section" style={{ maxWidth: 760 }}>
        <PharmacyApplicationForm />
      </section>
    </main>
  );
}
