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

import ResetPassword from '../../pages/ResetPassword';

describe('ResetPassword snapshot', () => {
  it('matches the rendered markup', () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <ResetPassword />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
