export function SocialLink({
  href,
  children,
  className
}: {
  href: string;
  children: React.ReactNode;
  className?:string
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`text-foreground/60 hover:text-foreground transition-colors ${className}`}>
      {children}
    </a>
  );
}
