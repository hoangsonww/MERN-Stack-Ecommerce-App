import React, { useState } from 'react';
import { TextField, Button, Typography, Grid, CircularProgress, Box } from '@mui/material';
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';

function CheckoutForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    shippingAddress: '',
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvc: '',
  });
  const [cardFocused, setCardFocused] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = e => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    switch (name) {
      case 'cardNumber':
        sanitizedValue = value.replace(/\D/g, '');
        break;
      case 'expiry':
        sanitizedValue = value.replace(/[^0-9/]/g, '');
        if (sanitizedValue.length > 7) sanitizedValue = sanitizedValue.slice(0, 7);
        break;
      case 'cvc':
        sanitizedValue = value.replace(/\D/g, '');
        if (sanitizedValue.length > 4) sanitizedValue = sanitizedValue.slice(0, 4);
        break;
      default:
        break;
    }

    setFormData({ ...formData, [name]: sanitizedValue });
  };

  const handleInputFocus = e => {
    setCardFocused(e.target.name);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      await onSubmit(formData);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setErrorMessage(error.response.data.error || 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h4" gutterBottom>
        Billing Information
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField required id="name" name="name" label="Full Name" fullWidth variant="standard" value={formData.name} onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField required id="email" name="email" label="Email Address" fullWidth variant="standard" value={formData.email} onChange={handleInputChange} />
        </Grid>
      </Grid>

      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Shipping Information
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            id="shippingAddress"
            name="shippingAddress"
            label="Shipping Address"
            fullWidth
            variant="standard"
            value={formData.shippingAddress}
            onChange={handleInputChange}
          />
        </Grid>
      </Grid>

      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Payment Details
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Cards number={formData.cardNumber} name={formData.cardName} expiry={formData.expiry} cvc={formData.cvc} focused={cardFocused} />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            required
            id="cardNumber"
            name="cardNumber"
            label="Card Number"
            fullWidth
            variant="standard"
            value={formData.cardNumber}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            required
            id="cardName"
            name="cardName"
            label="Name on Card"
            fullWidth
            variant="standard"
            value={formData.cardName}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            required
            id="expiry"
            name="expiry"
            label="Expiry Date"
            fullWidth
            variant="standard"
            placeholder="MM/YY or MM/YYYY"
            value={formData.expiry}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            required
            id="cvc"
            name="cvc"
            label="CVC"
            fullWidth
            variant="standard"
            value={formData.cvc}
            placeholder="3 or 4 digits"
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          />
        </Grid>
      </Grid>

      {loading && <CircularProgress />}
      {errorMessage && <Typography color="error">{errorMessage}</Typography>}

      <Button type="submit" variant="contained" color="primary" sx={{ mt: 4, mb: 4 }} disabled={loading}>
        Place Order
      </Button>
    </form>
  );
}

export default CheckoutForm;
