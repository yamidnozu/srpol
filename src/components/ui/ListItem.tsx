/* src\components\ui\ListItem.tsx */
import React, { forwardRef, ReactNode } from "react";
import { Link } from "react-router-dom";

interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  children: ReactNode;
  onClick?: () => void;
  to?: string;
  href?: string;
  button?: boolean;
}

const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  ({ children, onClick, to, href, button, className, ...props }, ref) => {
    const handleClick = () => {
      if (onClick) {
        onClick();
      }
    };

    const commonClasses = `block py-2 px-4 text-sm hover:bg-gray-100 text-gray-700`;
    const buttonClasses = button
      ? `${commonClasses} cursor-pointer`
      : commonClasses;

    const listItemContent = (
      <li
        ref={ref}
        onClick={handleClick}
        className={`${buttonClasses} ${className || ""}`}
        {...props}
      >
        {children}
      </li>
    );

    if (to) {
      return (
        <li ref={ref} className={className} {...props}>
          <Link to={to} className={`${commonClasses} block`}>
            {children}
          </Link>
        </li>
      );
    }

    if (href) {
      return (
        <li ref={ref} className={className} {...props}>
          <a href={href} className={`${commonClasses} block`}>
            {children}
          </a>
        </li>
      );
    }

    return listItemContent;
  }
);

ListItem.displayName = "ListItem";

export default ListItem;
