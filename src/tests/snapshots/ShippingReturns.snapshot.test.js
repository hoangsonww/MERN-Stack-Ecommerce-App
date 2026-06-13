import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ShippingReturns from '../../pages/ShippingReturns';

describe('ShippingReturns snapshot', () => {
  it('matches the rendered markup', () => {
    const { asFragment } = render(
      <MemoryRouter>
        <ShippingReturns />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
