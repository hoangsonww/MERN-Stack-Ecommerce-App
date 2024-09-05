import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';
import ProductDetails from '../pages/ProductDetails';

// Mock useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '1' }), // Mock the id parameter
}));

// Mock axios for API calls
jest.mock('axios');

describe('ProductDetails Component', () => {
  const mockAddToCart = jest.fn();

  const sampleProduct = {
    _id: '1',
    name: 'Sample Product',
    brand: 'Brand A',
    category: 'Category A',
    price: 100,
    description: 'This is a sample product description.',
    image: 'https://example.com/product1.jpg',
    stock: 10,
    rating: 4,
    numReviews: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    render(
      <Router>
        <ProductDetails addToCart={mockAddToCart} />
      </Router>
    );

    // Check for the loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message when there is an error', async () => {
    axios.get.mockRejectedValue(new Error('Failed to load product details'));

    render(
      <Router>
        <ProductDetails addToCart={mockAddToCart} />
      </Router>
    );

    await waitFor(() => {
      // Check for the error message
      expect(screen.getByText(/Error loading product details/i)).toBeInTheDocument();
    });
  });

  test('renders product details when data is fetched successfully', async () => {
    axios.get.mockResolvedValue({ data: sampleProduct });

    render(
      <Router>
        <ProductDetails addToCart={mockAddToCart} />
      </Router>
    );

    await waitFor(() => {
      // Check for the product name
      expect(screen.getByText(/Sample Product/i)).toBeInTheDocument();
      // Check for the brand
      expect(screen.getByText(/Brand: Brand A/i)).toBeInTheDocument();
      // Check for the category
      expect(screen.getByText(/Category: Category A/i)).toBeInTheDocument();
      // Check for the price
      expect(screen.getByText(/\$100/i)).toBeInTheDocument();
      // Check for the description
      expect(screen.getByText(/This is a sample product description./i)).toBeInTheDocument();
      // Check for the stock message
      expect(screen.getByText(/10 Available/i)).toBeInTheDocument();
      // Check for the rating and number of reviews
      expect(screen.getByText(/\(5 Reviews\)/i)).toBeInTheDocument();
    });
  });

  test('handles add to cart functionality', async () => {
    axios.get.mockResolvedValue({ data: sampleProduct });

    render(
      <Router>
        <ProductDetails addToCart={mockAddToCart} />
      </Router>
    );

    await waitFor(() => {
      const addToCartButton = screen.getByRole('button', { name: /Add to Cart/i });
      fireEvent.click(addToCartButton);
      expect(mockAddToCart).toHaveBeenCalledWith(sampleProduct);
    });
  });

  test('handles rating change', async () => {
    axios.get.mockResolvedValue({ data: sampleProduct });
    axios.put.mockResolvedValue({ data: { ...sampleProduct, rating: 4.5, numReviews: 6 } });

    render(
      <Router>
        <ProductDetails addToCart={mockAddToCart} />
      </Router>
    );

    await waitFor(() => {
      const ratingStars = screen.getByLabelText('4 Stars');
      // eslint-disable-next-line testing-library/no-wait-for-side-effects
      fireEvent.click(ratingStars);
    });

    await waitFor(() => {
      // Check if the new rating was submitted
      expect(axios.put).toHaveBeenCalledWith('http://localhost:5000/api/products/1/rating', { rating: 4.5 });
    });
  });
});
