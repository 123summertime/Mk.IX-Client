import { createStore } from 'vuex'

export default createStore({
  actions: {
    async wsConnect(context, info) {
      let ws = new WebSocket("ws://localhost:8000/ws?userID=" + info["uuid"] + "&groupID=" + info["groupID"])
      context.commit('newConnection', {
        "groupID": info["groupID"], 
        "ws": ws,
      })
      ws.onmessage = function (event) {
        console.log(event)
      }
    }
  },

  mutations: {
    newConnection(state, connect) {
      state.wsConnections[connect["groupID"]] = connect["ws"]
    }
  },

  state: {
    wsConnections: {}
  },
})