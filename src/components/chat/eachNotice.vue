<template>
  <div class="eachNoticeRoot">
    <div class="icon">
      <CircleCheck v-if="msg.subType === 'Positive'" class="positive"></CircleCheck>
      <CircleClose v-else-if="msg.subType === 'Negative'" class="negative"></CircleClose>
      <Warning v-else class="neutral"></Warning>
    </div>
    <div class="content">
      <p :title="msg.payload">{{ msg.payload }}</p>
    </div>
    <div>
      <p class="time">{{ formatTime(msg.time) }}</p>
    </div>
    <div class="opers" title="删除" @click="remove">
      <Delete></Delete>
    </div>
  </div>
</template>

<script>
import { computeTime } from './../../assets/utils'

export default {
  emits: [
    "deleteNotice",
  ],

  props: {
    msg: Object,
  },

  methods: {
    formatTime(time) {
      return computeTime(time)
    },

    remove() {
      this.$emit('deleteNotice', this.msg.time)
    }
  },
}
</script>

<style scoped>
.eachNoticeRoot {
  display: flex;
  align-items: center;
  width: 100%;
  height: 64px;
  padding: 8px;
  border-radius: 8px;
}

.eachNoticeRoot:hover {
  background-color: var(--eachNotice-hover);
}

.icon {
  flex: 0 0 48px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.content {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  margin: 0 12px;
}

.content p {
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  flex: 0 0 auto;
  font-size: 0.8rem;
  line-height: 1rem;
  opacity: 0.8;
  white-space: nowrap;
  margin-right: 24px;
}

.opers {
  flex: 0 0 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.opers svg {
  width: 24px;
  cursor: pointer;
}

.opers svg:hover {
  color: var(--warn);
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