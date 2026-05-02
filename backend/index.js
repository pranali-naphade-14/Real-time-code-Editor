import express from "express"
const app=express()
import path from "path"

import http from "http"
import {Server} from "socket.io"

const server=http.createServer(app)
const io=new Server(server, {
    cors:{
        origin:"*"
    }
})

const rooms = new Map()

io.on('connection',(socket)=>{
    console.log("user connected : ",socket.id)

    let currentRoom=null
    let currentUser=null
    socket.on("join",({roomId,username})=>{
        if(currentRoom){
            socket.leave(currentRoom)
            rooms.get(currentRoom).delete(currentUser)
            io.to(currentRoom).emit("userJoined",Array.from(rooms.get(currentRoom)))
        }
        currentRoom=roomId
        currentUser=username

        socket.join(roomId)

        if(!rooms.has(roomId)){
            rooms.set(roomId,new Set())
        }
        rooms.get(roomId).add(username)

        io.to(roomId).emit("userJoined",Array.from(rooms.get(currentRoom)))
    })

    socket.on("codeChange",({roomId,code})=>{
        socket.to(roomId).emit("codeUpdate",code)
    }) 

    socket.on("leaveRoom",()=>{
        if(currentRoom && currentUser){
            rooms.get(currentRoom).delete(currentUser)
            io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)))
        }
        currentRoom=null
        currentUser=null
    })

    socket.on("typing",({roomId,username})=>{
        socket.to(roomId).emit("userTyping",username)
    })

    socket.on("languageChange",({roomId,language})=>{
        io.to(roomId).emit("languageUpdate",language)
    })

    socket.on("disconnect",()=>{
        if(currentRoom && currentUser){
            rooms.get(currentRoom).delete(currentUser)
            io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)))
        }
        console.log("User Disconnected")
    })
})
const port=process.env.PORT || 5000

const __dirname = path.resolve()
app.use(express.static(path.join(__dirname,"/frontend/dist")))

app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname, "frontend","dist","index.html"))
})

server.listen(port ,()=>{
    console.log("Listening on port no 5000")
})