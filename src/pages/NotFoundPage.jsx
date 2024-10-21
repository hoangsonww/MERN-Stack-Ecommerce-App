import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/'); // Redirect to the homepage or change the path as needed
  };

  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h2" color="error" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Oops! The page you're looking for doesn't exist.
      </Typography>
      <Typography variant="body1" paragraph>
        It looks like the page you're trying to access is not available or the URL is incorrect.
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button variant="contained" color="primary" size="large" onClick={handleGoHome}>
          Go to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
