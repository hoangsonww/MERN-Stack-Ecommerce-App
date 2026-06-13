import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../components/ProductCard', () => ({ product }) => <div data-testid="product-card">{product && product.name}</div>);

import Shop from '../../pages/Shop';

describe('Shop snapshot', () => {
  it('matches the rendered markup (loaded, empty products)', () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={['/shop']}>
        <Shop products={[]} addToCart={() => {}} loading={false} error={null} />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
