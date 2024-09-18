<template>
  <div class="toolsRoot">
    <div title="设置" @click="gotoSetting">
      <Tools></Tools>
    </div>
    <div title="收件箱" @click="mailVisible = true">
      <Bell></Bell>
    </div>
    <div title="创建群" @click="makeVisible = true">
      <Plus></Plus>
    </div>
    <div title="搜索群" @click="searchVisible = true">
      <Search></Search>
    </div>
  </div>

  <sysMsgGetter
    @newJoinRequest="newJoinRequest"
    @newFriendRequest="newFriendRequest"
    @joined="joined"></sysMsgGetter>

  <!-- 群验证 -->
  <el-dialog v-model="mailVisible" title="群验证" width="540px">
    <ul class="GroupMails">
      <li v-for="msg in messageList" :key="msg.time" class="mail">
        <img :src="msg.senderAvatar" />
        <div class="mailTexts">
          <p>{{ groupMailText(msg) }}</p>
          <p>{{ '理由：' + msg.payload }}</p>
        </div>
        <div class="mailOpers" v-if="msg.state === 0">
          <Close @click="requestResponse(msg.type, msg.target, msg.time, false)"></Close>
          <Check @click="requestResponse(msg.type, msg.target, msg.time, true)"></Check>
        </div>
        <div class="mailResponse" v-else>
          <p>{{ cvtState(msg.state) }}</p>
        </div>
      </li>
    </ul>
  </el-dialog>

  <!-- 创建群 -->
  <el-dialog v-model="makeVisible" title="创建群" width="540px">
    <div class="groupOpersItem">
      <p>群名</p>
      <el-input v-model="makeGroupName"></el-input>
    </div>
    <div class="groupOpersItem">
      <p>入群问题</p>
      <el-input v-model="makeGroupQ"></el-input>
    </div>
    <div class="groupOpersItem">
      <p>答案</p>
      <el-input v-model="makeGroupA"></el-input>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="makeVisible = false">取消</el-button>
        <el-button type="primary" @click="makeGroup">确认</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 搜索 -->
  <el-dialog v-model="searchVisible" class="searchDialog" width="540px">
    <el-tabs v-model="searchTab">
      <el-tab-pane label="搜索群" name="searchGroup">
        <div class="searchInputBox">
          <el-input v-model="searchGroupID" placeholder='群号'></el-input>
          <el-button type="primary" @click="searchGroup">搜索</el-button>
        </div>
        <div v-if="searchGroupVisible" class="searchResult">
          <div class="searchResultL">
            <img :src="searchGroupAvatar">
            <div class="searchResultM">
              <p>{{ searchGroupName }}</p>
              <p>{{ `共${searchGroupMember}人` }}</p>
            </div>
          </div>
          <div class="searchResultR">
            <el-button type="primary" class="searchResultOper" @click="byQuestionVisible = true">回答入群问题</el-button>
            <el-button type="primary" class="searchResultOper" @click="byRequsetVisible = true">发送申请</el-button>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="搜索人" name="searchUser">
        <div class="searchInputBox">
          <el-input v-model="searchUserID" placeholder='用户ID'></el-input>
          <el-button type="primary" @click="searchUser">搜索</el-button>
        </div>
        <div v-if="searchUserVisible" class="searchResult">
          <div class="searchResultL">
            <img :src="searchUserAvatar">
            <div class="searchResultM">
              <p>{{ searchUserName }}</p>
              <p>{{ searchUserBio }}</p>
            </div>
          </div>
          <div class="searchResultR">
            <el-button type="primary" class="searchResultOper" @click="byRequsetVisible = true">发送申请</el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>

  <!-- 搜索群-回答入群问题 -->
  <el-dialog v-model="byQuestionVisible" class="searchDialog" width="540px">
    <div>
      <p>{{ "问题: " + searchGroupQ }}</p>
    </div>
    <div class="searchInputBox">
      <el-input v-model="searchGroupA"></el-input>
      <el-button type="primary" @click="joinGroupByQA">验证</el-button>
    </div>
  </el-dialog>

  <!-- 搜索群/人-发送申请 -->
  <el-dialog v-model="byRequsetVisible" class="searchDialog" width="540px">
    <div class="searchInputBox">
      <el-input v-model="searchGroupA" placeholder="申请理由(选填)"></el-input>
      <el-button type="primary" @click="searchGroupVisible ? joinGroupByRequest() : makeFriendByRequest()">申请</el-button>
    </div>
  </el-dialog>

</template>

<script>
import axios from 'axios'

import router from './../../router/index.js'
import sysMsgGetter from './sysMsgGetter.vue'

import { queryInfo } from '../../assets/queryDB.js'

export default {
  emits: [
    'joinGroupSuccess'
  ],

  data() {
    return {
      makeGroupName: "",
      makeGroupQ: "",
      makeGroupA: "",
      makeVisible: false,
      mailVisible: false,
      messageList: [],

      // 搜索相关
      searchVisible: false,
      searchTab: "searchGroup",      
      searchGroupVisible: false,
      searchGroupID: "",
      searchGroupName: "",
      searchGroupAvatar: "",
      searchGroupMember: 0,
      searchGroupQ: "",
      searchGroupA: "",
      byQuestionVisible: false,
      byRequsetVisible: false,
      searchUserVisible: false,
      searchUserID: "",
      searchUserName: "",
      searchUserAvatar: "",
      searchUserBio: "",
    }
  },

  methods: {
    gotoSetting() {
      router.push('/setting')
    },

    // 创建一个群聊
    makeGroup() {
      const QA = { Q: this.makeGroupQ, A: this.makeGroupA, name: this.makeGroupName }
      const URL = `http://${localStorage.getItem('adress')}/v1/group/register`
      axios.post(URL, QA, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("创建成功")
        this.makeVisible = false
        this.makeGroupName = ""
        this.makeGroupQ = ""
        this.makeGroupA = ""
        this.$emit('joinGroupSuccess', { group: res.data.groupID, name: this.makeGroupName }, true)
      }).catch(err => {
        ElMessage({
          message: `创建失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 搜索群聊 获取群名/入群问题/群人数
    searchGroup() {
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.searchGroupID}/verify/question`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(async res => {
        const info = await queryInfo("Group", res.data.lastUpdate, this.searchGroupID)
        this.searchGroupAvatar = info.avatar
        this.searchGroupName = info.name
        this.searchGroupQ = res.data.question
        this.searchGroupMember = res.data.member
        this.searchGroupVisible = true
      }).catch(err => {
        ElMessage({
          message: err.response.data.detail,
          duration: 6000,
          type: "error",
        })
      })
    },

    searchUser() {
      const URL = `http://${localStorage.getItem('adress')}/v1/user/profile/current/${this.searchUserID}`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(async res => {
        const info = await queryInfo("Account", res.data.lastUpdate, this.searchUserID)
        this.searchUserName = info.userName
        this.searchUserAvatar = info.avatar
        this.searchUserBio = res.data.bio
        this.searchUserVisible = true
      }).catch(err => {
        ElMessage({
          message: err.response.data.detail,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 通过正确回答入群问题进入新群
    joinGroupByQA() {
      const A = { A: this.searchGroupA }
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.searchGroupID}/verify/answer`
      axios.post(URL, A, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("加入成功")
        this.$emit('joinGroupSuccess', { group: this.searchGroupID, name: this.searchGroupName }, true)
        this.searchVisible = false
        this.byQuestionVisible = false
        this.searchGroupVisible = false
        this.searchGroupA = ""
        this.searchGroupID = ""
      }).catch(err => {
        this.searchGroupA = ""
        ElMessage({
          message: `加入失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 发送入群申请
    joinGroupByRequest() {
      const A = { note: this.searchGroupA }
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.searchGroupID}/verify/request`
      axios.post(URL, A, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("发送成功")
        this.searchVisible = false
        this.byRequsetVisible = false
        this.searchGroupVisible = false
        this.searchGroupA = ""
        this.searchGroupID = ""
      }).catch(err => {
        this.searchGroupA = ""
        ElMessage({
          message: `申请失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    makeFriendByRequest() {
      const A = { note: this.searchGroupA }
      const URL = `http://${localStorage.getItem('adress')}/v1/user/${this.searchUserID}/friend`
      axios.post(URL, A, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("发送成功")
        this.searchVisible = false
        this.byRequsetVisible = false
        this.searchUserVisible = false
      }).catch(err => {
        ElMessage({
          message: `申请失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 收到了新入群申请
    async newJoinRequest(joinRequset) {
      const { time, type, target, targetKey, state, senderID, senderKey, payload } = joinRequset
      const senderInfo = await queryInfo("Account", senderKey, senderID)
      const groupInfo = await queryInfo("Group", targetKey, target)
      const { avatar: senderAvatar, userName } = senderInfo
      const { avatar: groupAvatar, name: groupName } = groupInfo

      const idx = this.messageList.findIndex(i => i.time === time)
      if (idx === -1) {  // 新入群申请
        this.messageList.push({ time, type, target, state, senderID, payload, senderAvatar, userName, groupAvatar, groupName })
      } else {  // 更新入群申请(自己/其它管理员已审核过了)
        this.messageList[idx] = { time, type, target, state, senderID, payload, senderAvatar, userName, groupAvatar, groupName }
      }
    },

    // 收到了新的好友申请
    async newFriendRequest(friendRequest) {
      const { time, type, state, senderID, senderKey, payload } = friendRequest
      const senderInfo = await queryInfo("Account", senderKey, senderID)
      const { avatar: senderAvatar, userName } = senderInfo

      const idx = this.messageList.findIndex(i => i.time === time)
      if (idx === -1) {
        this.messageList.push({ time, type, state, senderID, payload, senderAvatar, userName })
      } else {
        this.messageList[idx] = { time, type, state, senderID, payload, senderAvatar, userName }
      }
      
    },

    // 群验证的消息文本
    groupMailText(msg) {
      const { type, userName, groupName } = msg
      const mapping = {
        join: `${userName} 申请加入 ${groupName}`,
        friend: `${userName} 申请加你为好友`,
      }

      return mapping[type]
    },

    // 审核验证消息
    requestResponse(type, group, time, verdict) {
      console.log(type, group, time, verdict)
      const uuid = this.$store.state.account
      const URLmapping = {
        join: `http://${localStorage.getItem('adress')}/v1/group/${group}/verify/response?verdict=${verdict}`,
        friend: `http://${localStorage.getItem('adress')}/v1/user/${uuid}/verify/response?verdict=${verdict}`,
      }

      const url = URLmapping[type]
      const T = { note: time }
      axios.post(url, T, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success(verdict ? "已通过" : "已拒绝")
      }).catch(err => {
        console.log(err)
        ElMessage({
          message: "操作失败",
          duration: 6000,
          type: "error",
        })
      })
    },

    // 状态码转化为文本
    cvtState(state) {
      let map = {
        1: "群主已同意",
        2: "群主已拒绝",
        3: "管理员已同意",
        4: "管理员已拒绝",
        5: "用户已同意",
        6: "用户已拒绝",
        7: "已同意",
        8: "已拒绝",
      }
      return map[state]
    },

    joined(msg) {
      this.$emit('joinGroupSuccess', { group: msg.target, name: msg.payload }, false)
    },
  },

  mounted() {
    this.searchState = 0
  },

  components: {
    sysMsgGetter
  }
}
</script>

<style scoped>
.toolsRoot {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 48px;
  padding: 8px 16px;
  background: var(--tools-toolsRoot);
}

.toolsRoot div svg {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.GroupMails {
  display: flex;
  flex-direction: column;
  max-height: 40vh;
  overflow: scroll;
}

.GroupMails::-webkit-scrollbar {
  display: none;
}

.mail {
  display: flex;
  padding: 8px;
  border-radius: 16px;
}

.mail img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.mail .mailTexts {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: space-around;
  margin: 0 24px;
}

.mail .mailOpers {
  display: flex;
  justify-content: space-around;
  width: 20%;
  height: 100%;
  margin: auto 0;
}

.mail .mailOpers svg {
  width: 36px;
  height: 36px;
  cursor: pointer;
}

.mail .mailOpers svg:nth-child(1):hover {
  color: var(--warn);
}

.mail .mailOpers svg:nth-child(2):hover {
  color: var(--check);
}

.mailResponse {
  line-height: 48px;
}

.groupOpersItem {
  display: flex;
  height: 32px;
  justify-content: space-between;
  margin: 8px 0;
}

.groupOpersItem p,
.searchGroupID p {
  line-height: 32px;
}

.groupOpersItem .el-input {
  width: 60%;
}

.searchInputBox {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
}

.searchInputBox .el-input {
  width: 75%;
}


.searchResult {
  width: 100%;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--tools-searchResult);
  padding-top: 20px;
}

.searchResultL {
  display: flex ;
}

.searchResultL img {
  display: block;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin-right: 32px;
}

.searchResultM {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.searchResultM p:first-child {
  font-size: 1.25rem;
}

.searchResultR { 
  display: flex;
  justify-content: space-around;
  align-items: center;
}
</style>


<style>
.searchDialog .el-dialog__header {
  display: none;
}

.searchDialog .el-dialog__body {
  padding-top: 20px;
}
</style>