<template>
  <div class="groupConfigRoot">
    <ul>
      <li>
        <p>群头像</p>
        <img :src="info['avatar']" />
      </li>
      <li>
        <p>群名称</p>
        <div class="groupName">
          <input v-model="groupName" :disabled="!checkPermissions" @keydown="groupNameModified" />
        </div>
      </li>
      <li>
        <p>群ID</p>
        <p>{{ info['group'] }}</p>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    group: String,
    info: Object,
  },

  data() {
    return {
      groupName: this.info['name']
    }
  },

  methods: {
    groupNameModified(event) {
      if (event.key === 'Enter') {
        console.log(this.groupName)
      }
    }
  },

  computed: {
    checkPermissions() {
      const account = this.$store.state["account"]
      return this.info['owner'].has(account) || this.info['admin'].has(account)
    }
  }
}
</script>

<style scoped>
li {
  display: flex;
  justify-content: space-between;
  height: 48px;
  margin-bottom: 12px;
  line-height: 48px;
}

ul li:nth-of-type(1) {
  height: 64px;
  line-height: 64px;
}

li img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
}

.groupName {
  position: relative;
  height: 36px;
  margin: auto 0;
}

.groupName::before {
  display: block;
  position: absolute;
  content: "Enter键确认修改";
  width: 112px;
  height: 36px;
  line-height: 36px;
  right: 100%;
  opacity: 0;
}

.groupName:focus-within::before {
  opacity: 1;
}
</style>