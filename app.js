/*
==========================================================
HW Werewolf Online
app.js
Part 1
==========================================================
*/

"use strict";

/* ======================================================
   Version
====================================================== */

const APP_NAME = "HW Werewolf Online";
const APP_VERSION = "0.1.0";

/* ======================================================
   Global State
====================================================== */

const state = {

    peer: null,

    myId: "",

    myName: "",

    hostId: "",

    isHost: false,

    roomCode: "",

    connected: false,

    started: false,

    phase: "lobby",

    day: 1,

    timer: 0,

    players: [],

    role: null,

    alive: true,

    settings: {

        wolf: 1,

        seer: 1,

        madman: 0,

        knight: 0,

        vampire: 0,

        dayTime: 300,

        voteTime: 60

    }

};

/* ======================================================
   DOM
====================================================== */

const $ = id => document.getElementById(id);

const dom = {

    lobbyScreen: $("lobbyScreen"),
    gameScreen: $("gameScreen"),
    nightScreen: $("nightScreen"),
    voteScreen: $("voteScreen"),
    resultScreen: $("resultScreen"),
    endScreen: $("endScreen"),

    connectionStatus: $("connectionStatus"),
    phaseLabel: $("phaseLabel"),

    playerName: $("playerName"),

    createRoomBtn: $("createRoomBtn"),
    joinRoomBtn: $("joinRoomBtn"),

    myPeerId: $("myPeerId"),
    joinPeerId: $("joinPeerId"),

    playerList: $("playerList"),
    gamePlayerList: $("gamePlayerList"),

    wolfCount: $("wolfCount"),
    seerCount: $("seerCount"),
    madmanCount: $("madmanCount"),
    knightCount: $("knightCount"),
    vampireCount: $("vampireCount"),
    villagerCount: $("villagerCount"),

    dayTime: $("dayTime"),
    voteTime: $("voteTime"),

    startGameBtn: $("startGameBtn"),

    toast: $("toast")

};

/* ======================================================
   Screen List
====================================================== */

const screens = [

    dom.lobbyScreen,
    dom.gameScreen,
    dom.nightScreen,
    dom.voteScreen,
    dom.resultScreen,
    dom.endScreen

];

/* ======================================================
   Screen
====================================================== */

function showScreen(screen){

    screens.forEach(s=>{

        if(!s) return;

        s.classList.remove("active");

    });

    if(screen){

        screen.classList.add("active");

    }

}

/* ======================================================
   Toast
====================================================== */

let toastTimer = null;

function toast(message){

    dom.toast.textContent = message;

    dom.toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(()=>{

        dom.toast.classList.remove("show");

    },2500);

}

/* ======================================================
   Status
====================================================== */

function setConnectionStatus(text){

    dom.connectionStatus.textContent = text;

}

function setPhaseLabel(text){

    dom.phaseLabel.textContent = text;

}

/* ======================================================
   Utils
====================================================== */

function randomId(length=6){

    const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result="";

    for(let i=0;i<length;i++){

        result+=chars[
            Math.floor(Math.random()*chars.length)
        ];

    }

    return result;

}

function shuffle(array){

    for(let i=array.length-1;i>0;i--){

        const j=Math.floor(Math.random()*(i+1));

        [array[i],array[j]]=[array[j],array[i]];

    }

    return array;

}

function sleep(ms){

    return new Promise(resolve=>{

        setTimeout(resolve,ms);

    });

}
/*
==========================================================
app.js
Part 2
==========================================================
*/

/* ======================================================
   Initialize
====================================================== */

function init(){

    console.log(`${APP_NAME} v${APP_VERSION}`);

    registerEvents();

    loadSettings();

    updateVillagerCount();

    updateLobbyPlayerList();

    showScreen(dom.lobbyScreen);

    setConnectionStatus("未接続");

    setPhaseLabel("ロビー");

}

/* ======================================================
   Event Register
====================================================== */

function registerEvents(){

    dom.createRoomBtn?.addEventListener("click",()=>{

        if(typeof createRoom==="function"){

            createRoom();

        }

    });

    dom.joinRoomBtn?.addEventListener("click",()=>{

        if(typeof joinRoom==="function"){

            joinRoom();

        }

    });

    dom.startGameBtn?.addEventListener("click",()=>{

        if(typeof startGame==="function"){

            startGame();

        }

    });

    [
        dom.wolfCount,
        dom.seerCount,
        dom.madmanCount,
        dom.knightCount,
        dom.vampireCount

    ].forEach(input=>{

        input?.addEventListener("input",()=>{

            updateVillagerCount();

            saveSettings();

        });

    });

    dom.dayTime?.addEventListener("input",saveSettings);

    dom.voteTime?.addEventListener("input",saveSettings);

}

/* ======================================================
   Settings
====================================================== */

function saveSettings(){

    state.settings.wolf =
        Number(dom.wolfCount.value);

    state.settings.seer =
        Number(dom.seerCount.value);

    state.settings.madman =
        Number(dom.madmanCount.value);

    state.settings.knight =
        Number(dom.knightCount.value);

    state.settings.vampire =
        Number(dom.vampireCount.value);

    state.settings.dayTime =
        Number(dom.dayTime.value);

    state.settings.voteTime =
        Number(dom.voteTime.value);

    localStorage.setItem(

        "hw_settings",

        JSON.stringify(state.settings)

    );

}

function loadSettings(){

    const data=localStorage.getItem("hw_settings");

    if(!data) return;

    try{

        Object.assign(

            state.settings,

            JSON.parse(data)

        );

    }catch{

        return;

    }

    dom.wolfCount.value=state.settings.wolf;

    dom.seerCount.value=state.settings.seer;

    dom.madmanCount.value=state.settings.madman;

    dom.knightCount.value=state.settings.knight;

    dom.vampireCount.value=state.settings.vampire;

    dom.dayTime.value=state.settings.dayTime;

    dom.voteTime.value=state.settings.voteTime;

}

/* ======================================================
   Villager Count
====================================================== */

function updateVillagerCount(){

    const special=

        Number(dom.wolfCount.value)+
        Number(dom.seerCount.value)+
        Number(dom.madmanCount.value)+
        Number(dom.knightCount.value)+
        Number(dom.vampireCount.value);

    const total=state.players.length;

    const villagers=Math.max(

        total-special,

        0

    );

    dom.villagerCount.textContent=

        villagers;

}

/* ======================================================
   Lobby Player List
====================================================== */

function updateLobbyPlayerList(){

    dom.playerList.innerHTML="";

    state.players.forEach(player=>{

        const card=document.createElement("div");

        card.className="playerCard";

        card.innerHTML=`

            <div class="playerInfo">

                <div class="playerAvatar">
                    👤
                </div>

                <div>

                    <div class="playerName">

                        ${player.name}

                    </div>

                    <div class="playerStatus">

                        ${player.host ? "ホスト" : "参加者"}

                    </div>

                </div>

            </div>

        `;

        dom.playerList.appendChild(card);

    });

    updateVillagerCount();

    dom.startGameBtn.disabled=

        !(state.isHost && state.players.length>=4);

}

/* ======================================================
   Startup
====================================================== */

window.addEventListener(

    "DOMContentLoaded",

    init

);
