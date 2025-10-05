import React, { useState } from 'react';
import { Box, Container, TextField, Typography, Button, CircularProgress, Paper, IconButton, InputAdornment, Stack } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { apiClient } from '../services/apiClient';
import { useNotifier } from '../context/NotificationProvider';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { notify } = useNotifier();

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('auth/login', { email, password });
      const token = response.data.token;
      localStorage.setItem('MERNEcommerceToken', token);
      notify({ severity: 'success', message: 'Welcome back! Redirecting…' });
      setTimeout(() => {
        window.location.href = '/';
      }, 400);
    } catch (err) {
      if (err.response?.data?.errors) {
        // Format the error messages for display
        const errorMessages = err.response.data.errors.map(error => error.msg).join(', ');
        setError(errorMessages);
        notify({ severity: 'error', message: errorMessages });
      } else {
        const message = err.response?.data?.msg || 'Login failed';
        setError(message);
        notify({ severity: 'error', message });
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 4, md: 5 }, borderRadius: 3 }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h4" align="center" fontWeight={700}>
            Welcome back
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Sign in to access your saved carts, orders, and personalised picks.
          </Typography>
        </Stack>

        {error && (
          <Typography variant="body2" color="error" sx={{ display: 'none' }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleLogin}>
          <TextField label="Email" variant="outlined" fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} required />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="toggle password visibility" onClick={handleTogglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <Button type="submit" variant="contained" size="large" fullWidth>
                Login
              </Button>
            )}
          </Box>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            <a href="/forgot-password">Forgot password?</a>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Don't have an account? <a href="/register">Register here</a>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;
