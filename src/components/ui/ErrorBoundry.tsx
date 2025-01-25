// src/components/ui/ErrorBoundry.tsx
import { Alert } from "@mui/material";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by error boundary", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" className="mt-4 rounded-md shadow-sm">
          {" "}
          {/* Added Tailwind classes to Alert */}
          Algo salió mal
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
