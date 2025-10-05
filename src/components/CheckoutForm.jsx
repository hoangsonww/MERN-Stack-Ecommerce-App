import React, { useState } from 'react';
import { TextField, Button, Typography, Grid, CircularProgress, Box } from '@mui/material';
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import { useNotifier } from '../context/NotificationProvider';

// Luhn algorithm for credit card validation
const luhnCheck = cardNumber => {
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Detect card type
const getCardType = cardNumber => {
  const number = cardNumber.replace(/\D/g, '');

  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^6(?:011|5)/.test(number)) return 'Discover';
  if (/^3(?:0[0-5]|[68])/.test(number)) return 'Diners Club';
  if (/^(?:2131|1800|35)/.test(number)) return 'JCB';

  return 'Unknown';
};

// Get expected card length
const getCardLength = cardType => {
  if (cardType === 'American Express') return 15;
  if (cardType === 'Diners Club') return 14;
  return 16;
};

const formatCardNumber = (cardNumber, cardType) => {
  const digits = cardNumber.replace(/\D/g, '');
  if (!digits) return '';

  let groupSizes;
  switch (cardType) {
    case 'American Express':
      groupSizes = [4, 6, 5];
      break;
    case 'Diners Club':
      groupSizes = [4, 6, 4];
      break;
    default:
      groupSizes = [4, 4, 4, 4];
      break;
  }

  const groups = [];
  let index = 0;
  for (const size of groupSizes) {
    if (index >= digits.length) break;
    groups.push(digits.slice(index, index + size));
    index += size;
  }

  return groups.join(' ').trim();
};

// Validate expiry date
const normalizeExpiryInput = value => {
  const digitsOnly = value.replace(/\D/g, '');
  if (!digitsOnly) return '';

  const month = digitsOnly.slice(0, 2);
  let year = digitsOnly.slice(2, 6);

  let formattedMonth = month;
  if (month.length === 1) {
    if (parseInt(month, 10) > 1) {
      formattedMonth = `0${month}`;
    }
  } else if (month.length === 2) {
    const monthValue = parseInt(month, 10);
    if (Number.isNaN(monthValue) || monthValue < 1) {
      formattedMonth = '01';
    } else if (monthValue > 12) {
      formattedMonth = '12';
    }
  }

  if (formattedMonth.length === 2 && digitsOnly.length > 2) {
    if (year.length > 4) {
      year = year.slice(0, 4);
    }
    return `${formattedMonth}/${year}`;
  }

  return formattedMonth;
};

const validateExpiry = expiry => {
  const cleaned = expiry.replace(/\D/g, '');
  if (cleaned.length < 4) return { valid: false, message: 'Incomplete expiry date' };

  const month = parseInt(cleaned.substring(0, 2), 10);
  const yearDigits = cleaned.substring(2);
  const year = yearDigits.length === 2 ? 2000 + parseInt(yearDigits, 10) : parseInt(yearDigits, 10);

  if (month < 1 || month > 12) return { valid: false, message: 'Invalid month' };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, message: 'Card has expired' };
  }

  return { valid: true, message: '' };
};

function CheckoutForm({ onSubmit, submitting = false }) {
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
  const [validationErrors, setValidationErrors] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    email: '',
  });
  const { notify } = useNotifier();

  const handleInputChange = e => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    const newValidationErrors = { ...validationErrors };

    switch (name) {
      case 'cardNumber': {
        const digitsOnly = value.replace(/\D/g, '');
        const numberCardType = getCardType(digitsOnly);
        const expectedLength = getCardLength(numberCardType);

        let trimmed = digitsOnly;
        if (trimmed.length > expectedLength) {
          trimmed = trimmed.slice(0, expectedLength);
        }

        if (trimmed.length === expectedLength) {
          newValidationErrors.cardNumber = luhnCheck(trimmed) ? '' : 'Invalid card number';
        } else {
          newValidationErrors.cardNumber = '';
        }

        sanitizedValue = formatCardNumber(trimmed, numberCardType);
        break;
      }
      case 'expiry':
        sanitizedValue = normalizeExpiryInput(value);
        if (sanitizedValue.length > 7) sanitizedValue = sanitizedValue.slice(0, 7);

        if (sanitizedValue.length >= 4) {
          const expiryValidation = validateExpiry(sanitizedValue);
          newValidationErrors.expiry = expiryValidation.valid ? '' : expiryValidation.message;
        } else {
          newValidationErrors.expiry = '';
        }
        break;
      case 'cvc': {
        sanitizedValue = value.replace(/\D/g, '');
        if (sanitizedValue.length > 4) sanitizedValue = sanitizedValue.slice(0, 4);

        const cardDigits = formData.cardNumber.replace(/\D/g, '');
        const cardTypeForCvc = getCardType(cardDigits);
        const requiredCvcLength = cardTypeForCvc === 'American Express' ? 4 : 3;

        if (sanitizedValue.length > 0 && sanitizedValue.length < requiredCvcLength) {
          newValidationErrors.cvc = `CVC must be ${requiredCvcLength} digits`;
        } else {
          newValidationErrors.cvc = '';
        }
        break;
      }
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          newValidationErrors.email = 'Invalid email address';
        } else {
          newValidationErrors.email = '';
        }
        break;
      default:
        break;
    }

    setValidationErrors(newValidationErrors);
    setFormData({ ...formData, [name]: sanitizedValue });
  };

  const handleInputFocus = e => {
    setCardFocused(e.target.name);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (loading || submitting) return;

    // Validate all fields before submission
    const errors = {};

    // Card number validation
    const digitsOnlyCardNumber = formData.cardNumber.replace(/\D/g, '');
    const submissionCardType = getCardType(digitsOnlyCardNumber);
    const expectedLength = getCardLength(submissionCardType);
    if (digitsOnlyCardNumber.length !== expectedLength) {
      errors.cardNumber = `Card number must be ${expectedLength} digits`;
    } else if (!luhnCheck(digitsOnlyCardNumber)) {
      errors.cardNumber = 'Invalid card number';
    }

    // Expiry validation
    const expiryValidation = validateExpiry(formData.expiry);
    if (!expiryValidation.valid) {
      errors.expiry = expiryValidation.message;
    }

    // CVC validation
    const requiredCvcLength = submissionCardType === 'American Express' ? 4 : 3;
    if (formData.cvc.length !== requiredCvcLength) {
      errors.cvc = `CVC must be ${requiredCvcLength} digits`;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      notify({ severity: 'error', message: 'Please fix validation errors before submitting' });
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await onSubmit({
        ...formData,
        cardNumber: digitsOnlyCardNumber,
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const message = error?.response?.data?.error || error?.message || 'An error occurred';
      setErrorMessage(message);
      notify({ severity: 'error', message });
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
          <TextField
            required
            id="email"
            name="email"
            label="Email Address"
            fullWidth
            variant="standard"
            value={formData.email}
            onChange={handleInputChange}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
          />
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
            label={`Card Number${formData.cardNumber ? ` (${getCardType(formData.cardNumber)})` : ''}`}
            fullWidth
            variant="standard"
            value={formData.cardNumber}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            error={!!validationErrors.cardNumber}
            helperText={validationErrors.cardNumber}
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
            error={!!validationErrors.expiry}
            helperText={validationErrors.expiry}
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
            error={!!validationErrors.cvc}
            helperText={validationErrors.cvc}
          />
        </Grid>
      </Grid>

      {(loading || submitting) && <CircularProgress sx={{ mt: 2 }} />}
      {errorMessage && (
        <Typography color="error" sx={{ display: 'none' }}>
          {errorMessage}
        </Typography>
      )}

      <Button type="submit" variant="contained" color="primary" sx={{ mt: 4, mb: 4 }} disabled={loading || submitting}>
        Place Order
      </Button>
    </form>
  );
}

export default CheckoutForm;
