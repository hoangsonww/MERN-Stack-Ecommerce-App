import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, TextField, Typography, Button, CircularProgress, Paper } from '@mui/material';
import axios from 'axios';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verify email
      await axios.post('https://fusion-electronics-api.vercel.app/api/auth/verify-email', { email });
      // If successful, navigate to reset password page
      navigate('/reset-password');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 12, mb: 12 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Forgot Password
        </Typography>

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            type={'email'}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <Button type="submit" variant="contained" size="large" fullWidth>
                Verify Email
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default ForgotPassword;
