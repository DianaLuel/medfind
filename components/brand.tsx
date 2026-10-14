import Link from "next/link";

export function BrandMark({ size = 39 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
    >
      <path d="M24 44s16-14.06 16-25.05C40 10.14 32.84 3 24 3S8 10.14 8 18.95C8 29.94 24 44 24 44Z" fill="#174B3A" />
      <path d="M24.2 31.2c-5.2-3.68-7.35-8.37-5.35-12.64 3.58.18 6.3 1.65 7.66 4.45.72-3.38 3.12-5.68 7.08-6.81.72 5.22-1.94 10.62-9.39 15Z" fill="#DDEDE2" />
      <path d="M19.9 25.12c2.2 1.35 4.07 3.44 5.2 6.08" stroke="#174B3A" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="24" cy="18.5" r="1.1" fill="#174B3A" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="MedFind Ethiopia home">
      <BrandMark />
      <span className="brand-word">
        <span className="brand-name">MedFind</span>
        {!compact && <span className="brand-country">ETHIOPIA</span>}
      </span>
    </Link>
  );
}
