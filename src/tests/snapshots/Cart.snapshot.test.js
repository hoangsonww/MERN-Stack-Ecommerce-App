import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Cart from '../../pages/Cart';

describe('Cart snapshot', () => {
  it('matches the rendered markup (empty cart)', () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={['/cart']}>
        <Cart cart={[]} setCart={() => {}} />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
