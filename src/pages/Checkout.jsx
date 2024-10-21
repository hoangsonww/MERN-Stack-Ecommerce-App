import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/CheckoutForm';
import { Typography, CircularProgress } from '@mui/material';

function Checkout({ cartItems }) {
  const navigate = useNavigate();
  const [orderCreated, setOrderCreated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async formData => {
    setLoading(true);

    try {
      // Simulate API call to create an order - This is a demo website so we do not have capacity to handle a real order yet
      // Remember to import axios at the top of the file if you want to use it here
      // const response = await axios.post('http://localhost:5000/api/checkout/create-order', {
      //     items: cartItems,
      //     name: formData.name,
      //     email: formData.email,
      //     shippingAddress: formData.shippingAddress,
      //     cardNumber: formData.cardNumber,
      //     cardName: formData.cardName,
      //     expiry: formData.expiry,
      //     cvc: formData.cvc,
      // });

      // Simulating success
      setTimeout(() => {
        setLoading(false);
        setOrderCreated(true);
        navigate('/order-success');
      }, 1);

      // Example of handling real response:
      // if (response.status === 201) {
      //     setLoading(false);
      //     setOrderCreated(true);
      //     navigate('/order-success');
      // }
      // else {
      //     setLoading(false);
      //     setErrorMessage(response.data.error || 'An error occurred');
      // }
    } catch (error) {
      console.error('Error creating order:', error);
      setLoading(false);
      setErrorMessage('An error occurred');
    }
  };

  return (
    <div className="checkout-container">
      {orderCreated ? (
        <Typography variant="h4" gutterBottom>
          Thank you for your order! You will be redirected shortly.
        </Typography>
      ) : (
        <>
          {loading && <CircularProgress />}
          {errorMessage && <Typography color="error">{errorMessage}</Typography>}
          <CheckoutForm onSubmit={handleSubmit} />
        </>
      )}
    </div>
  );
}

export default Checkout;
