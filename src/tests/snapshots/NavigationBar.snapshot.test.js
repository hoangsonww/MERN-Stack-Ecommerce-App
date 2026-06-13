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

jest.mock('../../context/NotificationProvider', () => ({
  useNotifier: () => ({ notify: jest.fn() }),
  NotificationProvider: ({ children }) => children,
}));

import NavigationBar from '../../components/NavigationBar';

describe('NavigationBar snapshot', () => {
  it('matches the rendered markup', () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={['/']}>
        <NavigationBar cartItemCount={0} />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
