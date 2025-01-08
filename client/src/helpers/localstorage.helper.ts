export function getTokenFromLocalStorage(): string {
    return localStorage.getItem('token') || '';
}

export function setTokenToLocalStorage(key: string, token: string): void {
    localStorage.setItem(key, token);
}

export function removeTokenFromLocalStorage(key: string): void {
    localStorage.removeItem(key);
}