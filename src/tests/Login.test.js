import React from 'react';
import axios from 'axios';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../pages/Login';

jest.mock('axios');

describe('<Login />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // stub window.location so we don't actually navigate
    delete window.location;
    window.location = { href: '' };
  });

  it('renders email & password inputs and the Login button', () => {
    render(<Login />);
    expect(screen.getByLabelText(/email/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<Login />);
    const pwdInput = screen.getByLabelText(/password/i, { selector: 'input' });
    const toggleBtn = screen.getByRole('button', {
      name: /toggle password visibility/i,
    });

    expect(pwdInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleBtn);
    expect(pwdInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggleBtn);
    expect(pwdInput).toHaveAttribute('type', 'password');
  });

  it('on success stores token and redirects', async () => {
    axios.post.mockResolvedValueOnce({ data: { token: 'abc123' } });

    render(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i, { selector: 'input' }), {
      target: { value: 'u@e.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), { target: { value: 'secret' } });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // wait for the axios call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    // now wait for localStorage to be updated
    await waitFor(() => {
      expect(localStorage.getItem('MERNEcommerceToken')).toBe('abc123');
    });

    // and finally, the redirect
    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });

  it('displays concatenated validation errors from server', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { errors: [{ msg: 'Bad email' }, { msg: 'Short pw' }] } },
    });

    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/Bad email, Short pw/)).toBeInTheDocument();
  });

  it('displays single error message from server', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { msg: 'Invalid credentials' } },
    });

    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/Invalid credentials/)).toBeInTheDocument();
  });
});
