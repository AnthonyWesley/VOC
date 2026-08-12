export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-[var(--bg-mid)] ${className}`}>
      {children}
    </div>
  );
}
