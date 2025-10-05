import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/CheckoutForm';
import { Typography, CircularProgress, Container, Paper, Stack, Divider, Box } from '@mui/material';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import LockIcon from '@mui/icons-material/Lock';
import { useNotifier } from '../context/NotificationProvider';

function Checkout({ cartItems = [], onOrderComplete }) {
  const navigate = useNavigate();
  const [orderCreated, setOrderCreated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useNotifier();

  const handleSubmit = async formData => {
    if (!cartItems.length) {
      notify({ severity: 'warning', message: 'Add something to your cart before checking out.' });
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve =>
        setTimeout(() => {
          setLoading(false);
          setOrderCreated(true);
          onOrderComplete?.();
          notify({ severity: 'success', message: 'Order placed successfully! Redirecting…' });
          navigate('/order-success');
          resolve();
        }, 400)
      );
    } catch (error) {
      console.error('Error creating order:', error);
      setLoading(false);
      setErrorMessage('An error occurred');
      notify({ severity: 'error', message: 'Something went wrong while placing your order.' });
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <Container maxWidth="md" sx={{ pb: 10 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <ShoppingCartCheckoutIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h4" gutterBottom>
              Checkout
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart. Total due ${total.toFixed(2)}.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {orderCreated ? (
          <Typography variant="h5" gutterBottom>
            Thank you for your order! You will be redirected shortly.
          </Typography>
        ) : (
          <>
            {loading && <CircularProgress sx={{ mb: 3 }} />}
            {errorMessage && (
              <Typography color="error" sx={{ display: 'none' }}>
                {errorMessage}
              </Typography>
            )}
            <CheckoutForm onSubmit={handleSubmit} submitting={loading} />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, color: 'text.secondary' }}>
              <LockIcon fontSize="small" />
              <Typography variant="caption">Payments processed securely. We never store your card details.</Typography>
            </Stack>
          </>
        )}
      </Paper>
    </Container>
  );
}

export default Checkout;
