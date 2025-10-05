import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OrderSuccess from '../pages/OrderSuccess';

describe('<OrderSuccess />', () => {
  it('renders the success heading and message', () => {
    render(
      <MemoryRouter>
        <OrderSuccess />
      </MemoryRouter>
    );
    expect(screen.getByText(/Order Successful!/i)).toBeInTheDocument();
    expect(screen.getByText(/Thank you for your purchase/i)).toBeInTheDocument();
    expect(screen.getByText(/prepping your order/i)).toBeInTheDocument();
  });

  it('renders the success icon', () => {
    render(
      <MemoryRouter>
        <OrderSuccess />
      </MemoryRouter>
    );
    // the CheckCircleOutlineIcon renders an SVG element
    const svg = screen.getByTestId('CheckCircleOutlineIcon');
    expect(svg).toBeInTheDocument();
  });
});
