const express = require('express');
const app = express();
const socketio = require('socket.io')

app.use(express.static(__dirname + '/public'));

const expressServer = app.listen(9000);
const io = socketio(expressServer);

console.log("Se inicia server")
io.on('connection',(socket)=>{
    console.log("Pase por aca A");
    socket.emit('messageFromServer',{data:"Welcome to the socketio server"});
    console.log("Pase por aca B")
    socket.on('messageToServer',(dataFromClient)=>{
        console.log(dataFromClient)
    })
    socket.on('newMessageToServer',(msg)=>{
        console.log(msg)
        io.emit('messageToClients',{text:msg.text})
    })
})

