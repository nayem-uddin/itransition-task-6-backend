require("dotenv").config();
const express = require("express");
const protocol = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const db = require("./handleDB");
const corsOptions = {
  origin: "https://itransition-task-6-frontend.vercel.app",
  methods: ["GET", "POST"],
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
const server = protocol.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

server.listen(process.env.SERVER_PORT, () => {
  console.log("server listening at port " + process.env.SERVER_PORT);
});

io.on("connect", (socket) => {
  socket.on("request-all-presentations", async () => {
    const presentations = await db.getallPresentations();
    await db.createSlidesTable();
    socket.emit("get-all-presentations", { presentations });
  });

  socket.on("user-entry", (username) => {
    socket.username = username;
    console.log(socket.username + " has connected");
  });

  socket.on("add-new-presentation", async (data) => {
    await db.addNewPresentation(data);
    await db.addSlide(data.title, 0);
    const presentations = await db.getallPresentations();
    io.emit("get-all-presentations", {
      presentations,
    });
    const presentation = await db.getPresentation(data.title);
    socket.emit("deliver-presentation", { presentation });
  });

  socket.on("request-presentation", async (title) => {
    const presentation = await db.getPresentation(title);
    io.emit("deliver-presentation", { presentation });
  });

  socket.on("add-slide", async ({ title, presentationLength }) => {
    await db.addSlide(title, presentationLength);
    const presentation = await db.getPresentation(title);
    io.emit("deliver-presentation", { presentation });
  });

  socket.on("update-slide", async ({ title, slideNo, updatedSlide }) => {
    await db.updateSlide(title, slideNo, updatedSlide);
    const presentation = await db.getPresentation(title);
    io.emit("deliver-presentation", { presentation });
  });

  socket.on("disconnect", () =>
    console.log(socket.username + " is disconnected")
  );
});
