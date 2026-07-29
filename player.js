/*
==========================================================
HW Werewolf Online
player.js
Part 1
==========================================================
*/

"use strict";

/* ======================================================
   Join Room
====================================================== */

function joinRoom() {

    const name = dom.playerName.value.trim();
    const hostId = dom.joinPeerId.value.trim();

    if (!name) {

        toast("名前を入力してください");
        return;

    }

    if (!hostId) {

        toast("Peer IDを入力してください");
        return;

    }

    state.isHost = false;
    state.myName = name;
    state.hostId = hostId;

    createPeer();

    const waitPeer = setInterval(() => {

        if (!state.myId) return;

        clearInterval(waitPeer);

        connectToHost();

    }, 100);

}

/* ======================================================
   Connect Host
====================================================== */

function connectToHost() {

    const connection = connectPeer(state.hostId);

    connection.on("open", () => {

        state.connected = true;

        setConnectionStatus("接続済み");

        sendPacket(connection, "join", {

            id: state.myId,

            name: state.myName

        });

        startPing();

        toast("ルームへ参加しました");

    });

}

/* ======================================================
   Sync
====================================================== */

function onSync(connection, payload) {

    state.players = payload.players || [];

    if (payload.settings) {

        state.settings = {

            ...state.settings,

            ...payload.settings

        };

    }

    updateLobbyPlayerList();

}

/* ======================================================
   Leave
====================================================== */

function leaveRoom() {

    const connection = getConnection(state.hostId);

    if (connection) {

        sendPacket(connection, "leave", {

            id: state.myId

        });

    }

    disconnectPeer();

    state.players = [];

    state.connected = false;

    state.started = false;

    updateLobbyPlayerList();

    showScreen(dom.lobbyScreen);

    toast("ルームを退出しました");

}

/* ======================================================
   Host Leave
====================================================== */

function onPlayerLeave(connection, payload) {

    if (connection.peer !== state.hostId) return;

    toast("ホストが退出しました");

    leaveRoom();

}

/* ======================================================
   Find Myself
====================================================== */

function myPlayer() {

    return state.players.find(player => {

        return player.id === state.myId;

    });

}
/*
==========================================================
HW Werewolf Online
player.js
Part 2
==========================================================
*/

"use strict";

/* ======================================================
   Game Packet
====================================================== */

function onGamePacket(connection, payload) {

    if (!payload || !payload.action) return;

    switch (payload.action) {

        case "start":

            state.started = true;
            state.players = payload.players || [];
            state.day = payload.day || 1;
            state.phase = payload.phase || "day";

            updateLobbyPlayerList();

            if (typeof updateGameUI === "function") {

                updateGameUI();

            }

            showScreen(dom.gameScreen);

            toast("ゲーム開始！");

            break;

        case "role":

            state.role = payload.role;

            if (typeof updateRoleCard === "function") {

                updateRoleCard();

            }

            break;

        case "phase":

            state.phase = payload.phase;

            if (typeof updatePhaseUI === "function") {

                updatePhaseUI();

            }

            break;

        case "timer":

            state.timer = payload.value;

            if (typeof updateTimerUI === "function") {

                updateTimerUI();

            }

            break;

        case "result":

            if (typeof showResult === "function") {

                showResult(payload);

            }

            break;

        case "end":

            if (typeof showGameEnd === "function") {

                showGameEnd(payload);

            }

            break;

        case "reset":

            state.started = false;
            state.phase = "lobby";
            state.day = 1;
            state.role = null;

            showScreen(dom.lobbyScreen);

            toast("ロビーへ戻りました");

            break;

    }

}

/* ======================================================
   Vote
====================================================== */

function sendVote(targetId) {

    const connection = getConnection(state.hostId);

    if (!connection) return;

    sendPacket(connection, "game", {

        action: "vote",

        target: targetId

    });

}

/* ======================================================
   Night Action
====================================================== */

function sendNightAction(targetId) {

    const connection = getConnection(state.hostId);

    if (!connection) return;

    sendPacket(connection, "game", {

        action: "nightAction",

        target: targetId

    });

}

/* ======================================================
   Chat
====================================================== */

function sendChat(text) {

    text = text.trim();

    if (!text) return;

    const connection = getConnection(state.hostId);

    if (!connection) return;

    sendPacket(connection, "chat", {

        name: state.myName,

        message: text

    });

}

/* ======================================================
   Receive Chat
====================================================== */

function onChatMessage(connection, payload) {

    if (typeof addChatMessage === "function") {

        addChatMessage(

            payload.name,

            payload.message,

            payload.name === state.myName

        );

    }

}

/* ======================================================
   Helpers
====================================================== */

function isAlive() {

    const me = myPlayer();

    return me ? me.alive : false;

}

function isMyTurn() {

    return isAlive() && state.started;

}
