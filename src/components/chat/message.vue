<template>
  <div :class="messageFrom() ? 'message bySelf' : 'message'">
    <div class="avatar">
      <img :src="'data:image/png;base64,' + avatar">
    </div>
    <div class="container">
      <div class="above">
        <div class="position">
          <p class="nameplate" ref="Nameplate">{{ nameplate }}</p>
          <p class="userName">{{ userName }}</p>
        </div>
      </div>
      <div>
        <p class="payload">{{ payload }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    time: String,
    type: String,
    avatar: String,
    uuid: String,
    userName: String,
    payload: String,
    owner: Object,
    admin: Map,
  },

  data() {
    return {
      nameplate: ""
    }
  },

  methods: {
    messageFrom() {
      return this.uuid === this.$store.state["account"]
    },

    getNameplate() {
      if (this.owner.has(this.uuid)) {
        this.$refs.Nameplate.style.backgroundColor = "gold"
        this.nameplate = "群主"
        return
      }
      if (this.admin.has(this.uuid)) {
        this.$refs.Nameplate.style.backgroundColor = "aqua"
        this.nameplate = "管理员"
        return
      }
      this.$refs.Nameplate.style.display = "none"
    },
  },

  mounted() {
    this.getNameplate()
  }

}
</script>

<style scoped>
img {
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  transform: translateY(8px);
}

.message {
  display: flex;
  margin-bottom: 16px;
}

.bySelf {
  direction: rtl;
}

.container {
  display: inline-block;
  max-width: 60%;
  margin: 0 8px;
}

.above {
  position: relative;
  width: 0;
  height: 24px;
}

.position {
  position: absolute;
  display: flex;
  height: 100%;
  white-space: nowrap;
  direction: ltr;
}

.nameplate {
  line-height: 24px;
  margin-right: 6px;
  padding: 0 6px;
  border-radius: 10px;
}

.userName {
  line-height: 30px;
}

.payload {
  word-wrap: break-word;
  white-space: pre-wrap;
  background-color: orangered;
  font-size: 1.2rem;
  line-height: 1.5rem;
  border-radius: 12px;
  padding: 0.8rem 1rem;
  margin-top: 6px;
  direction: ltr;
}
</style>