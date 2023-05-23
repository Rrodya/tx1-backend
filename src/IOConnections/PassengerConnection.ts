import { Socket } from "socket.io";
import http from "http";
import { Server } from "socket.io";

export default function startPassengerConnection() {
  const server = http.createServer();
  const io = new Server(server);

  io.of("/start-drive").on("connection", (socket: Socket) => {
    console.log("New connection");
    socket.on("find-taxi", (data: any) => {
      console.log("fins taxi started");
      const attempts = 10;
      let currAtt = 0;
      console.log(data);
      setTimeout(() => {
        if (currAtt === attempts) {
          socket.send({ driverId: currAtt });
        }
      });
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
  io.on("find-taxi", (data: any) => {
    console.log("fins taxi started");
  });
  // Handle socket connections and events for server one here
  io.on("connection", (socket: Socket) => {
    console.log("A passenger was connected");
    socket.on("disconnect", () => {
      console.log("A passenger was disconnected");
    });
  });

  return {
    server,
    io,
  };
}
