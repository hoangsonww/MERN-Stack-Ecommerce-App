import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import About from '../../pages/About';

describe('About snapshot', () => {
  it('matches the rendered markup', () => {
    const { asFragment } = render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
