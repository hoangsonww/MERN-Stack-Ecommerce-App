import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../pages/Home';

// 1) Mock the ProductCard so it doesn’t pull in useNavigate
jest.mock('../components/ProductCard', () => ({ product }) => <div data-testid="product-card">{product.name}</div>);

// 2) Mock the carousel so we don’t exercise its internals
jest.mock('react-material-ui-carousel', () => props => <div data-testid="carousel">{props.children}</div>);

// 3) Mock all three banner images to simple strings
jest.mock('../assets/images/summer-sale.jpg', () => 'summer.jpg');
jest.mock('../assets/images/tech-gadgets.jpg', () => 'tech.jpg');
jest.mock('../assets/images/trending-fashion.jpg', () => 'fashion.jpg');

describe('<Home />', () => {
  const bannerAlts = ['Summer Sale - Up to 50% Off', 'New Tech Gadgets', 'Trending Electronics'];

  const makeProducts = n =>
    Array.from({ length: n }, (_, i) => ({
      _id: String(i + 1),
      name: `Prod${i + 1}`,
      category: 'any',
    }));

  it('renders the 3 banner images', () => {
    render(<Home products={[]} addToCart={() => {}} loading={false} error={null} />);
    bannerAlts.forEach(alt => {
      expect(screen.getByAltText(alt)).toBeInTheDocument();
    });
  });

  it('shows a spinner when loading=true', () => {
    render(<Home products={[]} addToCart={() => {}} loading={true} error={null} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an error alert when error is passed', () => {
    const err = new Error('Oops!');
    render(<Home products={[]} addToCart={() => {}} loading={false} error={err} />);
    expect(screen.getByText('Oops!')).toBeInTheDocument();
  });

  it('renders only the first 3 products as featured', () => {
    const five = makeProducts(5);
    render(<Home products={five} addToCart={() => {}} loading={false} error={null} />);
    const cards = screen.getAllByTestId('product-card');
    expect(cards).toHaveLength(3);
    expect(cards.map(c => c.textContent)).toEqual(['Prod1', 'Prod2', 'Prod3']);
  });
});
