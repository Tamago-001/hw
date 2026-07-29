/*
==========================================================
HW Werewolf Online
host.js
Part 1
==========================================================
*/

"use strict";

/* ======================================================
   Create Room
====================================================== */

async function createRoom() {

    const name = dom.playerName.value.trim();

    if (!name) {

        toast("名前を入力してください");

        return;

    }

    state.isHost = true;
    state.myName = name;
    state.hostId = "";

    createPeer();

    const waitPeer = setInterval(() => {

        if (!state.myId) return;

        clearInterval(waitPeer);

        state.hostId = state.myId;
        state.connected = true;

        state.players = [];

        state.players.push({

            id: state.myId,

            name: state.myName,

            host: true,

            alive: true,

            role: null

        });

        updateLobbyPlayerList();

        setConnectionStatus("ホスト");

        toast("ルームを作成しました");

        startPing();

    }, 100);

}

/* ======================================================
   Join Request
====================================================== */

function onPlayerJoin(connection, payload) {

    if (!state.isHost) return;

    const exists = state.players.find(player => {

        return player.id === connection.peer;

    });

    if (exists) {

        syncPlayers();

        return;

    }

    state.players.push({

        id: connection.peer,

        name: payload.name,

        host: false,

        alive: true,

        role: null

    });

    toast(`${payload.name} が参加しました`);

    updateLobbyPlayerList();

    syncPlayers();

}

/* ======================================================
   Player Disconnect
====================================================== */

function playerDisconnected(peerId) {

    if (!state.isHost) return;

    const index = state.players.findIndex(player => {

        return player.id === peerId;

    });

    if (index === -1) return;

    const player = state.players[index];

    state.players.splice(index, 1);

    toast(`${player.name} が退出しました`);

    updateLobbyPlayerList();

    syncPlayers();

}

/* ======================================================
   Sync
====================================================== */

function syncPlayers() {

    if (!state.isHost) return;

    broadcast("sync", {

        players: state.players,

        settings: state.settings

    });

}

/* ======================================================
   Start Game
====================================================== */

function startGame() {

    if (!state.isHost) return;

    if (state.players.length < 4) {

        toast("4人以上必要です");

        return;

    }

    if (typeof prepareGame === "function") {

        prepareGame();

    }

}
/*
==========================================================
HW Werewolf Online
host.js
Part 2
==========================================================
*/

/* ======================================================
   Prepare Game
====================================================== */

function prepareGame() {

    const roles = [];

    const addRoles = (role, count) => {

        for (let i = 0; i < count; i++) {

            roles.push(role);

        }

    };

    addRoles("wolf", state.settings.wolf);
    addRoles("seer", state.settings.seer);
    addRoles("madman", state.settings.madman);
    addRoles("knight", state.settings.knight);
    addRoles("vampire", state.settings.vampire);

    while (roles.length < state.players.length) {

        roles.push("villager");

    }

    shuffle(roles);

    state.players.forEach((player, index) => {

        player.role = roles[index];
        player.alive = true;

    });

    state.started = true;
    state.phase = "day";
    state.day = 1;

    sendRoles();

    broadcast("game", {

        action: "start",

        players: state.players,

        day: state.day,

        phase: state.phase

    });

    if (typeof startDayPhase === "function") {

        startDayPhase();

    }

    toast("ゲーム開始！");

}

/* ======================================================
   Send Roles
====================================================== */

function sendRoles() {

    state.players.forEach(player => {

        if (player.id === state.myId) {

            state.role = player.role;
            continue;

        }

        const connection = getConnection(player.id);

        if (!connection) return;

        sendPacket(connection, "game", {

            action: "role",

            role: player.role

        });

    });

}

/* ======================================================
   Host Timer
====================================================== */

let phaseTimerHandle = null;

function startHostTimer(seconds, finishCallback) {

    clearHostTimer();

    state.timer = seconds;

    broadcast("game", {

        action: "timer",

        value: state.timer

    });

    phaseTimerHandle = setInterval(() => {

        state.timer--;

        broadcast("game", {

            action: "timer",

            value: state.timer

        });

        if (state.timer <= 0) {

            clearHostTimer();

            if (typeof finishCallback === "function") {

                finishCallback();

            }

        }

    }, 1000);

}

function clearHostTimer() {

    if (phaseTimerHandle) {

        clearInterval(phaseTimerHandle);

        phaseTimerHandle = null;

    }

}

/* ======================================================
   Broadcast Phase
====================================================== */

function setPhase(phase) {

    state.phase = phase;

    broadcast("game", {

        action: "phase",

        phase

    });

}

/* ======================================================
   Reset Lobby
====================================================== */

function resetLobby() {

    clearHostTimer();

    state.started = false;

    state.phase = "lobby";

    state.day = 1;

    state.players.forEach(player => {

        player.role = null;
        player.alive = true;

    });

    syncPlayers();

    broadcast("game", {

        action: "reset"

    });

    updateLobbyPlayerList();

    showScreen(dom.lobbyScreen);

}
