import express from "express"
import { createServer } from "node:http"
import { Server, Socket } from "socket.io";
import {configDotenv} from "dotenv"

configDotenv()

const port = process.env.PORT || 5000

const app = express();
app.use(express.json())

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin : "*",
        methods: ['GET','POST','PUT','PATCH','DELETE']
    }
})

io.on("connection", (socket: Socket) => {
    console.log("User connected: ", socket.id);

    socket.on("disconnect", () => {
        console.log("user disconnected")
    })

})

httpServer.listen(port, () => console.log(`Server started on port ${port}`))
