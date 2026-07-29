/*
==========================================================
HW Werewolf Online
peer.js
Part 1
==========================================================
*/

"use strict";

/* ======================================================
   Peer Connections
====================================================== */

const connections = new Map();

/* ======================================================
   Create Peer
====================================================== */

function createPeer(){

    if(state.peer){

        state.peer.destroy();

    }

    state.peer = new Peer({

        debug:2

    });

    state.peer.on("open",id=>{

        state.myId=id;

        dom.myPeerId.value=id;

        setConnectionStatus("接続済み");

        console.log("Peer Open:",id);

    });

    state.peer.on("connection",connection=>{

        console.log("Incoming:",connection.peer);

        registerConnection(connection);

    });

    state.peer.on("disconnected",()=>{

        console.warn("Peer disconnected");

        setConnectionStatus("切断");

    });

    state.peer.on("close",()=>{

        console.warn("Peer closed");

        setConnectionStatus("未接続");

    });

    state.peer.on("error",error=>{

        console.error(error);

        toast(error.type);

    });

}

/* ======================================================
   Register Connection
====================================================== */

function registerConnection(connection){

    connections.set(

        connection.peer,

        connection

    );

    connection.on("open",()=>{

        console.log("Connected:",connection.peer);

    });

    connection.on("data",data=>{

        receivePacket(

            connection,

            data

        );

    });

    connection.on("close",()=>{

        console.log("Closed:",connection.peer);

        connections.delete(

            connection.peer

        );

        if(typeof playerDisconnected==="function"){

            playerDisconnected(

                connection.peer

            );

        }

    });

    connection.on("error",error=>{

        console.error(error);

    });

}

/* ======================================================
   Connect
====================================================== */

function connectPeer(peerId){

    if(!state.peer){

        createPeer();

    }

    const connection=

        state.peer.connect(

            peerId,

            {

                reliable:true

            }

        );

    registerConnection(connection);

    return connection;

}
/*
==========================================================
HW Werewolf Online
peer.js
Part 2
==========================================================
*/

/* ======================================================
   Send Packet
====================================================== */

function sendPacket(connection, type, payload = {}) {

    if (!connection) return;

    if (!connection.open) return;

    connection.send({

        type,

        payload,

        sender: state.myId,

        timestamp: Date.now()

    });

}

/* ======================================================
   Broadcast
====================================================== */

function broadcast(type, payload = {}) {

    connections.forEach(connection => {

        sendPacket(connection, type, payload);

    });

}

/* ======================================================
   Receive Packet
====================================================== */

function receivePacket(connection, packet) {

    if (!packet || !packet.type) return;

    console.log(
        "[RECV]",
        packet.type,
        packet.payload
    );

    switch (packet.type) {

        case "join":

            if (typeof onPlayerJoin === "function") {

                onPlayerJoin(
                    connection,
                    packet.payload
                );

            }

            break;

        case "leave":

            if (typeof onPlayerLeave === "function") {

                onPlayerLeave(
                    connection,
                    packet.payload
                );

            }

            break;

        case "chat":

            if (typeof onChatMessage === "function") {

                onChatMessage(
                    connection,
                    packet.payload
                );

            }

            break;

        case "sync":

            if (typeof onSync === "function") {

                onSync(
                    connection,
                    packet.payload
                );

            }

            break;

        case "game":

            if (typeof onGamePacket === "function") {

                onGamePacket(
                    connection,
                    packet.payload
                );

            }

            break;

        case "ping":

            sendPacket(

                connection,

                "pong",

                {}

            );

            break;

        case "pong":

            console.log(

                "Ping:",

                connection.peer,

                "OK"

            );

            break;

        default:

            console.warn(

                "Unknown Packet:",

                packet.type

            );

    }

}

/* ======================================================
   Ping
====================================================== */

let pingInterval = null;

function startPing() {

    stopPing();

    pingInterval = setInterval(() => {

        broadcast("ping");

    }, 5000);

}

function stopPing() {

    if (pingInterval) {

        clearInterval(pingInterval);

        pingInterval = null;

    }

}

/* ======================================================
   Disconnect
====================================================== */

function disconnectPeer() {

    stopPing();

    connections.forEach(connection => {

        try {

            connection.close();

        } catch (e) {

            console.error(e);

        }

    });

    connections.clear();

    if (state.peer) {

        try {

            state.peer.destroy();

        } catch (e) {

            console.error(e);

        }

        state.peer = null;

    }

    state.connected = false;

    state.myId = "";

    dom.myPeerId.value = "";

    setConnectionStatus("未接続");

}

/* ======================================================
   Utility
====================================================== */

function getConnection(peerId) {

    return connections.get(peerId);

}

function hasConnection(peerId) {

    return connections.has(peerId);

}
