import {
  ListItem as MuiListItem,
  ListItemProps as MuiListItemProps,
} from "@mui/material";
import { forwardRef, ReactNode } from "react";
import { Link } from "react-router-dom";

interface ListItemProps extends Omit<MuiListItemProps, "children"> {
  children: ReactNode;
  onClick?: () => void;
  to?: string;
  href?: string;
  button?: boolean;
}

const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  ({ children, onClick, to, href, button, ...props }, ref) => {
    const handleClick = () => {
      if (onClick) {
        onClick();
      }
    };

    return (
      <MuiListItem
        component={to ? Link : "li"}
        to={to}
        href={to ? to : href}
        onClick={handleClick}
        ref={ref}
        button={button ? "true" : undefined}
        {...props}
      >
        {children}
      </MuiListItem>
    );
  }
);

ListItem.displayName = "ListItem";

export default ListItem;
