<template>
  <div class="eachNoticeRoot">
    <div class="icon">
      <CircleCheck v-if="msg.subType === 'Positive'" class="positive"></CircleCheck>
      <CircleClose v-else-if="msg.subType === 'Negative'" class="negative"></CircleClose>
      <Warning v-else class="neutral"></Warning>
    </div>
    <div class="content">
      <p :title="msg.payload">
        <i v-for="(part, index) in parts" :key="index">
          <template v-if="part.match && this.msg.meta.var.type === 'group'">
            <el-tooltip
              effect="customized"
              placement="top"
              trigger="click"
              :content="'ID: ' + msg.meta.var.id"
              :show-arrow="false"
              :offset="0">
              <i class="highlight">{{ part.text }}</i>
            </el-tooltip>
          </template>
          <template v-else-if="part.match && this.msg.meta.var.type === 'user'">
            <i class="highlight" @click="namecardTrigger = !namecardTrigger">{{ part.text }}</i>
          </template>
          <template v-else>
            {{ part.text }}
          </template>
        </i>
      </p>
    </div>
    <div>
      <p class="time">{{ formatTime(msg.time) }}</p>
    </div>
    <div class="opers" title="删除" @click="remove">
      <Delete></Delete>
    </div>

    <namecard
      :uuid="uuid"
      :namecardTrigger="namecardTrigger">
    </namecard>
  </div>
</template>

<script>
import namecard from './namecard.vue'

import { computeTime } from './../../assets/js/utils'

export default {
  emits: [
    "deleteNotice",
  ],

  props: {
    msg: Object,
  },

  data() {
    return {
      namecardTrigger: false,
    }
  },

  computed: {
    parts() {
      if (!this.msg.meta || !this.msg.meta.var) {
        return [{text: this.msg.payload, match: false}]
      }
      const name = this.msg.meta.var.name
      let part = this.msg.payload.split(name).map(i => ({
        text: i,
        match: false,
      }))
      part.splice(1, 0, {text: name, match: true})
      return part
    },

    uuid() {
      if (!this.msg.meta.var || !this.msg.meta.var.id) {
        return ""
      }
      return this.msg.meta.var.id
    }
  },

  methods: {
    formatTime(time) {
      return computeTime(time)
    },

    remove() {
      this.$emit('deleteNotice', this.msg.time)
    }
  },

  components: {
    namecard,
  },
}
</script>

<style scoped>
.eachNoticeRoot {
  display: flex;
  align-items: center;
  width: 100%;
  height: 4rem;
  padding: 0.5rem;
  border-radius: 8px;
}

.eachNoticeRoot:hover {
  background: var(--eachNotice-hover-bgcolor);
}

.icon {
  flex: 0 0 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.content {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  margin: 0 0.8rem;
  color: var(--eachNotice-item-textcolor);
}

.content p {
  overflow: hidden;
  text-overflow: ellipsis;
}

.highlight {
  cursor: pointer;
  color: var(--highlight);
}

.highlight:hover {
  text-decoration: underline;
}

.time {
  flex: 0 0 auto;
  font-size: 0.8rem;
  opacity: 0.8;
  white-space: nowrap;
  margin-right: 1rem;
  color: var(--eachNotice-itemRightSide-textcolor);
}

.opers {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.opers svg {
  width: 1.5rem;
  cursor: pointer;
  color: var(--eachNotice-itemRightSide-textcolor);
}

.opers svg:hover {
  color: var(--negative);
  transform: scale(1.2);
}

.positive {
  color: var(--positive);
}

.negative {
  color: var(--negative);
}

.neutral {
  color: var(--neutral);
}
</style>