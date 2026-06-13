import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Privacy from '../../pages/Privacy';

describe('Privacy snapshot', () => {
  it('matches the rendered markup', () => {
    const { asFragment } = render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
