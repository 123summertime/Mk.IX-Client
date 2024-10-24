<template>
  <div class="request" ref="Request">
    <div class="image">
      <img :src="msg.senderAvatar" />
    </div>
    <div class="content">
      <p :title="groupMailText">{{ groupMailText }}</p>
      <p class="reason" :title="groupMailReason">{{ groupMailReason }}</p>
    </div>
    <div class="time">
      <p>{{ formatTime(msg.time) }}</p>
    </div>
    <div v-if="msg.state === '等待审核'" class="requestResponse requestOpers">
      <CircleClose @click="requestResponse(msg.type, msg.target, msg.time, false)"></CircleClose>
      <CircleCheck @click="requestResponse(msg.type, msg.target, msg.time, true)"></CircleCheck>
    </div>
    <div v-else class="requestResponse">
      <p :class="[msg.state.includes('同意') ? 'accept' : 'reject']">{{ msg.state }}</p>
    </div>
  </div>
</template>
  
<script>
import axios from 'axios'

import { computeTime } from './../../assets/utils'

export default {
  props: {
    msg: Object,
  },

  methods: {
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

    getOrder() {
      // order用来控制flex布局下的元素顺序
      // 已审核的order为正数，未审核的order为负数，由晚到早排序。
      let order = Number(this.msg.time.substring(0, 10));
      if (this.msg.state === "等待审核") {
        this.$refs.Request.style.order = -1 * order
      } else {
        this.$refs.Request.style.order = 2147483647 - order
      }
    },

    formatTime(time) {
      return computeTime(time)
    },
  },

  computed: {
    groupMailText() {
      const { type, username, groupName } = this.msg
      const mapping = {
        join: `${username} 申请加入 ${groupName}`,
        friend: `${username} 申请加你为好友`,
      }

      return mapping[type]
    },

    groupMailReason() {
      return '理由：' + (this.msg.payload ? this.msg.payload : "(无)")
    },
  },

  mounted() {
    this.getOrder()
  }
}
</script>
  
<style scoped>
.request {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 8px;
  border-radius: 8px;
  order: 2147483647;
}

.request:hover {
  background-color: var(--eachRequest-hover);
}

.request .image {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 0 0 48px;
}

.image img {
  border-radius: 50%;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
  margin: 0 12px;
  white-space: nowrap;
  overflow: hidden;
}

.content p {
  overflow: hidden;
  text-overflow: ellipsis;
}

.reason {
  font-size: 0.8rem;
  opacity: 0.8;
}

.time {
  flex: 0 0 auto;
  margin-right: 24px;
}

.time p {
  font-size: 0.8rem;
  opacity: 0.8;
}

.requestResponse {
  display: flex;
  justify-content: space-around;
  flex: 0 0 80px;
  line-height: 48px;
  white-space: nowrap;
}

.requestOpers svg:nth-child(1):hover {
  color: var(--warn);
}

.requestOpers svg:nth-child(2):hover {
  color: var(--check);
}

.requestOpers svg {
  width: 24px;
  cursor: pointer;
}

.requestOpers svg:hover {
  transform: scale(1.2);
}

.accept {
  color: var(--positive);
}

.reject {
  color: var(--negative);
}
</style>