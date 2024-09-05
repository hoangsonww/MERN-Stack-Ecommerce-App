import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Shop from '../pages/Shop';
import { BrowserRouter as Router } from 'react-router-dom';

describe('Shop Component', () => {
  const mockAddToCart = jest.fn();

  const sampleProducts = [
    { id: '1', name: 'Product 1', category: 'Electronics', price: 100, image: 'https://example.com/product1.jpg' },
    { id: '2', name: 'Product 2', category: 'Clothing', price: 200, image: 'https://example.com/product2.jpg' },
    { id: '3', name: 'Product 3', category: 'Electronics', price: 300, image: 'https://example.com/product3.jpg' },
    { id: '4', name: 'Product 4', category: 'Books', price: 150, image: 'https://example.com/product4.jpg' },
    { id: '5', name: 'Product 5', category: 'Clothing', price: 50, image: 'https://example.com/product5.jpg' },
    { id: '6', name: 'Product 6', category: 'Books', price: 250, image: 'https://example.com/product6.jpg' },
    { id: '7', name: 'Product 7', category: 'Electronics', price: 180, image: 'https://example.com/product7.jpg' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Shop component with products', () => {
    render(
      <Router>
        <Shop products={sampleProducts} addToCart={mockAddToCart} />
      </Router>
    );

    // Check that the component displays the title
    expect(screen.getByText(/Shop/i)).toBeInTheDocument();

    // Check that the first few products are rendered
    expect(screen.getByText(/Product 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Product 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Product 3/i)).toBeInTheDocument();
  });

  test('filters products by category', () => {
    render(
      <Router>
        <Shop products={sampleProducts} addToCart={mockAddToCart} />
      </Router>
    );

    // Select category 'Electronics'
    fireEvent.mouseDown(screen.getByLabelText(/Filter by Category/i));
    fireEvent.click(screen.getByText(/Electronics/i));

    // Ensure that only products from the selected category are displayed
    expect(screen.getByText(/Product 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Product 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Product 7/i)).toBeInTheDocument();

    // Ensure that products from other categories are not displayed
    expect(screen.queryByText(/Product 2/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Product 4/i)).not.toBeInTheDocument();
  });

  test('displays pagination and handles page change', () => {
    render(
      <Router>
        <Shop products={sampleProducts} addToCart={mockAddToCart} />
      </Router>
    );

    // Check that pagination is rendered
    const pagination = screen.getByRole('navigation');
    expect(pagination).toBeInTheDocument();

    // Verify initial state of the page
    expect(screen.getByText(/Product 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Product 7/i)).not.toBeInTheDocument();

    // Simulate page change to 2
    fireEvent.click(screen.getByRole('button', { name: /2/i }));

    // Ensure products from the second page are displayed
    expect(screen.getByText(/Product 7/i)).toBeInTheDocument();
    expect(screen.queryByText(/Product 1/i)).not.toBeInTheDocument();
  });

  test('resets to first page on category change', () => {
    render(
      <Router>
        <Shop products={sampleProducts} addToCart={mockAddToCart} />
      </Router>
    );

    // Change to page 2
    fireEvent.click(screen.getByRole('button', { name: /2/i }));
    expect(screen.getByText(/Product 7/i)).toBeInTheDocument();

    // Change category to 'Books'
    fireEvent.mouseDown(screen.getByLabelText(/Filter by Category/i));
    fireEvent.click(screen.getByText(/Books/i));

    // Verify that it resets to the first page
    expect(screen.getByText(/Product 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Product 6/i)).toBeInTheDocument();
    expect(screen.queryByText(/Product 7/i)).not.toBeInTheDocument();
  });
});
