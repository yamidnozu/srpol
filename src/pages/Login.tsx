import { Grid, Paper, Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import PublicLayout from '../components/layout/PublicLayout';

const Login: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

  return (
    <PublicLayout>
    <Grid item xs={10} sm={8} md={6} lg={4}>
        <Paper elevation={3} sx={{ padding: 3 }}>
            <Tabs value={tabValue} onChange={handleChange} centered>
                <Tab label="Iniciar Sesión" />
                <Tab label="Registrarse" />
            </Tabs>
            {tabValue === 0 && <LoginForm />}
            {tabValue === 1 && <RegisterForm />}
        </Paper>
      </Grid>
    </PublicLayout>
  );
};

export default Login;