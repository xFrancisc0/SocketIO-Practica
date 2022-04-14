var express = require('express');
const { json } = require('express/lib/response');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(3000);
console.log('Server is running ');

app.use(express.static('public'))

var allClients = [];
var allClientsLogged = [];
io.on("connect", function(socket){  //En el server, el socket es el cliente e io es el server. ( socket - io)
   
    //=====
    //ADMIN DE SESIONES
    allClients.push(socket);

    socket.on('disconnect', function() {
       console.log('Got disconnect!');
 
       var i = allClients.indexOf(socket);
       allClients.splice(i, 1);
       
       allClientsLogged.filter(u => u.Socket != socket)
    });
    //=====
   
    //orden: on -> emit
    //io.on("name", callback)
    //socket.emit("name", {data})
    //Se recibe un callback y se emite data 

    console.log("Conexion para "+socket.id+" realizada.");

    //Ejercicio 1
    socket.on("EnvioEJ1", function(data){
        console.log("Se recibe "+JSON.stringify(data));
        io.emit("RespuestaEJ1", {"Estatus": "OK", "Mensaje": "Se reenvia peticion", "Data": "La data es "+JSON.stringify(data)})
    });
    
    //Ejercicio 2
    socket.on("EnvioEJ2", function(data){
        console.log("Se recibe "+JSON.stringify(data));

        //Se fuerza el login
        allClientsLogged.push({"Socket":socket, "DataUsuario":{"Nombre":data.Nombre, "Contrasena": data.Contrasena} });
        io.emit("RespuestaEJ2", {"Estatus": "OK", "Mensaje": "Se reenvia peticion", "Data": "La data es "+JSON.stringify(data)})
    });

    //Ejercicio 3
    socket.on("EnvioEJ3", function(data){
        //Validar si esta logeado el usuario
        usuario = allClientsLogged.filter(u => u.Socket == socket)

        if(usuario.length > 0){
            console.log("pase por aqui D")
            io.emit("RespuestaEJ3", {"ok": true, "Estatus": "OK", "Mensaje": "Se reenvia peticion", "Data": {"Nombre":usuario[0].DataUsuario.Nombre, "Mensaje": data.Mensaje} })
        }else{
            console.log("pase por aqui E")
            io.emit("RespuestaEJ3", {"ok": false, "Estatus": "Error", "Mensaje": "No se encuentra logeado", "Data": null })
        }
    });

    

});

