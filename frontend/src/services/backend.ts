import axios from 'axios'
import { io, type Socket } from 'socket.io-client'

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000'

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
})

let socket: Socket | null = null

export function getSocket(): Socket {
    if (socket && socket.connected) return socket
    if (!socket) {
        socket = io(API_BASE_URL, { withCredentials: true, autoConnect: true })
    } else if (!socket.connected) {
        try { socket.connect() } catch { }
    }
    return socket
}

export function getApiBaseUrl(): string {
    return API_BASE_URL
}


