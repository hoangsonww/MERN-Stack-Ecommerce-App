import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Support from '../../pages/Support';

describe('Support snapshot', () => {
  it('matches the rendered markup', () => {
    const { asFragment } = render(
      <MemoryRouter initialEntries={['/support']}>
        <Support />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
