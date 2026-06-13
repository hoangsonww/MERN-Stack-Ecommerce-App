import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OrderSuccess from '../../pages/OrderSuccess';

describe('OrderSuccess snapshot', () => {
  it('matches the rendered markup', () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={['/order-success']}>
        <OrderSuccess />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
