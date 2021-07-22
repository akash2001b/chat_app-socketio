const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const cors = require("cors");
const Filter = require("bad-words");
const {
  addUser,
  removeUser,
  getUser,
  getUsersinRoom,
} = require("./utils/users");

const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, "../public");

app.use(cors());

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New websocket connection");

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    
    socket.emit("message", generateMessage('Admin',"Welcome"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage('Admin',`${user.username} has joined`));

      io.to(user.room).emit('roomData',{
          room:user.room,
          users:getUsersinRoom(user.room)
      });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
      const user=getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity in not allowed");
    }
    io.to(user.room).emit("message", generateMessage(user.username,message));
    callback();
  });

  socket.on("sendLocation", (coords, callback) => {
      const user=getUser(socket.id);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user=removeUser(socket.id);
    if(user){
        io.to(user.room).emit("message", generateMessage('Admin',`${user.username} has left!`));

        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersinRoom(user.room)
        });
    }
    console.log("User has disconnected!");
  });
});

server.listen(port, () => {
  console.log(`Sever is up on port ${port}`);
});
