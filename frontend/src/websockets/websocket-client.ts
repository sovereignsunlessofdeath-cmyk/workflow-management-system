export type SocketMessage = {
  type: string;
  [key: string]: unknown;
};

type SocketOptions = {
  path: string;
  onMessage?: (data: SocketMessage) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnect?: boolean;
};

export class WMSSocket {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private manuallyClosed = false;

  private readonly options: SocketOptions;

  constructor(options: SocketOptions) {
    this.options = options;
  }

  connect() {
    const accessToken =
      localStorage.getItem("access_token");

    if (!accessToken) {
      return;
    }

    this.manuallyClosed = false;

    const baseUrl =
      import.meta.env.VITE_WS_BASE_URL;

    const url =
      `${baseUrl}${this.options.path}` +
      `?token=${encodeURIComponent(accessToken)}`;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.options.onOpen?.();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(
          event.data,
        ) as SocketMessage;

        this.options.onMessage?.(data);
      } catch {
        console.error(
          "Invalid WebSocket message received.",
        );
      }
    };

    this.socket.onclose = (event) => {
      this.options.onClose?.(event);

      if (
        !this.manuallyClosed &&
        this.options.reconnect !== false
      ) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (event) => {
      this.options.onError?.(event);
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }

    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempts,
      15000,
    );

    this.reconnectAttempts += 1;

    this.reconnectTimer =
      window.setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, delay);
  }

  send(data: SocketMessage) {
    if (
      this.socket?.readyState !==
      WebSocket.OPEN
    ) {
      return false;
    }

    this.socket.send(
      JSON.stringify(data),
    );

    return true;
  }

  disconnect() {
    this.manuallyClosed = true;

    if (this.reconnectTimer) {
      window.clearTimeout(
        this.reconnectTimer,
      );

      this.reconnectTimer = null;
    }

    this.socket?.close();
    this.socket = null;
  }

  isConnected() {
    return (
      this.socket?.readyState ===
      WebSocket.OPEN
    );
  }
}