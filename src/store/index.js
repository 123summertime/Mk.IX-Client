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
      const URL = `ws://${adress}/ws/ws?userID=${info["uuid"]}&groupID=${info["groupID"]}`
      const ws = new WebSocket(URL, [token])

      context.commit('newConnection', {
        "groupID": info["groupID"],
        "ws": ws,
      })

      ws.onmessage = async function (event) {
        const data = JSON.parse(event.data)
        const fullData = await queryInfo("Account", data["senderKey"], data["senderID"])
        context.commit('getNewMessage', {
          "groupID": data.group,
          "payload": {
            time: data.time,
            type: data.type,
            group: data.group,
            uuid: fullData.uuid,
            userName: fullData.userName,
            avatar: fullData.avatar,
            payload: data.payload
          }
        })
      }
    },

    async sysConnection(context, info) {
      const adress = localStorage.getItem('adress')
      const token = localStorage.getItem('token')
      const URL = `ws://${adress}/ws/wsSys?userID=${info["uuid"]}`
      const ws = new WebSocket(URL, [token])

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
      state[`lastMessageOf${info["group"]}`] = info["payload"]
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