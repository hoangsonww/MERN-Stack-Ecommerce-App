import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderSuccess from '../pages/OrderSuccess';

describe('<OrderSuccess />', () => {
  it('renders the success heading and message', () => {
    render(<OrderSuccess />);
    expect(screen.getByText(/Order Successful!/i)).toBeInTheDocument();
    expect(screen.getByText(/Thank you for your purchase\. Your order is being processed\./i)).toBeInTheDocument();
  });

  it('renders the success icon', () => {
    render(<OrderSuccess />);
    // the CheckCircleOutlineIcon renders an SVG element
    const svg = screen.getByTestId('CheckCircleOutlineIcon');
    expect(svg).toBeInTheDocument();
  });
});
