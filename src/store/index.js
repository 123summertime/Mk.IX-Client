import { createStore } from 'vuex'

export default createStore({
  state: {
    avatar: "",
    username: "",
  },
  mutations: {
    loginSuccess(state, avatar, username) {
        state.avatar = avatar
        state.username = username
    }
  },
  actions: {
  },
  modules: {
  }
})