import React from 'react';
import axios from 'axios';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProductDetails from '../pages/ProductDetails';

jest.mock('axios');

describe('<ProductDetails />', () => {
  const fakeProduct = {
    id: '123',
    name: 'Test',
    brand: 'Brand',
    category: 'cat',
    price: 10,
    description: 'Desc',
    image: 'img.jpg',
    stock: 5,
    rating: 4,
    numReviews: 2,
  };

  beforeEach(() => {
    axios.get.mockResolvedValue({ data: fakeProduct });
    axios.put.mockResolvedValue({});
  });

  function renderWithRouter() {
    return render(
      <MemoryRouter initialEntries={['/product/123']}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetails addToCart={() => {}} />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders loading spinner then details', async () => {
    renderWithRouter();
    // initial spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // after fetch completes
    expect(await screen.findByText(/Test/)).toBeInTheDocument();
    expect(screen.getByText(/Brand:/)).toBeInTheDocument();
  });

  it('shows the "Add to Cart" button once loaded', async () => {
    renderWithRouter();
    await screen.findByText(/Add to Cart/);
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('renders stock info and the correct rating radio', async () => {
    renderWithRouter();

    // wait for the stock text to appear
    expect(await screen.findByText(/In Stock:/i)).toBeInTheDocument();
    // stock chip
    expect(screen.getByText(/5 Available/i)).toBeInTheDocument();

    // the input for rating=4 should be present and labeled "4 Stars"
    const fourStarRadio = screen.getByRole('radio', { name: /4 Stars/i });
    expect(fourStarRadio).toBeInTheDocument();
    // And it should be checked by default
    expect(fourStarRadio).toBeChecked();
  });
});
