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
