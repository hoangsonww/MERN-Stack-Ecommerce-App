import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Cart from '../pages/Cart';

describe('Cart Component', () => {
  const mockNavigate = jest.fn();
  const mockSetCart = jest.fn();

  // Mock the useNavigate hook from react-router-dom
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
  }));

  const sampleCart = [
    { id: '1', name: 'Product 1', price: 20, image: 'https://example.com/product1.jpg' },
    { id: '2', name: 'Product 2', price: 15, image: 'https://example.com/product2.jpg' },
  ];

  test('renders empty cart message', () => {
    render(
      <Router>
        <Cart cart={[]} setCart={mockSetCart} />
      </Router>
    );

    expect(screen.getByText(/Your cart is empty./i)).toBeInTheDocument();
  });

  test('renders cart with items', () => {
    render(
      <Router>
        <Cart cart={sampleCart} setCart={mockSetCart} />
      </Router>
    );

    expect(screen.getByText(/Shopping Cart/i)).toBeInTheDocument();
    expect(screen.getByText(/Product 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Product 2/i)).toBeInTheDocument();
    expect(screen.getByText(/\$20.00/i)).toBeInTheDocument();
    expect(screen.getByText(/\$15.00/i)).toBeInTheDocument();
  });

  test('removes item from cart', () => {
    render(
      <Router>
        <Cart cart={sampleCart} setCart={mockSetCart} />
      </Router>
    );

    const removeButtons = screen.getAllByText(/Remove/i);
    fireEvent.click(removeButtons[0]);

    expect(mockSetCart).toHaveBeenCalledWith([{ id: '2', name: 'Product 2', price: 15, image: 'https://example.com/product2.jpg' }]);
  });

  test('calculates total price correctly', () => {
    render(
      <Router>
        <Cart cart={sampleCart} setCart={mockSetCart} />
      </Router>
    );

    expect(screen.getByText(/Total: \$35.00/i)).toBeInTheDocument();
  });

  test('navigates to checkout on button click', () => {
    render(
      <Router>
        <Cart cart={sampleCart} setCart={mockSetCart} />
      </Router>
    );

    const checkoutButton = screen.getByText(/Proceed to Checkout/i);
    fireEvent.click(checkoutButton);

    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
});
