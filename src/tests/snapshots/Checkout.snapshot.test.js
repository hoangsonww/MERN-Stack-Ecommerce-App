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

import Checkout from '../../pages/Checkout';

describe('Checkout snapshot', () => {
  it('matches the rendered markup (empty cart)', () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Checkout cartItems={[]} onOrderComplete={() => {}} />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
