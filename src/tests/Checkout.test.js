import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Checkout from '../pages/Checkout';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the CheckoutForm to simply render a button that calls onSubmit when clicked
jest.mock('../components/CheckoutForm', () => props => <button onClick={() => props.onSubmit({})}>Submit Order</button>);

describe('<Checkout />', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('renders the form initially', () => {
    render(<Checkout cartItems={[]} />);
    expect(screen.getByRole('button', { name: /submit order/i })).toBeInTheDocument();
  });

  it('shows loading spinner, then navigates to success', async () => {
    render(<Checkout cartItems={[{ id: '1' }]} />);

    // click the mock form's submit button
    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

    // loading spinner should appear
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // advance the 1ms timeout
    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    // after timeout, navigate should have been called
    expect(mockNavigate).toHaveBeenCalledWith('/order-success');
  });
});
