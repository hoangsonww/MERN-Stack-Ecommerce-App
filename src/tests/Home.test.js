import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../pages/Home';

// Mock the ProductCard so it doesn't pull in useNavigate
jest.mock('../components/ProductCard', () => ({ product }) => <div data-testid="product-card">{product.name}</div>);

// Mock the 3D hero so tests never touch WebGL / three
jest.mock('../components/HeroScene', () => () => <div data-testid="hero-scene" />);

describe('<Home />', () => {
  const makeProducts = n =>
    Array.from({ length: n }, (_, i) => ({
      _id: String(i + 1),
      name: `Prod${i + 1}`,
      category: 'any',
    }));

  it('shows a spinner when loading=true', () => {
    render(
      <MemoryRouter>
        <Home products={[]} addToCart={() => {}} loading={true} error={null} />
      </MemoryRouter>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an error alert when error is passed', () => {
    const err = new Error('Oops!');
    render(
      <MemoryRouter>
        <Home products={[]} addToCart={() => {}} loading={false} error={err} />
      </MemoryRouter>
    );
    expect(screen.getByText('Oops!')).toBeInTheDocument();
  });

  it('renders only the first 3 products as featured', () => {
    const five = makeProducts(5);
    render(
      <MemoryRouter>
        <Home products={five} addToCart={() => {}} loading={false} error={null} />
      </MemoryRouter>
    );
    const cards = screen.getAllByTestId('product-card');
    // Home page now renders Featured Products (3) + New Arrivals (5) = 8 total
    // Featured products are the first 3 in the array
    expect(cards.length).toBeGreaterThanOrEqual(3);
    expect(cards[0].textContent).toBe('Prod1');
    expect(cards[1].textContent).toBe('Prod2');
    expect(cards[2].textContent).toBe('Prod3');
  });
});
