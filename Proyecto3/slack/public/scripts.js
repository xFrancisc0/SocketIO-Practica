const username = prompt("What is your username?")
const socket = io('http://localhost:9000',{ query: { username } });

let nsSocket = ""; //Este va a ir cambiando dependiendo del namespace elegido (Cambio de canales)
let nsData = [];
let nsRooms = [];

socket.on('nsList', async (nsData)=>{
    nsData = nsData;

    cargarNSIniciales(nsData);

    nsRooms = await joinNs(nsData[0].endpoint.split("/").join("")); //Cargamos los NS iniciales
    
    nsHistory = await joinRoom(nsRooms[0].roomTitle) //Cargamos por defecto las historias del primer room
})

//Al ingresar a un nuevo namespace me desconecto del namespace actual.
//Es por eso que puedo ejecutar todas las funciones para el namespace actual. (Es decir nsSocket es para el socket actual del usuario)
//Con esto ya me puedo olvidar de considerar los namespaces al realizar las operaciones con nsSocket 
async function joinNs(endpoint){

        //Cierro conexion en endpoint si ya existia
        if(nsSocket){
            nsSocket.close();
            EliminarHistorial(); //Limpiar las historias

            //Setear evento de envio de historias
            document.getElementById("user-message").removeEventListener("keyup", FunctionEventoPush );
        }

        //Vista inicial será wiki
        nsSocket = io("http://localhost:9000/"+endpoint);

        //Se setea listener para el endpoint determinado (Es mejor setear los listeners en joinNs para asi tomarlos en base a los NS mismos)
        nsSocket.on("GetHistoryOfRoom", (historiesOfRoom) => {
            CargarHistoriasFrontend(historiesOfRoom);
        })
       
        nsSocket.on("PushMessageEnNSActualClient", (msg) => {
            AgregarHistoriasFrontend(msg);
        })
    
        //Unirse a NS y retornar rooms
        var nsRooms = await new Promise(resolve => {
            nsSocket.on("nsRoomLoad", (nsRooms)=>{
                AgregarRoomsFrontend(".room-list",nsRooms);
                AgregarRoomsBackend("room");
                
                resolve(nsRooms);
            });
        });

        //Setear evento de envio de historias
        document.getElementById("user-message").addEventListener("keyup", FunctionEventoPush );
        return nsRooms;
}

async function joinRoom(roomTitle){
    nsSocket.emit("joinRoom", roomTitle, (clients)=>{
        document.getElementById("NroClients").innerText = clients.length;
    });
}

function cargarNSIniciales(nsData){
    AgregarListasEnClienteNamespacesFrontend('.namespaces', nsData);
    AgregarListasEnClienteNamespacesBackend('namespace', nsData);
}

function CargarHistoriasHTML(data){
    const DateConvertido = new Date(data.time).toLocaleString();

    document.querySelector('#messages').innerHTML += `
    <li>
        <div class="user-image">
            <img src="${data.avatar}" width=30 height=30/>
        </div>
        <div class="user-message">
            <div class="user-name-time">${data.username} <span>${DateConvertido}</span></div>
            <div class="message-text">${data.text}</div>
        </div>
    </li>
    `
}

function CargarHistoriasFrontend(historiesOfRoom){

    historiesOfRoom.forEach((history)=>{
        CargarHistoriasHTML(history);
    })
}

function AgregarHistoriasFrontend(msg){

    CargarHistoriasHTML(msg);
}

function AgregarRoomsFrontend(SelectorPadre, nsRooms) {
    let roomList = document.querySelector(SelectorPadre);
    roomList.innerHTML = "";

    nsRooms.forEach((room)=>{
        var glyph = room.privateRoom ? "lock" : "globe";
        roomList.innerHTML += `<li class="room" historyOfRoom="${room.history}"><span class="glyphicon glyphicon-${glyph}"></span>${room.roomTitle}</li>`
    }) 
}

function AgregarRoomsBackend(SelectorHijo) {
    //Array.from transforma una seleccion de HTML a array
    Array.from(document.getElementsByClassName(SelectorHijo)).forEach(async (elem)=>{
        elem.addEventListener('click',async (e)=>{

            //Si se da click en un room, se debe dejar de estar en otros rooms
            var flag = await new Promise(resolve => {
                var obj = {socketId: nsSocket.id, roomActual: elem.innerText};
                nsSocket.emit("leavePreviousRooms", obj, (flag)=>{
                    resolve(nsRooms);
                });
            });

            EliminarHistorial(); //Limpiar historial
            var NombreRoom = elem.innerText;
            nsHistory = await joinRoom(NombreRoom);
        })
    })
}

function EliminarHistorial(){
    document.getElementById("messages").innerHTML = "";
}

function AgregarListasEnClienteNamespacesFrontend(SelectorPadre, nsData) {
    let namespacesDiv = document.querySelector(SelectorPadre);
    namespacesDiv.innerHTML = "";
    nsData.forEach((ns)=>{
        namespacesDiv.innerHTML += `<div class="namespace" ns=${ns.endpoint} ><img src="${ns.img}" /></div>`
    }) 
}

function AgregarListasEnClienteNamespacesBackend(SelectorHijo) {
    //Array.from transforma una seleccion de HTML a array
    Array.from(document.getElementsByClassName(SelectorHijo)).forEach((elem)=>{
        elem.addEventListener('click',(e)=>{
            const nsEndpoint = elem.getAttribute('ns');
            EndpointModificado = nsEndpoint.split("/").join("");
            joinNs(EndpointModificado);
            EliminarHistorial();
        })
    })
}

function FunctionEventoPush() {
    if (event.keyCode === 13) {
        var value = document.getElementById("user-message").value;
        if(value != ""){
            console.log("Evento enter ejecutado");
            nsSocket.emit("PushMessageEnNSActualServer", (value));
        }
        
    }
}