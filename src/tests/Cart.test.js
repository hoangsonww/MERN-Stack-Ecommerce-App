import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Cart from '../pages/Cart';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('<Cart />', () => {
  it('shows empty message when cart is empty', () => {
    render(<Cart cart={[]} setCart={jest.fn()} />);
    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    expect(screen.queryByText(/Total:/i)).not.toBeInTheDocument();
  });

  it('displays items and total correctly', () => {
    const items = [
      { id: '1', name: 'Widget', price: 9.99, image: '' },
      { id: '2', name: 'Gizmo', price: 5.01, image: '' },
    ];
    render(<Cart cart={items} setCart={jest.fn()} />);
    // list items
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('Gizmo')).toBeInTheDocument();
    // total = 9.99 + 5.01 = 15.00
    expect(screen.getByText(/Total: \$15\.00/)).toBeInTheDocument();
  });

  it('calls setCart when Remove is clicked', () => {
    const items = [
      { id: '1', name: 'Widget', price: 9.99, image: '' },
      { id: '2', name: 'Gizmo', price: 5.01, image: '' },
    ];
    const setCart = jest.fn();
    render(<Cart cart={items} setCart={setCart} />);
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);
    expect(setCart).toHaveBeenCalledWith([{ id: '2', name: 'Gizmo', price: 5.01, image: '' }]);
  });

  it('navigates to /checkout on Proceed to Checkout click', () => {
    const items = [{ id: '1', name: 'Widget', price: 9.99, image: '' }];
    render(<Cart cart={items} setCart={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
});
