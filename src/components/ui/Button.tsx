import {
    Button as MuiButton,
    ButtonProps as MuiButtonProps,
} from "@mui/material";
import React, { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & MuiButtonProps;

const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <MuiButton {...props}>{children}</MuiButton>;
};

export default Button;
