<template>
  <div class="broadcast">
    <div class="content">
      <i v-for="(part, index) in parts" :key="index">
        <template v-if="part.match">
          <i class="highlight" @click="showNamecard">{{ part.text }}</i>
        </template>
        <template v-else>
          {{ part.text }}
        </template>
      </i>
    </div>

    <namecard
      :uuid="uuid"
      :namecardTrigger="namecardTrigger">
    </namecard>
    
  </div>
</template>

<script>
import namecard from './../namecard.vue'

export default {
  props: {
    group: String,
    message: Object
  },

  data() {
    return {
      namecardTrigger: false,
    }
  },

  computed: {
    parts() {
      if (!this.message.payload.meta.var) {
        return [{text: this.message.payload.content, match: false}]
      }
      const name = this.message.payload.meta.var.name
      let part = this.message.payload.content.split(name).map(i => ({
        text: i,
        match: false,
      }))
      part.splice(1, 0, {text: name, match: true})
      return part
    },

    uuid() {
      if (!this.message.payload.meta.var || !this.message.payload.meta.var.id) {
        return ""
      }
      return this.message.payload.meta.var.id
    }
  },

  methods: {
    showNamecard() {
      this.namecardTrigger = !this.namecardTrigger
    }
  },

  components: {
    namecard,
  },
}
</script>

<style scoped>
.broadcast {
  width: calc(100% - 7rem);
  margin: 0 auto;
  background: var(--message-common-bgcolor);
}

.content {
  display: flex;
  justify-content: center;
}

.content i {
  height: 100%;
  text-align: center;
  color: var(--message-content-textcolor);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.content .highlight {
  cursor: pointer;
  color: var(--highlight);
}

.highlight:hover {
  text-decoration: underline;
}
</style>