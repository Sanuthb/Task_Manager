export function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('access_token');
  } catch {
    return null;
  }
}

export async function apiFetch(path, { method = 'GET', body, params } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  const res = await fetch(`/api${path}${qs}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const TasksAPI = {
  list: (filters) => apiFetch('/tasks', { params: filters }),
  create: (data) => apiFetch('/tasks', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/tasks/${id}`, { method: 'PATCH', body: data }),
  remove: (id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
  listSubtasks: (id) => apiFetch(`/tasks/${id}/subtasks`),
  updateSubtask: (subId, data) => apiFetch(`/subtasks/${subId}`, { method: 'PATCH', body: data }),
  deleteSubtask: (subId) => apiFetch(`/subtasks/${subId}`, { method: 'DELETE' }),
  parse: (text) => apiFetch('/parse', { method: 'POST', body: { text } }),
  export: async (format = 'excel') => {
    const token = getToken();
    const qs = new URLSearchParams({ format }).toString();
    const res = await fetch(`/api/export?${qs}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'pdf' ? 'tasks.pdf' : 'tasks.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  stats: () => apiFetch('/stats'),
};
