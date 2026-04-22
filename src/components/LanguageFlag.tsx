import type { ReactNode } from "react";
import type { Language } from "@/i18n/config";

type LanguageFlagProps = {
  lang: Language;
  className?: string;
};

function FlagFrame({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 28 20"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <rect width="28" height="20" rx="4" fill="#ffffff" />
      {children}
      <rect width="28" height="20" rx="4" fill="none" stroke="rgba(15,23,42,0.12)" />
    </svg>
  );
}

function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = (-90 + index * 36) * (Math.PI / 180);
    const radius = index % 2 === 0 ? r : r * 0.42;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(" ");

  return <polygon points={points} fill={fill} />;
}

export default function LanguageFlag({ lang, className }: LanguageFlagProps) {
  switch (lang) {
    case "en":
      return (
        <FlagFrame title="English" className={className}>
          <rect width="28" height="20" rx="4" fill="#b91c1c" />
          <rect y="2" width="28" height="2" fill="#ffffff" />
          <rect y="6" width="28" height="2" fill="#ffffff" />
          <rect y="10" width="28" height="2" fill="#ffffff" />
          <rect y="14" width="28" height="2" fill="#ffffff" />
          <rect y="18" width="28" height="2" fill="#ffffff" />
          <path d="M0 0h12v10H0z" fill="#1d4ed8" />
          <g fill="#ffffff">
            {Array.from({ length: 5 }, (_, row) =>
              Array.from({ length: 4 }, (_, col) => (
                <circle key={`${row}-${col}`} cx={2 + col * 2.4} cy={2 + row * 1.6} r="0.35" />
              )),
            )}
          </g>
        </FlagFrame>
      );
    case "tr":
      return (
        <FlagFrame title="Turkish" className={className}>
          <rect width="28" height="20" rx="4" fill="#dc2626" />
          <circle cx="11" cy="10" r="5.1" fill="#ffffff" />
          <circle cx="12.6" cy="10" r="4.1" fill="#dc2626" />
          <Star cx={17.8} cy={10} r={2.2} fill="#ffffff" />
        </FlagFrame>
      );
    case "fr":
      return (
        <FlagFrame title="French" className={className}>
          <rect width="9.33" height="20" rx="4" fill="#2563eb" />
          <rect x="9.33" width="9.34" height="20" fill="#ffffff" />
          <rect x="18.67" width="9.33" height="20" rx="4" fill="#dc2626" />
        </FlagFrame>
      );
    case "ru":
      return (
        <FlagFrame title="Russian" className={className}>
          <rect width="28" height="6.67" rx="4" fill="#ffffff" />
          <rect y="6.67" width="28" height="6.66" fill="#2563eb" />
          <rect y="13.33" width="28" height="6.67" rx="4" fill="#dc2626" />
        </FlagFrame>
      );
    case "ar":
      return (
        <FlagFrame title="Arabic" className={className}>
          <rect width="28" height="20" rx="4" fill="#15803d" />
          <rect x="4" y="6.5" width="20" height="1.6" rx="0.8" fill="#ffffff" opacity="0.95" />
          <rect x="6" y="9.3" width="16" height="1.6" rx="0.8" fill="#ffffff" opacity="0.95" />
          <rect x="8" y="12.1" width="12" height="1.6" rx="0.8" fill="#ffffff" opacity="0.95" />
          <path
            d="M9.6 15.7c1.9-1.2 4.5-1.2 6.4 0"
            stroke="#ffffff"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="15.1" y="14.3" width="1.1" height="3" rx="0.55" fill="#ffffff" />
        </FlagFrame>
      );
    case "es":
      return (
        <FlagFrame title="Spanish" className={className}>
          <rect width="28" height="20" rx="4" fill="#b91c1c" />
          <rect y="4.5" width="28" height="11" fill="#facc15" />
          <rect x="6.2" y="7.1" width="2.1" height="5.6" rx="0.8" fill="#b91c1c" />
          <rect x="8.8" y="8.1" width="1.5" height="4.1" rx="0.5" fill="#b91c1c" opacity="0.8" />
        </FlagFrame>
      );
    default:
      return null;
  }
}
