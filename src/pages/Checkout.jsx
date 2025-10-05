import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/CheckoutForm';
import {
  Typography,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Divider,
  Box,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Checkbox,
  Tooltip,
} from '@mui/material';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useNotifier } from '../context/NotificationProvider';
import { apiClient, withRetry } from '../services/apiClient';

function Checkout({ cartItems = [], onOrderComplete }) {
  const navigate = useNavigate();
  const [orderCreated, setOrderCreated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useNotifier();

  const [showCartSummary, setShowCartSummary] = useState(false);
  const [selectedItems, setSelectedItems] = useState(() => {
    const defaults = cartItems.map(item => item._id || item.id).filter(Boolean);
    return new Set(defaults);
  });

  const handleSubmit = async formData => {
    if (!selectedItems.size) {
      notify({ severity: 'warning', message: 'Select at least one item before checking out.' });
      return;
    }

    const itemsToPurchase = cartItems.filter(item => {
      const id = item._id || item.id;
      return id && selectedItems.has(id);
    });

    if (!itemsToPurchase.length) {
      notify({ severity: 'warning', message: 'Selected items are unavailable. Please refresh your cart.' });
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const orderPayload = {
        ...formData,
        items: itemsToPurchase
          .map(item => ({
            productId: item._id || item.id,
            quantity: item.quantity || 1,
          }))
          .filter(item => item.productId),
      };

      if (!orderPayload.items.length) {
        setLoading(false);
        notify({ severity: 'error', message: 'Unable to place order: missing product information.' });
        return;
      }

      const { data } = await withRetry(() => apiClient.post('checkout/create-order', orderPayload));

      const normalizedEmail = formData.email?.trim() || '';

      setLoading(false);
      setOrderCreated(true);
      onOrderComplete?.();

      if (data?.orderNumber) {
        try {
          localStorage.setItem('fusionLastOrder', JSON.stringify({ orderNumber: data.orderNumber, email: normalizedEmail }));
        } catch (storageError) {
          console.warn('Unable to persist last order reference', storageError);
        }
      }

      notify({ severity: 'success', message: 'Order placed successfully! Redirecting…' });

      navigate('/order-success', {
        state: {
          orderNumber: data?.orderNumber,
          email: normalizedEmail,
          estimatedDelivery: data?.estimatedDelivery,
          items: data?.items,
          total: data?.total,
        },
      });
    } catch (error) {
      console.error('Error creating order:', error);
      setLoading(false);
      const message = error?.response?.data?.error || 'Something went wrong while placing your order.';
      setErrorMessage(message);
      notify({ severity: 'error', message });
    }
  };

  const selectedIds = Array.from(selectedItems);
  const itemsToShow = cartItems.filter(item => {
    const id = item._id || item.id;
    return id && selectedItems.has(id);
  });
  const total = itemsToShow.reduce((sum, item) => sum + (item.price || 0), 0);
  const allSelected = cartItems.every(item => selectedItems.has(item._id || item.id));

  const toggleItem = id => {
    if (!id) return;
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedItems(prev => {
      if (prev.size === cartItems.length) {
        return new Set();
      }
      return new Set(cartItems.map(item => item._id || item.id).filter(Boolean));
    });
  };

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
              You have {itemsToShow.length} item{itemsToShow.length !== 1 ? 's' : ''} selected. Total due ${total.toFixed(2)}.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {cartItems.length > 0 && (
          <Paper elevation={0} sx={{ mb: 4, borderRadius: 3, background: 'rgba(40,116,240,0.06)', p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ShoppingBagIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>
                Selected items ({itemsToShow.length}/{cartItems.length})
              </Typography>
              <Tooltip title={allSelected ? 'Deselect all items' : 'Select all items'}>
                <Checkbox
                  color="primary"
                  checked={allSelected}
                  indeterminate={selectedItems.size > 0 && !allSelected}
                  onChange={toggleAll}
                  sx={{ ml: 'auto' }}
                />
              </Tooltip>
              <IconButton size="small" onClick={() => setShowCartSummary(prev => !prev)}>
                <ExpandMoreIcon
                  sx={{
                    transform: showCartSummary ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </IconButton>
            </Stack>
            <Collapse in={showCartSummary} timeout="auto" unmountOnExit>
              <List dense>
                {cartItems.map(item => {
                  const id = item._id || item.id;
                  if (!id) return null;
                  const checked = selectedItems.has(id);
                  return (
                    <ListItem key={id} secondaryAction={<Checkbox edge="end" color="primary" checked={checked} onChange={() => toggleItem(id)} />}>
                      <ListItemAvatar>
                        <Avatar src={item.image} alt={item.name} variant="rounded" />
                      </ListItemAvatar>
                      <ListItemText primary={item.name} secondary={`$${(item.price || 0).toFixed(2)}`} />
                    </ListItem>
                  );
                })}
                {selectedItems.size === 0 && (
                  <ListItem>
                    <ListItemText primary="No items selected. Choose at least one item to proceed." />
                  </ListItem>
                )}
              </List>
            </Collapse>
          </Paper>
        )}

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
