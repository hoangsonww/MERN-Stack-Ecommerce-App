import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../../components/Footer';

// Footer renders `© {new Date().getFullYear()}`, so freeze "now" to keep the
// snapshot stable across years/runs.
const RealDate = Date;
const FIXED_ISO = '2024-06-15T12:00:00.000Z';

beforeAll(() => {
  global.Date = class extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [FIXED_ISO]));
    }
    static now() {
      return new RealDate(FIXED_ISO).getTime();
    }
  };
});

afterAll(() => {
  global.Date = RealDate;
});

describe('Footer snapshot', () => {
  it('matches the rendered markup', () => {
    const { asFragment } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
