import Link from "next/link";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div className="footer-about"><Brand /><p>Helping people check recent pharmacy confirmations before making the trip. Availability can change—please call the pharmacy first.</p></div>
        <div className="footer-links"><h2>For everyone</h2><nav aria-label="Information"><Link href="/search">Search medicines</Link><Link href="/safety">Availability &amp; safety</Link><Link href="/privacy">Privacy</Link></nav></div>
        <div className="footer-links"><h2>Contact &amp; pharmacies</h2><nav aria-label="Contact and pharmacy links"><Link href="/partners/apply">Contact about pharmacy participation</Link><Link href="/staff/sign-in">Staff sign in</Link><Link href="/admin">Administrator sign in</Link></nav><p className="footer-contact-note">A general support email will be added when the service operator provides one.</p></div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} MedFind Ethiopia</span><span>A medicine availability directory—not medical advice.</span></div>
    </footer>
  );
}
