<template>
  <div class="groupConfigRoot">
    <ul class="groupItems">
      <li>
        <p>群头像</p>
        <img class="groupAvatar" :src="info['avatar']" title="点击修改头像" @click="beforeModifyAvatar" />
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
      <li>
        <p>群成员</p>
        <div class="members" title="点击查看详细信息">
          <p @click="membersVisible = true">{{ membersInfo.length + "人" }}</p>
        </div>
      </li>
      <li>
        <p>置顶</p>
        <p></p>
      </li>
      <li>
        <p>退出</p>
        <p></p>
      </li>
    </ul>
  </div>

  <!-- 修改群头像 -->
  <el-dialog v-model="visible" width="540px">
    <ImgCutter class="imgCutter"
      :isModal="false"
      :boxWidth="500"
      fileType="webp"
      rate="1:1"
      @cutDown="groupAvatarModified"></ImgCutter>
  </el-dialog>

  <!-- 群成员信息 -->
  <el-dialog v-model="membersVisible"
    class="memberInfo"
    width="540px"
    :title="`${this.info['name']}(${this.membersInfo.length})`"
    style="max-height: 70vh; overflow-y: auto;">
    <ul class="list">
      <li>
        <p>群主</p>
      </li>
      <li>
        <eachMember 
        :pair="getOwner" 
        :role="'owner'"
        :permission="getRole"
        ></eachMember>
      </li>

      <li>
        <p>管理员</p>
      </li>
      <li>
        <eachMember v-for="pair in getAdmin"
          :key="pair[0]"
          :pair="pair"
          :role="'admin'"
          :permission="getRole"></eachMember>
      </li>

      <li>
        <p>成员</p>
      </li>
      <li>
        <eachMember v-for="pair in getUser"
          :key="pair[0]"
          :pair="pair"
          :role="'user'"
          :permission="getRole"></eachMember>
      </li>
    </ul>
  </el-dialog>
</template>

<script>
import axios from 'axios'
import ImgCutter from 'vue-img-cutter'

import eachMember from './eachMember.vue'

export default {
  emits: ['groupNameModified', 'groupAvatarModified'],

  props: {
    group: String,
    info: Object,
  },

  data() {
    return {
      groupName: this.info['name'],
      visible: false,
      membersVisible: false,
      membersInfo: [],
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
    },

    getMembersInfo() {
      const URL = `http://${localStorage.getItem('adress')}/getMembersInfo?group=${this.group}`
      axios.get(URL).then(res => {
        this.membersInfo = res["data"]["users"]
      }).catch(err => {
        console.log(err)
      })
    },
  },

  computed: {
    checkPermissions() {
      const role = this.getRole
      return role === 'owner' || role === 'admin'
    }, 

    getRole() {
      const account = this.$store.state["account"]
      if (this.info['owner'].has(account)) return "owner"
      if (this.info['admin'].has(account)) return "admin"
      return "user"
    },

    getOwner() {
      return Array.from(this.info['owner'].entries())[0]
    },

    getAdmin() {
      return Array.from(this.info['admin'].entries())
    },

    getUser() {
      let owner = this.info['owner']
      let admin = this.info['admin']
      let users = []
      this.membersInfo.forEach((pair) => {
        let uuid = pair["uuid"]
        if (!owner.has(uuid) && !admin.has(uuid)) {
          users.push([pair["uuid"], pair["lastUpdate"]])
        }
      })
      return users
    }
  },

  mounted() {
    this.getMembersInfo()
  },

  components: {
    ImgCutter,
    eachMember,
  }
}
</script>

<style scoped>
.groupItems li {
  display: flex;
  justify-content: space-between;
  height: 48px;
  margin: 8px 0;
  line-height: 48px;
}

.groupItems li:nth-of-type(1) {
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

.members {
  width: 33%;
  cursor: pointer;
}

.members p {
  text-align: right;
}

.list {
  display: flex;
  flex-direction: column;
}

.list li {
  margin: 4px 0;
}

.list li:nth-of-type(2n - 1) {
  height: 36px;
  line-height: 36px;
  font-weight: 700;
  margin-bottom: 0;
}

.list li:nth-of-type(1) {
  color: gold;
}

.list li:nth-of-type(3) {
  color: aqua;
}
</style>
