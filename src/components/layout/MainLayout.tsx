import { Box, Grid, } from '@mui/material';
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };
  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar toggleDrawer={handleDrawerToggle} />
      <Sidebar  drawerOpen={drawerOpen} handleDrawerClose={handleDrawerClose} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
         <Grid container spacing={3} >
            <Grid item xs={12}>
                 {children}
            </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default MainLayout;