import { Box } from '@mui/material';
import React, { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
      <Box  sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        {children}
      </Box>
  );
};

export default PublicLayout;