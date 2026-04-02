type SocialPlatform = "instagram" | "facebook";

export default function SocialLogo({
  platform,
  size = "md",
}: {
  platform: SocialPlatform;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-9 h-9 text-[14px]",
    md: "w-14 h-14 text-[20px]",
    lg: "w-16 h-16 text-[22px]",
  };

  if (platform === "facebook") {
    return (
      <div
        className={`shrink-0 rounded-2xl bg-linear-to-br from-[#3b82f6] to-[#53b0ff] text-white font-bold flex items-center justify-center shadow-[0_14px_26px_rgba(42,36,18,0.2)] ${sizeClasses[size]}`}
        aria-hidden="true"
      >
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 rounded-2xl bg-linear-to-br from-[#f56040] via-[#e1306c] to-[#f9a62b] text-white font-bold flex items-center justify-center shadow-[0_14px_26px_rgba(42,36,18,0.2)] ${sizeClasses[size]}`}
      aria-hidden="true"
    >
      <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.2" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="12" cy="12" r="4.9" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="17.35" cy="6.65" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}
