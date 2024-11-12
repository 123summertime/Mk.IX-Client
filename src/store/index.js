import axios from 'axios'
import Dexie from 'dexie'

import { dbCRUD } from '../assets/js/dbCRUD.js'
import { queryInfo } from '../assets/js/queryDB.js'

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
    async websocketConnection(context, info) {
      context.commit('loginAs', info)

      const adress = localStorage.getItem('adress')
      const token = localStorage.getItem('token')
      const device = localStorage.getItem('device')

      // 首先获取wsToken，用于ws连接验证
      const wsTokenURL = `http://${adress}/v1/user/wsToken?device=${device ? device : ""}`
      const res = await axios.get(wsTokenURL, { headers: { 'Authorization': `Bearer ${token}` } })
      localStorage.setItem('device', res.data.device)

      // 建立websocket连接，带上wsToken
      const wsURL = `ws://${adress}/websocket/connect`
      const ws = new WebSocket(wsURL, [res.data.token])

      ws.onopen = async function () {
        // 获取好友申请
        const friendURL = `http://${adress}/v1/user/${info.account}/verify/request`
        axios.get(friendURL, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => {
          // 结果会通过ws发送 sysMsgGetter.vue将对其作处理
        }).catch(err => {
          console.log("获取好友申请时失败", err)
        })

        // 获取群申请
        for (const groupInfo of info.groups) {
          const requestURL = `http://${adress}/v1/group/${groupInfo.group}/verify/request`
          axios.get(requestURL, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }).then(res => {
            // 结果会通过ws发送 sysMsgGetter.vue将对其作处理
          }).catch(err => {
            console.log("获取入群申请时失败", err)
          })
        }
      }

      // 接收消息
      ws.onmessage = async function (event) {
        const data = JSON.parse(event.data)
        if (data.isSystemMessage) {
          context.commit('newSystemMessage', data)
        } else {
          const fullData = await queryInfo("Account", data.senderKey, data.senderID)
          context.commit('newGroupMessage', {
            groupID: data.group,
            payload: {
              time: data.time,
              type: data.type,
              group: data.group,
              uuid: fullData.uuid,
              username: fullData.username,
              avatar: fullData.avatar,
              payload: data.payload
            }
          })
        }
      }

      context.commit('websocketConnection', { ws })
    },

    lastMessage(context, info) {
      context.commit('lastMessage', info)
    },

    updateGroupInfo(context, info) {
      context.commit('updateGroupInfo', info)
    },

    getNewAt(context, info) {
      context.commit('getNewAt', info)
    },

    getGroupAttention(context, info) {
      context.commit('getGroupAttention', info)
    },

    buildGroupDB(context, info) {
      context.commit('buildGroupDB', info)
    },
  },

  mutations: {
    loginAs(state, info) {
      state.account = info.account
      state.username = info.username
    },

    websocketConnection(state, ws) {
      state.ws = ws.ws
    },

    newGroupMessage(state, payload) {
      state[payload.groupID] = payload.payload
    },

    newSystemMessage(state, payload) {
      state.systemMessage = payload
    },

    lastMessage(state, info) {
      state["lastMessageOf" + info.group] = info.payload
    },

    updateGroupInfo(state, info) {
      state.groupList.push(info)
    },

    getNewAt(state, info) {
      state.currentAt = info
    },

    getGroupAttention(state, info) {
      state.groupAttentions.set(info.group, info.type)
    },

    buildGroupDB(state, info) {
      state.groupDB[info.group] = info.db
    },
  },

  state: {
    account: "",  
    username: "",
    systemMessage: "",
    groupList: [],
    groupAttentions: new Map(),  // group: String -> type: String, 
    favoriteDB: await favoriteDB(),
    groupDB: {},    // group: dbCRUD实例对象
    currentAt: {},  // {uuid: String, username: String}
    // {group}: group新收到的消息
    // lastMessageOf{group}: group的最后一条消息
    // ws: websocket连接
  },
})
