import api from './api.js';

export async function login(email, password) {
  try {
    const response = await api.post('/login', { email, password });
    const data = response.data;
    if (data) {
      if (data.jwt) localStorage.setItem('token', data.jwt);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  } catch (err) {
    console.error('authService.login error:', err);
    return null;
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export default { login, logout };
