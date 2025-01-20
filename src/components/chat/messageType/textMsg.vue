<template>
  <div class="textMsg">
    <p>
      <i :class="['atItem', message.payload.content ? '' : 'emptyContent']" 
        v-for="(x, index) in atList"
        :key="index"
        @click="currentClickID = x.uuid; namecardTrigger = !namecardTrigger">
        {{ "@" + x.name }}
      </i>
      <i :class="['content', getClass ]">
        {{ getContent }}
      </i>
    </p>

    <namecard
      :uuid="currentClickID"
      :namecardTrigger="namecardTrigger">
    </namecard>

  </div>
</template>

<script>
import namecard from './../namecard.vue'

import { queryInfo } from '../../../assets/js/queryDB'

export default {
  props: {
    group: String,
    message: Object
  },

  data() {
    return {
      atList: [], // 这条消息中@人的列表 元素: 用户名
      namecardTrigger: false,
      currentClickID: "",
    }
  },

  methods: {
    // 把@列表的uuid转化为 uuid+用户名
    async getAtNames() {
      this.atList = this.message.payload.meta ? this.message.payload.meta.at : []
      this.atList = await Promise.all(this.atList.map(async uuid => {
        const info = await queryInfo("Account", null, uuid)
        return { uuid: uuid, name: info.username }
      }))
    }
  },

  computed: {
    getClass() {
      if (!this.message.payload.meta) { return '' }
      return this.message.payload.meta.encrypt ? 'encrypt': ''
    },

    getContent() {
      return (this.message.payload.content || this.atList.length) ? this.message.payload.content : ' '
    }
  },

  components: {
    namecard
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

.atItem:hover {
  cursor: pointer;
  text-decoration: underline;
}

.emptyContent {
 margin-right: 0;
}

.content {
  color: var(--message-content-textcolor);
}

.textMsg p i{
  font-size: 1.2rem;
  line-height: 24px;
  word-break: break-all;
}

.encrypt { 
  color: var(--message-contentEncrypt-textcolor);
  font-style: italic;
  text-decoration: line-through;
}
</style>