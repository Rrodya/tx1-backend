import { Socket } from "socket.io";
import http from "http"
import { Server } from "socket.io";

export default function startDriverConnection() {
  const server = http.createServer();
  const io = new Server(server);

  // Handle socket connections and events for server one here
  io.on('connection', (socket: Socket) => {
    console.log("A driver was connected")
    socket.on('disconnect', () => {
      console.log("A driver was disconnected")
    });
  });

  return {
    server,
    io,
  };
}

