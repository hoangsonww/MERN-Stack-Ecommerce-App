import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Shop from '../pages/Shop';

// Mock ProductCard so it doesn’t invoke useNavigate
jest.mock('../components/ProductCard', () => ({ product }) => <div data-testid="product-card">{product.name}</div>);

describe('<Shop />', () => {
  const makeProducts = (n, category = 'cat') =>
    Array.from({ length: n }, (_, i) => ({
      id: String(i + 1),
      name: `Item${i + 1}`,
      category,
    }));

  it('shows loading spinner when loading=true', () => {
    render(<Shop products={[]} addToCart={() => {}} loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders header and no cards when products empty', () => {
    render(<Shop products={[]} addToCart={() => {}} loading={false} />);
    expect(screen.getByText(/^Shop$/)).toBeInTheDocument();
    expect(screen.queryAllByTestId('product-card')).toHaveLength(0);
  });

  it('renders up to 6 product cards per page', () => {
    const six = makeProducts(6);
    render(<Shop products={six} addToCart={() => {}} loading={false} />);
    expect(screen.getAllByTestId('product-card')).toHaveLength(6);
  });

  it('paginates when more than 6 products', async () => {
    const eight = makeProducts(8);
    render(<Shop products={eight} addToCart={() => {}} loading={false} />);

    // Page 1 should show 6 cards
    expect(screen.getAllByTestId('product-card')).toHaveLength(6);

    // Click the "Go to page 2" button
    fireEvent.click(screen.getByRole('button', { name: /go to page 2/i }));

    // Wait for the new set of cards on page 2 (should be 2)
    const page2Cards = await screen.findAllByTestId('product-card');
    expect(page2Cards).toHaveLength(2);
  });
});
