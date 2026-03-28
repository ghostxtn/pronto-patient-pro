import { Link } from "react-router-dom";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

type SmartLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  style?: CSSProperties;
};

export default function SmartLink({ href, className, children, onClick, style }: SmartLinkProps) {
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={className} onClick={onClick} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} onClick={onClick} style={style}>
      {children}
    </a>
  );
}
