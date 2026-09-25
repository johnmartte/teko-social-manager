type SocialPlatform = "instagram" | "facebook";

export default function SocialLogo({
  platform,
  size = "md",
}: {
  platform: SocialPlatform;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "size-8 text-[14px] rounded-md",
    md: "size-10 text-[18px] rounded-lg",
    lg: "size-12 text-[20px] rounded-lg",
  };

  const base = `shrink-0 bg-muted border border-border flex items-center justify-center ${sizeClasses[size]}`;

  if (platform === "facebook") {
    return (
      <div className={base} style={{ color: "var(--fb)" }} aria-hidden="true">
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={base} style={{ color: "var(--ig)" }} aria-hidden="true">
      <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.2" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="12" cy="12" r="4.9" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="17.35" cy="6.65" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}
