import {
    TextField as MuiTextField,
    TextFieldProps as MuiTextFieldProps,
} from "@mui/material";
import React, { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & MuiTextFieldProps;

const TextField: React.FC<TextFieldProps> = ({ ...props }) => {
  return <MuiTextField fullWidth variant="outlined" {...props} />;
};

export default TextField;
