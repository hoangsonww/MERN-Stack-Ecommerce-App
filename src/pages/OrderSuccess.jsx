import React from 'react';
import { Typography, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

function OrderSuccess() {
  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <CheckCircleOutlineIcon sx={{ fontSize: 100, color: 'green' }} />

      <Typography variant="h4" gutterBottom>
        Order Successful!
      </Typography>

      <Typography variant="body1">Thank you for your purchase. Your order is being processed.</Typography>
    </Box>
  );
}

export default OrderSuccess;
