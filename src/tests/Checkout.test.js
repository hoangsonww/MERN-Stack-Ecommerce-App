import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Checkout from '../pages/Checkout';
import axios from 'axios';

// Mock useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock axios for API calls
jest.mock('axios');

describe('Checkout Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders CheckoutForm when order is not created', () => {
    render(
      <Router>
        <Checkout cartItems={[]} />
      </Router>
    );

    expect(screen.getByText(/Proceed to Checkout/i)).toBeInTheDocument();
  });

  test('shows loading indicator when submitting the form', async () => {
    render(
      <Router>
        <Checkout cartItems={[]} />
      </Router>
    );

    const submitButton = screen.getByText(/Proceed to Checkout/i);
    fireEvent.click(submitButton);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message when order creation fails', async () => {
    axios.post.mockRejectedValue(new Error('An error occurred'));

    render(
      <Router>
        <Checkout cartItems={[]} />
      </Router>
    );

    const submitButton = screen.getByText(/Proceed to Checkout/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  test('redirects to order success page on successful order creation', async () => {
    axios.post.mockResolvedValue({ status: 201 });
    render(
      <Router>
        <Checkout cartItems={[]} />
      </Router>
    );

    const submitButton = screen.getByText(/Proceed to Checkout/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/order-success');
    });
  });
});
