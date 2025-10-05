import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Checkout from '../pages/Checkout';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../context/NotificationProvider', () => ({
  useNotifier: () => ({
    notify: jest.fn(),
  }),
}));

jest.mock('../services/apiClient', () => ({
  apiClient: {
    post: jest.fn(() => Promise.resolve({ data: { orderNumber: '123', items: [], total: 0 } })),
  },
  withRetry: jest.fn(fn => fn()),
}));

// Mock the CheckoutForm to simply render a button that calls onSubmit when clicked
jest.mock('../components/CheckoutForm', () => props => <button onClick={() => props.onSubmit({ email: 'test@example.com' })}>Submit Order</button>);

describe('<Checkout />', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the form initially', () => {
    render(<Checkout cartItems={[]} />);
    expect(screen.getByRole('button', { name: /submit order/i })).toBeInTheDocument();
  });

  it('shows loading spinner, then navigates to success', async () => {
    render(<Checkout cartItems={[{ id: '1', _id: '1', name: 'Test Product', price: 100 }]} />);

    // click the mock form's submit button
    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

    // loading spinner should appear
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // after API completes, navigate should have been called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/order-success', expect.any(Object));
    });
  });
});
