import Dexie from 'dexie'

import { dbCRUD } from '../assets/dbCRUD.js'
import { queryInfo } from '../assets/queryDB.js'

import { createStore } from 'vuex'

async function favoriteDB() {
  const db = new Dexie('Favorite')
  db.version(1).stores({
    Image: "&time",
  })
  return new dbCRUD(db)
}


export default createStore({
  actions: {
    async wsConnect(context, info) {
      const adress = localStorage.getItem('adress')
      const token = localStorage.getItem('token')
      const URL = `ws://${adress}/ws?userID=${info["uuid"]}&groupID=${info["groupID"]}&token=${token}`
      const ws = new WebSocket(URL)

      context.commit('newConnection', {
        "groupID": info["groupID"],
        "ws": ws,
      })

      ws.onmessage = async function (event) {
        const data = JSON.parse(event["data"])

        const fullData = await queryInfo("Account", data["senderKey"], data["senderID"])
        context.commit('getNewMessage', {
          "groupID": data["group"],
          "payload": { ...fullData, ...data }
        })
      }
    },

    async sysConnection(context, info) {
      const adress = localStorage.getItem('adress')
      const token = localStorage.getItem('token')
      const URL = `ws://${adress}/wsSys?userID=${info["uuid"]}&token=${token}`
      const ws = new WebSocket(URL)

      ws.onmessage = async function (event) {
        const data = JSON.parse(event["data"])
        context.commit('getNewSysMessage', data)
      }

      context.commit('sysConnection', { "ws": ws })
    },

    loginAs(context, info) {
      context.commit('loginAs', info)
    },

    lastMessage(context, info) {
      context.commit('lastMessage', info)
    },
  },

  mutations: {
    newConnection(state, connect) {
      state.wsConnections[connect["groupID"]] = connect["ws"]
      state[connect["groupID"]] = ""
    },

    sysConnection(state, ws) {
      state["sys"] = ws
    },

    getNewMessage(state, payload) {
      state[payload["groupID"]] = payload["payload"]
    },

    getNewSysMessage(state, payload) {
      state["sysMsg"] = payload
    },

    loginAs(state, info) {
      state["account"] = info["account"]
      state["userName"] = info["userName"]
    },

    lastMessage(state, info) {
      state[`lastMessageOf${info["group"]}`] = info["payload"] || "empty" // 当没有lastMessage时 为"empty"
    },
  },

  state: {
    account: "",
    userName: "",
    sysMsg: "",
    favoriteDB: await favoriteDB(),
    wsConnections: {},
    // {group}: group新收到的消息
    // lastMessageOf{group}: group的最后一条消息
    // sys: 系统消息Websocket
  },
})