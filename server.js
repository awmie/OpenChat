import express from "express";
import http from "http";
import { Server } from "socket.io";

// Create an Express application
const app = express();

// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static("public"));

// Function to generate a random user ID
function generateUserId() {
  return "user-" + Math.random().toString(36).substring(2, 11);
}

// Function to generate a random color
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Function to determine text color for contrast
function getContrastYIQ(hexcolor) {
  const r = parseInt(hexcolor.substr(1, 2), 16);
  const g = parseInt(hexcolor.substr(3, 2), 16);
  const b = parseInt(hexcolor.substr(5, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white"; // Return 'black' for light colors and 'white' for dark colors
}

// Track connected users
const users = new Map();

io.on("connection", (socket) => {
  const userId = generateUserId(); // Generate a random user ID
  const userColor = getRandomColor(); // Generate a random color
  const textColor = getContrastYIQ(userColor); // Determine text color for contrast
  users.set(socket.id, { userId, userColor, textColor }); // Add user to the connected users map
  console.log(`User connected: ${userId} with color: ${userColor}`);

  // Send user ID and color to the client
  socket.emit("user id", { userId, userColor, textColor });

  // Notify all clients about the current number of users
  io.emit("user count", users.size);

  // Notify others that a user has connected
  socket.broadcast.emit("chat message", {
    msg: `${userId} has joined the chat`,
    userId: "system",
    userColor: "",
    textColor: "",
  });

  // Handle chat message
  socket.on("chat message", (msg) => {
    console.log("Received message:", msg); // Log the received message
    io.emit("chat message", { userId, msg, userColor, textColor }); // Broadcast the message to all clients along with user ID and color
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
    users.delete(socket.id); // Remove user from connected users
    // Notify all clients about the current number of users
    io.emit("user count", users.size);
    // Notify others that a user has left
    socket.broadcast.emit("chat message", {
      msg: `${userId} has left the chat.`,
      userId: "system",
      userColor: "",
      textColor: "",
    });
  });
});

// Define the port
const PORT = 3000;

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
