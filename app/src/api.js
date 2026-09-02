// API client: dynamic base URL + JWT token handling.
const TOKEN_KEY = 'hr_access_token';
const SERVER_KEY = 'hr_server_ip';

export function getBaseUrl() {
    return (localStorage.getItem(SERVER_KEY) || 'http://192.168.1.100:8000').replace(/\/+$/, '');
}

export function setBaseUrl(url) {
    localStorage.setItem(SERVER_KEY, url);
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
    return Boolean(getToken());
}

async function request(method, path, { body, params } = {}) {
    const url = new URL(getBaseUrl() + path);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
        });
    }

    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(url.toString(), {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error(
            'Serverga ulanishda xatolik. API manzilini tekshiring (Sozlamalar ⚙️).'
        );
    }

    if (response.status === 401) {
        setToken(null);
    }

    let data = null;
    const text = await response.text();
    if (text) {
        try { data = JSON.parse(text); } catch { data = text; }
    }

    if (!response.ok) {
        const message =
            (data && (data.detail || data.message)) || 'So\'rov bajarilmadi';
        const err = new Error(typeof message === 'string' ? message : JSON.stringify(message));
        err.status = response.status;
        throw err;
    }

    return data;
}

export const api = {
    login: (login, password) => request('POST', '/api/auth/login', { body: { login, password } }),
    me: () => request('GET', '/api/auth/me'),
    statsToday: () => request('GET', '/api/attendance/stats/today'),
    employees: (search, brigade) => request('GET', '/api/employees', { params: { search, brigade } }),
    employee: (id) => request('GET', `/api/employees/${id}`),
    schedules: (date) => request('GET', '/api/schedules', { params: { date } }),
    assign: (scheduleId, employeeIds) =>
        request('POST', `/api/schedules/${scheduleId}/assign`, { body: { employee_ids: employeeIds } }),
    removeAssignment: (assignmentId) =>
        request('DELETE', `/api/schedules/assignments/${assignmentId}`),
    attendanceRecords: (date, employeeId) =>
        request('GET', '/api/attendance/records', { params: { date, employee_id: employeeId } }),
    attendanceEvents: (date) => request('GET', '/api/attendance/events', { params: { date } }),
};
