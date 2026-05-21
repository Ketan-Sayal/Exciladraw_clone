import { io, type Socket } from 'socket.io-client';
import { config } from './config';

export const getSocket:(token:string)=>Socket = (token:string)=>{ 
    const socket:Socket = io(`${config.backendWsUrl}?token=${token}`);
    return socket;
}