export const getTokenPayload = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
};

export const getUserRole = (): string | null => {
    const payload = getTokenPayload();
    return payload?.role ?? null;
};