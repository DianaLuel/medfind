import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = { title: "Pharmacy staff sign in" };

export default function StaffSignInPage() {
  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <BrandMark />
        <p className="section-kicker" style={{ marginTop: 17 }}>Pharmacy workspace</p>
        <h1>Sign in to your pharmacy.</h1>
        <p>Update your own pharmacy profile and its availability confirmations.</p>
        <SignInForm />
        <p className="auth-footnote">Only authorized staff can access a pharmacy workspace. <Link className="text-link" href="/partners/apply">Apply to join the directory</Link>.</p>
      </section>
    </main>
  );
}
