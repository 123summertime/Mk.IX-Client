<template>
  <div class="textMsg">
    <p>
      <i class="atItem" v-for="userName in atList">
        {{ "@" + userName }}
      </i>
      <i class="content">
        {{ message.payload.content }}
      </i>
    </p>
  </div>
</template>

<script>
import { queryInfo } from '../../../assets/queryDB'

export default {
  props: {
    group: String,
    message: Object
  },

  data() {
    return {
      atList: [], // 这条消息中@人的列表 元素: 用户名
    }
  },

  methods: {
    // 把@列表的uuid转化为用户名
    async getAtNames() {
      this.atList = this.message.payload.meta ? this.message.payload.meta.at : []
      this.atList = await Promise.all(this.atList.map(async uuid => {
        const info = await queryInfo("Account", null, uuid)
        return info.userName
      }))
    }
  },

  async mounted() {
    await this.getAtNames()
  }

}
</script>

<style scoped>
.textMsg {
  background-color: var(--message-commonBg);
}

.atItem {
  color: var(--message-atItem);
  margin-right: 8px;
}

.textMsg p i{
  font-size: 1.2rem;
  line-height: 1.5rem;
}
</style>