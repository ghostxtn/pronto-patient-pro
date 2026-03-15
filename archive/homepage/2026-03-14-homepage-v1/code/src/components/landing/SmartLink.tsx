import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type SmartLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export default function SmartLink({ href, className, children }: SmartLinkProps) {
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
