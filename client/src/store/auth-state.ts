import { Socket } from "socket.io-client";

export let accessToken: string | null = null;
export let isAuthReady = false;
export let MySocket: { socket: Socket | null } = { socket: null };

let authReadyResolve: () => void;
export const authReadyPromise = new Promise<void>((resolve) => {
  authReadyResolve = resolve;
});

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setAuthReady(ready: boolean) {
  isAuthReady = ready;
  if (ready) {
    authReadyResolve();
  }
}