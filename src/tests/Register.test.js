import React from 'react';
import { apiClient } from '../services/apiClient';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Register from '../pages/Register';

jest.mock('../services/apiClient', () => {
  const actual = jest.requireActual('../services/apiClient');
  return {
    ...actual,
    apiClient: { post: jest.fn() },
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('<Register />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('renders name, email, both password inputs and the Register button', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/name/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i, { selector: 'input' })).toBeInTheDocument();

    const pwInputs = screen.getAllByLabelText(/password/i, { selector: 'input' });
    expect(pwInputs).toHaveLength(2);

    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('toggles both password fields visibility', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
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
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
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

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('on success stores token & redirects', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { token: 'tok123' } });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
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

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(localStorage.getItem('token')).toBe('tok123'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }));
  });

  it('renders concatenated validation errors from server', async () => {
    apiClient.post.mockRejectedValueOnce({
      response: { data: { errors: [{ msg: 'Err1' }, { msg: 'Err2' }] } },
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    let [pwd, cpwd] = screen.getAllByLabelText(/password/i, { selector: 'input' });
    fireEvent.change(pwd, { target: { value: 'x' } });
    fireEvent.change(cpwd, { target: { value: 'x' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/Err1, Err2/)).toBeInTheDocument();
  });

  it('renders single server error message', async () => {
    apiClient.post.mockRejectedValueOnce({
      response: { data: { msg: 'Single error' } },
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    let [pwd, cpwd] = screen.getAllByLabelText(/password/i, { selector: 'input' });
    fireEvent.change(pwd, { target: { value: 'y' } });
    fireEvent.change(cpwd, { target: { value: 'y' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/Single error/)).toBeInTheDocument();
  });
});
