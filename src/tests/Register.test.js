// src/tests/Register.test.js
import React from 'react';
import axios from 'axios';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../pages/Register';

jest.mock('axios');

describe('<Register />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    delete window.location;
    window.location = { href: '' };
  });

  it('renders name, email, both password inputs and the Register button', () => {
    render(<Register />);
    expect(screen.getByLabelText(/name/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i, { selector: 'input' })).toBeInTheDocument();

    const pwInputs = screen.getAllByLabelText(/password/i, { selector: 'input' });
    expect(pwInputs).toHaveLength(2);

    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('toggles both password fields visibility', () => {
    render(<Register />);
    let [pwd, cpwd] = screen.getAllByLabelText(/password/i, { selector: 'input' });
    const togglePwd = screen.getByRole('button', { name: /toggle password visibility/i });
    const toggleCpwd = screen.getByRole('button', {
      name: /toggle confirm password visibility/i,
    });

    expect(pwd).toHaveAttribute('type', 'password');
    expect(cpwd).toHaveAttribute('type', 'password');

    fireEvent.click(togglePwd);
    [pwd, cpwd] = screen.getAllByLabelText(/password/i, { selector: 'input' });
    expect(pwd).toHaveAttribute('type', 'text');
    expect(cpwd).toHaveAttribute('type', 'password');

    fireEvent.click(toggleCpwd);
    [pwd, cpwd] = screen.getAllByLabelText(/password/i, { selector: 'input' });
    expect(pwd).toHaveAttribute('type', 'text');
    expect(cpwd).toHaveAttribute('type', 'text');
  });

  it('shows "Passwords do not match" without calling axios', async () => {
    render(<Register />);
    fireEvent.change(screen.getByLabelText(/name/i, { selector: 'input' }), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByLabelText(/email/i, { selector: 'input' }), {
      target: { value: 'a@b.com' },
    });
    const [pwd, cpwd] = screen.getAllByLabelText(/password/i, { selector: 'input' });
    fireEvent.change(pwd, { target: { value: '1234' } });
    fireEvent.change(cpwd, { target: { value: 'abcd' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(axios.post).not.toHaveBeenCalled();
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('on success stores token & redirects', async () => {
    axios.post.mockResolvedValueOnce({ data: { token: 'tok123' } });

    render(<Register />);
    fireEvent.change(screen.getByLabelText(/name/i, { selector: 'input' }), {
      target: { value: 'Bob' },
    });
    fireEvent.change(screen.getByLabelText(/email/i, { selector: 'input' }), {
      target: { value: 'b@c.com' },
    });
    let [pwd, cpwd] = screen.getAllByLabelText(/password/i, { selector: 'input' });
    fireEvent.change(pwd, { target: { value: 'pw' } });
    fireEvent.change(cpwd, { target: { value: 'pw' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(localStorage.getItem('token')).toBe('tok123'));
    await waitFor(() => expect(window.location.href).toBe('/'));
  });

  it('renders concatenated validation errors from server', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { errors: [{ msg: 'Err1' }, { msg: 'Err2' }] } },
    });

    render(<Register />);
    let [pwd, cpwd] = screen.getAllByLabelText(/password/i, { selector: 'input' });
    fireEvent.change(pwd, { target: { value: 'x' } });
    fireEvent.change(cpwd, { target: { value: 'x' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/Err1, Err2/)).toBeInTheDocument();
  });

  it('renders single server error message', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { msg: 'Single error' } },
    });

    render(<Register />);
    let [pwd, cpwd] = screen.getAllByLabelText(/password/i, { selector: 'input' });
    fireEvent.change(pwd, { target: { value: 'y' } });
    fireEvent.change(cpwd, { target: { value: 'y' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/Single error/)).toBeInTheDocument();
  });
});
