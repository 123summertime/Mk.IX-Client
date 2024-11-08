<template>
  <div class="settingRoot">
    <span class="title">
      <p>个人信息</p>
    </span>
    <ul class="general">
      <li class="avatar">
        <p>头像</p>
        <img :src="avatar" title="点击修改头像" @click="editAvatarVisible=true" />
        <ArrowRight class="arrow hiddenArrow" />
      </li>

      <li @click="copySelfUID">
        <p>UID</p>
        <p>{{ uuid }}</p>
        <ArrowRight class="arrow hiddenArrow" />
      </li>

      <li @click="editUsernameVisible = true">
        <p>昵称</p>
        <p>{{ username }}</p>
        <ArrowRight class="arrow" />
      </li>

      <li @click="editBioVisible = true">
        <p>简介</p>
        <ArrowRight class="arrow" />
      </li>
    </ul>

    <span class="title">
      <p>本地设置</p>
    </span>
    <ul class="general">
      <li @click="editLayoutVisible = true">
        <p>布局</p>
        <ArrowRight class="arrow" />
      </li>
      <li @click="editLayoutVisible = true">
        <p>本地数据</p>
        <ArrowRight class="arrow" />
      </li>
    </ul>

  </div>

  <!-- 修改头像 -->
  <el-dialog v-model="editAvatarVisible" :show-close="false" width="640px">
    <ImgCutter class="imgCutter"
      :isModal="false"
      :boxWidth="getImgCutterWidth"
      fileType="webp"
      rate="1:1"
      @cutDown="userAvatarModified">
      <template #cancel>
        <el-button plain type="info" @click="editAvatarVisible = false">取消</el-button>
      </template>
    </ImgCutter>
  </el-dialog>

  <!-- 修改昵称 -->
  <el-dialog title="修改昵称" v-model="editUsernameVisible" width="640px">
    <el-input v-model="newUsername" placeholder="新昵称" />
    <template #footer>
      <el-button plain type="info" @click="editUsernameVisible = false">取消</el-button>
      <el-button plain type="primary" @click="usernameModified">确认修改</el-button>
    </template>
  </el-dialog>

  <!-- 修改简介 -->
  <el-dialog title="修改简介" v-model="editBioVisible" width="640px">
    <el-input v-model="bio" placeholder="个人简介" />
    <template #footer>
      <el-button plain type="info" @click="editBioVisible = false">取消</el-button>
      <el-button plain type="primary" @click="userBioModified">确认修改</el-button>
    </template>
  </el-dialog>

  <!-- 修改布局 -->
  <el-dialog title="修改布局" v-model="editLayoutVisible" width="640px">
    <el-input v-model="groupWidth" placeholder="Please input">
      <template #append>px</template>
    </el-input>
    <template #footer>
      <el-button plain type="info" @click="editLayoutVisible = false">取消</el-button>
      <el-button plain type="primary" @click="userLayoutModified">确认修改</el-button>
    </template>
  </el-dialog>

</template>

<script>
import axios from 'axios'
import ImgCutter from 'vue-img-cutter'

export default {
  emits: [
    'userAvatarModified',
    'usernameModified',
  ],

  props: {
    uuid: String,
    username: String,
    avatar: String,
  },

  data() {
    return {
      bio: '',
      newUsername: '',

      groupWidth: 0,
      inputTop: 0,
      theme: '',
      deviceID: '',
      // 退出登录 github地址 服务器限制 （导出记录） indexedDB使用 不保存记录

      editAvatarVisible: false,
      editUsernameVisible: false,
      editBioVisible: false,
      editLayoutVisible: false,

    };
  },
  
  methods: {
    getLayoutSettings() {
      this.groupWidth = localStorage.getItem('groupWidth') || '默认'
      this.inputTop = localStorage.getItem('inputTop') || '默认'
      this.theme = localStorage.getItem('theme') || 'theme2'
    },

    getSelfInfo() {
      let URL =`http://${localStorage.getItem('adress')}/v1/user/${this.uuid}/profile/current`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(async res => {
        this.bio = res.data.bio
      }).catch(err => {
        ElMessage({
          message: `获取个人信息失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })      
    },

    userAvatarModified(info) {
      const base64 = info.dataURL
      const URL = `http://${localStorage.getItem('adress')}/v1/user/${this.uuid}/profile/avatar`
      axios.patch(URL, { avatar: base64 }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.editAvatarVisible = false
        this.$emit('userAvatarModified', base64)
        ElMessage.success("修改成功, 刷新页面后生效")
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    copySelfUID() {
      const cb = navigator.clipboard
      if (!cb) { return }
      cb.writeText(this.uuid)
      ElMessage.success("复制成功")
    },

    usernameModified() {
      const URL = `http://${localStorage.getItem('adress')}/v1/user/${this.uuid}/profile/username`
      const payload = { name: this.newUsername }
      axios.patch(URL, payload, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.editUsernameVisible = false
        this.$emit('usernameModified', this.newUsername)
        ElMessage.success("修改成功, 刷新页面后生效")
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    userBioModified() {
      const URL = `http://${localStorage.getItem('adress')}/v1/user/${this.uuid}/profile/bio`
      const payload = { bio: this.bio }
      axios.patch(URL, payload, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.editBioVisible = false
        ElMessage.success("修改成功")
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    userLayoutModified() {

    }

  },

  computed: {
    getImgCutterWidth() {
      return Math.min(600, window.innerWidth - 30)
    }
  },

  mounted() {
    this.getLayoutSettings()
    this.getSelfInfo()
  },

  components: {
    ImgCutter,
  }

}
</script>

<style scoped>
.settingRoot {
  background: var(--drawer-groupConfigRoot-bgcolor);
}

.settingRoot .title {
  display: inline-block;
  border-bottom: 2px solid var(--drawer-generalTitle-border);
  margin-bottom: 1rem;
  color: var(--drawer-generalTitle-textcolor);
}

.settingRoot .title p {
  font-size: 1.4rem;
  padding: 6px 24px 6px 0;
}

ul {
  overflow: hidden;
}

ul li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
}

.avatar {
  height: 10rem;
}

.avatar img {
  height: 100%;
  border-radius: 16px;
  cursor: pointer;
}

li p:nth-of-type(1) {
  flex: 1 0 auto;
  font-size: 1.2rem;
  color: var(--drawer-general-subTitle-textcolor);
}

li p:nth-of-type(2) {
  color: var(--drawer-general-info-textcolor);
}

li .dangerItem {
  color: var(--negative);
}

.arrow {
  flex: 0 0 1.5rem;
  margin-left: 12px;
  color: var(--drawer-general-info-textcolor);
}

.hiddenArrow {
  visibility: hidden;
}

.general {
  border: 2px solid var(--drawer-general-border);
  border-radius: 8px;
  margin-bottom: 32px;
}

.general li:hover {
  background: var(--drawer-general-hover-bgcolor);
}

.dangerZone {
  border: 2px solid var(--drawer-dangerZoneTitle-border);
  border-radius: 8px;
  background-image: repeating-linear-gradient(
    -45deg, 
    var(--drawer-dangerZone-bgcolor), 
    var(--drawer-dangerZone-bgcolor) 8px, 
    transparent 8px, 
    transparent 24px);
}

.dangerZone li:hover {
  background: var(--drawer-dangerZone-hover-bgcolor);
}
</style>