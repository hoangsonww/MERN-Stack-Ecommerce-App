import * as React from 'react';
import { Typography, Box, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';

function OrderConfirmation() {
  const navigate = useNavigate();

  const handleContinueShopping = () => {
    navigate('/shop');
  };

  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <CheckCircleOutlineIcon sx={{ fontSize: 100, color: 'green', mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Order Successful!
      </Typography>
      <Typography variant="body1" paragraph>
        Thank you for your purchase. Your order is being processed.
      </Typography>
      <Button variant="contained" onClick={handleContinueShopping}>
        Continue Shopping
      </Button>
    </Box>
  );
}

export default OrderConfirmation;
