import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../services/apiClient', () => ({
  apiClient: {
    get: () => new Promise(() => {}),
    post: () => new Promise(() => {}),
    put: () => new Promise(() => {}),
    delete: () => new Promise(() => {}),
  },
  withRetry: () => new Promise(() => {}),
  API_BASE_URL: 'http://test',
}));

// ProductCard pulls in useNavigate/images; the carousel measures layout. Stub
// both so the Home snapshot is deterministic.
jest.mock('../../components/ProductCard', () => ({ product }) => <div data-testid="product-card">{product && product.name}</div>);
jest.mock('react-material-ui-carousel', () => props => <div data-testid="carousel">{props.children}</div>);

// Banner images -> plain strings (the global identity-obj-proxy mapping yields
// a Proxy that misbehaves when used as an <img src>).
jest.mock('../../assets/images/summer-sale.jpg', () => 'summer.jpg');
jest.mock('../../assets/images/tech-gadgets.jpg', () => 'tech.jpg');
jest.mock('../../assets/images/trending-fashion.png', () => 'fashion.png');

import Home from '../../pages/Home';

describe('Home snapshot', () => {
  it('matches the rendered markup (loaded, empty products)', () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={['/']}>
        <Home products={[]} addToCart={() => {}} loading={false} error={null} />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
