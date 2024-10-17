<template>
  <div class="request">
    <img :src="msg.senderAvatar" />
    <div class="requestTexts">
      <p>{{ groupMailText(msg) }}</p>
      <p>{{ '理由：' + msg.payload }}</p>
    </div>
    <div class="requestOpers" v-if="msg.state === '等待审核'">
      <Close @click="requestResponse(msg.type, msg.target, msg.time, false)"></Close>
      <Check @click="requestResponse(msg.type, msg.target, msg.time, true)"></Check>
    </div>
    <div class="requestResponse" v-else>
      <p>{{ msg.state }}</p>
    </div>
  </div>
</template>
  
<script>
import axios from 'axios'

export default {
  props: {
    msg: Object,
  },

  methods: {
    groupMailText(msg) {
      const { type, username, groupName } = msg
      const mapping = {
        join: `${username} 申请加入 ${groupName}`,
        friend: `${username} 申请加你为好友`,
      }

      return mapping[type]
    },

    requestResponse(type, group, time, verdict) {
      const uuid = this.$store.state.account
      const URLmapping = {
        join: `http://${localStorage.getItem('adress')}/v1/group/${group}/verify/request/${time}`,
        friend: `http://${localStorage.getItem('adress')}/v1/user/${uuid}/verify/request/${time}`,
      }
      const url = URLmapping[type]
      const headers = { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      const method = verdict ? axios.post(url, {}, headers) : axios.delete(url, headers)
      method.then(res => {
        ElMessage.success(verdict ? "已通过" : "已拒绝")
      }).catch(err => {
        ElMessage({
          message: `操作失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },
  },
}
</script>
  
<style scoped>
.request {
  display: flex;
  padding: 8px;
  border-radius: 16px;
}

.request img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.request .requestTexts {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: space-around;
  margin: 0 24px;
}

.request .requestOpers {
  display: flex;
  justify-content: space-around;
  width: 20%;
  height: 100%;
  margin: auto 0;
}

.request .requestOpers svg {
  width: 36px;
  height: 36px;
  cursor: pointer;
}

.request .requestOpers svg:nth-child(1):hover {
  color: var(--warn);
}

.request .requestOpers svg:nth-child(2):hover {
  color: var(--check);
}

.requestResponse {
  line-height: 48px;
}
</style>