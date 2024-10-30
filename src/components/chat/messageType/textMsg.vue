<template>
  <div class="textMsg">
    <p>
      <i class="atItem" v-for="username in atList">
        {{ "@" + username }}
      </i>
      <i :class="['content', getClass ]">
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
        return info.username
      }))
    }
  },

  computed: {
    getClass() {
      if (!this.message.payload.meta) { return '' }
      return this.message.payload.meta.encrypt ? 'encrypt': ''
    }
  },

  async mounted() {
    await this.getAtNames()
  }

}
</script>

<style scoped>
.textMsg {
  background: var(--message-common-bgcolor);
}

.atItem {
  color: var(--message-at-textcolor);
  margin-right: 8px;
}

.content {
  color: var(--message-content-textcolor);
}

.textMsg p i{
  font-size: 1.2rem;
  line-height: 24px;
}

.encrypt { 
  color: var(--message-contentEncrypt-textcolor);
  font-style: italic;
  text-decoration: line-through;
}
</style>