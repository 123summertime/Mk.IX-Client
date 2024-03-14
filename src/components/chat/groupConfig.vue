<template>
  <div class="groupConfigRoot">
    <ul>
      <li>
        <p>群头像</p>
        <img class="groupAvatar" :src="info['avatar']" @click="beforeModifyAvatar" />
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

  <el-dialog v-model="visible" width="540px">
    <ImgCutter class="imgCutter"
      :isModal="false"
      :boxWidth="500"
      fileType="webp"
      rate="1:1"
      @cutDown="groupAvatarModified"></ImgCutter>
  </el-dialog>
</template>

<script>
import axios from 'axios'
import ImgCutter from 'vue-img-cutter'

export default {
  emits: ['groupNameModified', 'groupAvatarModified'],

  props: {
    group: String,
    info: Object,
  },

  data() {
    return {
      groupName: this.info['name'],
      visible: false
    }
  },

  methods: {
    groupNameModified(event) {
      if (event.key === 'Enter') {
        const URL = `http://${localStorage.getItem('adress')}/modifyGroupName?group=${this.group}&newName=${this.groupName}`
        axios.post(URL, {}, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => {
          ElMessage.success("修改成功")
          this.$emit('groupNameModified', { "group": this.group, "name": this.groupName })
        }).catch(err => {
          ElMessage({
            message: `修改失败 ${err['response']['data']['detail']}`,
            duration: 6000,
            type: "error",
          })
        })
      }
    },

    beforeModifyAvatar() {
      if (this.checkPermissions) {
        this.visible = true
      }
    },

    groupAvatarModified(info) {
      const base64 = info["dataURL"]
      const URL = `http://${localStorage.getItem('adress')}/modifyGroupAvatar?group=${this.group}`
      axios.post(URL, { 'avatar': base64 }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.visible = false
        ElMessage.success("修改成功")
        this.$emit('groupAvatarModified', { "group": this.group, "avatar": base64 })
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err['response']['data']['detail']}`,
          duration: 6000,
          type: "error",
        })
      })
    }
  },

  computed: {
    checkPermissions() {
      const account = this.$store.state["account"]
      return this.info['owner'].has(account) || this.info['admin'].has(account)
    }
  },

  components: {
    ImgCutter
  }
}
</script>

<style scoped>
li {
  display: flex;
  justify-content: space-between;
  height: 48px;
  margin: 8px 0;
  line-height: 48px;
}

ul li:nth-of-type(1) {
  height: 64px;
  line-height: 64px;
}

.groupAvatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  cursor: pointer;
}

.groupName {
  position: relative;
  height: 36px;
}

.groupName input {
  height: 36px;
  padding: 0 6px;
  text-align: right;
  border: 1px black solid;
}

.groupName input:focus {
  outline: none;
  border: 1px var(--el-color-danger) solid;
}

.groupName::before {
  display: block;
  position: absolute;
  content: "Enter键确认修改";
  width: 112px;
  font-size: 0.75rem;
  right: 100%;
  opacity: 0;
}

.groupName:focus-within::before {
  opacity: 1;
}

.imgCutter {
  width: 100%;
}
</style>