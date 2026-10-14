import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/brand";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand />
        <nav className="primary-nav" aria-label="Main navigation">
          <Link href="/search">Find medicine</Link>
          <Link href="/safety">How availability works</Link>
          <div className="header-actions">
            <Link className="button button-secondary button-small" href="/staff/sign-in">Pharmacy sign in</Link>
            <Link className="button button-primary button-small" href="/partners/apply">
              For pharmacies <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
