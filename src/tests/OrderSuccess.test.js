import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderSuccess from '../pages/OrderSuccess';

describe('OrderSuccess Component', () => {
  test('renders success icon', () => {
    render(<OrderSuccess />);

    // Check for the success icon by its role
    const successIcon = screen.getByTestId('CheckCircleOutlineIcon');
    expect(successIcon).toBeInTheDocument();
  });

  test('displays order success message', () => {
    render(<OrderSuccess />);

    // Check for the success message
    expect(screen.getByText(/Order Successful!/i)).toBeInTheDocument();
  });

  test('displays additional information message', () => {
    render(<OrderSuccess />);

    // Check for the additional information text
    expect(screen.getByText(/Thank you for your purchase. Your order is being processed./i)).toBeInTheDocument();
  });
});
