import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Home from '../pages/Home';
import userEvent from '@testing-library/user-event';

describe('Home Component', () => {
  const mockAddToCart = jest.fn();

  const sampleProducts = [
    {
      _id: '1',
      name: 'Product 1',
      price: 100,
      description: 'Description for product 1',
      image: 'https://example.com/product1.jpg',
    },
    {
      _id: '2',
      name: 'Product 2',
      price: 200,
      description: 'Description for product 2',
      image: 'https://example.com/product2.jpg',
    },
    {
      _id: '3',
      name: 'Product 3',
      price: 300,
      description: 'Description for product 3',
      image: 'https://example.com/product3.jpg',
    },
  ];

  test('renders the carousel with images', () => {
    render(
      <Router>
        <Home products={[]} addToCart={mockAddToCart} error={null} loading={false} />
      </Router>
    );

    // Check that the carousel images are rendered
    expect(screen.getByAltText(/Summer Sale - Up to 50% Off/i)).toBeInTheDocument();
    expect(screen.getByAltText(/New Tech Gadgets/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Trending Fashion/i)).toBeInTheDocument();
  });

  test('displays loading indicator when loading is true', () => {
    render(
      <Router>
        <Home products={[]} addToCart={mockAddToCart} error={null} loading={true} />
      </Router>
    );

    // Check for the CircularProgress component
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message when there is an error', () => {
    const sampleError = { message: 'Failed to fetch products' };

    render(
      <Router>
        <Home products={[]} addToCart={mockAddToCart} error={sampleError} loading={false} />
      </Router>
    );

    // Check for the error message
    expect(screen.getByText(/Failed to fetch products/i)).toBeInTheDocument();
  });

  test('renders featured products when available', () => {
    render(
      <Router>
        <Home products={sampleProducts} addToCart={mockAddToCart} error={null} loading={false} />
      </Router>
    );

    // Check for the presence of product names
    expect(screen.getByText(/Product 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Product 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Product 3/i)).toBeInTheDocument();
  });

  test('renders "Shop Now" button correctly', () => {
    render(
      <Router>
        <Home products={[]} addToCart={mockAddToCart} error={null} loading={false} />
      </Router>
    );

    const shopNowButton = screen.getByRole('button', { name: /Shop Now/i });

    // Check if the button is in the document
    expect(shopNowButton).toBeInTheDocument();

    // Simulate click to test navigation or any side effects
    userEvent.click(shopNowButton);

    // Check for correct href attribute
    expect(shopNowButton.closest('a')).toHaveAttribute('href', '/shop');
  });
});
