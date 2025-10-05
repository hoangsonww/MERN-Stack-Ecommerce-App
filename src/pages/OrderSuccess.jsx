import React from 'react';
import { Typography, Box, Paper, Button, Stack } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function OrderSuccess() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 10 }}>
      <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: 4, maxWidth: 520 }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Order Successful!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Thank you for your purchase. We’re prepping your order and will send tracking details shortly.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button variant="contained" href="/shop" endIcon={<ArrowForwardIcon />}>
            Continue shopping
          </Button>
          <Button variant="outlined" href="/support">
            Need support?
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default OrderSuccess;
