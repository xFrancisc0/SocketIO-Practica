const express = require('express');
const app = express();
const socketio = require('socket.io')

let namespaces = require('./data/namespaces');

app.use(express.static(__dirname + '/public'));

const expressServer = app.listen(9000);
const io = socketio(expressServer);
// io.on = io.of('/').on

async function ObtenerClientes(namespace, room){
    var clients = await new Promise(resolve => {
        io.of(namespace).in(room).clients((error,clients)=>{
            resolve(clients);
        }); 
    });
    return clients;
}

function ObtenerHistoriasDeUnRoomDeUnNamespace(namespace, roomTitle){
    const nsRoom = namespace.rooms.find((room)=>{
        return room.roomTitle === roomTitle;
    })
    return nsRoom;
}

io.on('connection',(socket)=>{
    console.log("Someone connected to the main namespace, sending other namespaces.");

    //Las consultas con el client a diferencia de AJAX se realiza con el endpoint.
    var listaNamespaces = namespaces.map((row)=>{ return {id: row.id, img: row.img, nsTitle: row.nsTitle, endpoint: row.endpoint } });
    socket.emit("nsList", listaNamespaces);
})

//Con esto me olvido de los namespaces y me concentro solamente en los rooms por namespace.
namespaces.forEach((ns) => {
    io.of(ns.endpoint).on('connection', (nsSocket)=>{
        //Vista inicial será wiki
        nsSocket.emit("nsRoomLoad", ns.rooms);

        //Enviaremos el numero de clientes conectados dentro del primer room para el primer namespace
        nsSocket.on("joinRoom", async (roomTitle, callback)=>{
            nsSocket.join(roomTitle) //Se recibe peticion del client para conectarse al room inicial
            //Al unirme a otro namespace inmediatamente el usuario se retira del room

            //Cargo los rooms 
            var nsRoom = ObtenerHistoriasDeUnRoomDeUnNamespace(ns, roomTitle);

            io.of(ns.endpoint).to(roomTitle).emit("GetHistoryOfRoom", nsRoom.history);

            var clients = await ObtenerClientes(ns.endpoint, roomTitle);
            callback(clients);
        });

        nsSocket.on("leavePreviousRooms", async (obj, callback)=>{
            var rooms = Object.keys(nsSocket.rooms);

            for(var i=1; i<rooms.length;i++){
                if(rooms[i] != obj.roomActual){
                    nsSocket.leave(rooms[i]);
                }
            }

            callback(true);
        });

        nsSocket.on("leaveAllRooms", async (obj, callback)=>{
            var rooms = Object.keys(nsSocket.rooms);

            for(var i=1; i<rooms.length;i++){
                nsSocket.leave(rooms[i]);
            }

            callback(true);
        });

        nsSocket.on("PushMessageEnNSActualServer", (value) =>{
            const fullMsg = {
                text: value,
                time: Date.now(),
                username: "user",
                avatar: "https://via.placeholder.com/10"
            }
            let RoomsDestinatarios = Object.keys(nsSocket.rooms).pop();

            
            var nsRoom = ObtenerHistoriasDeUnRoomDeUnNamespace(ns, RoomsDestinatarios);
            console.log("nsRoomPre: "+JSON.stringify(nsRoom));
            nsRoom.addMessage(fullMsg)
            console.log("nsRoomPost: "+JSON.stringify(nsRoom));

            io.of(ns.endpoint).to(RoomsDestinatarios).emit("PushMessageEnNSActualClient", fullMsg);
        })
    });
});
