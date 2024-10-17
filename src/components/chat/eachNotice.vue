<template>
  <div class="eachNoticeRoot">
    <div class="icon">
      <CircleCheck v-if="msg.subType === 'Positive'" class="positive"></CircleCheck>
      <CircleClose v-else-if="msg.subType === 'Negative'" class="negative"></CircleClose>
      <Warning v-else class="neutral"></Warning>
    </div>
    <div class="content">
      <p class="line1">{{ msg.payload }}</p>
      <p class="line2">{{ formatTime(msg.time) }}</p>
    </div>
    <div class="opers" title="删除" @click="remove">
      <Remove></Remove>
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
  height: 64px;
  padding: 8px;
  border-radius: 8px;
}

.eachNoticeRoot:hover {
  background-color: var(--eachNotice-hover);
}

.icon {
  width: 48px;
  height: 48px;
}

.icon svg {
  width: 100%;
  height: 100%;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  margin-left: 24px;
}
.content .line1 {
  font-size: 1rem;
}

.content .line2 {
  font-size: 0.75rem;
  opacity: 0.8;
}

.opers {
  width: 24px;
  height: 24px;
}

.opers svg {
  width: 100%;
  height: 100%;
  cursor: pointer;
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