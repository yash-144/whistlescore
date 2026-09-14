const ws = typeof window !== 'undefined' ? window.WebSocket : (typeof globalThis !== 'undefined' ? (globalThis as any).WebSocket : undefined);

export default ws;
export { ws as WebSocket };
