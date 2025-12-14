import { io, Socket } from 'socket.io-client';

// Replace with your machine's IP address if testing on a real device
// For simulator, localhost is usually fine, but 10.0.2.2 for Android emulator
const SERVER_URL = 'http://172.28.242.194:3000';

class SocketService {
    public socket: Socket | null = null;

    connect() {
        if (this.socket) return; // Prevent overwriting existing connection

        this.socket = io(SERVER_URL, {
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('Connected to server with ID:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on('connect_error', (err) => {
            console.log('Socket connection error:', err);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event: string, ...args: any[]) {
        if (this.socket) {
            this.socket.emit(event, ...args);
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string) {
        if (this.socket) {
            this.socket.off(event);
        }
    }
}

export default new SocketService();
