<template>
  <div class="toolsRoot">
    <div title="设置" @click="gotoSetting">
      <Tools></Tools>
    </div>
    <div title="收件箱" @click="openMailBox">
      <el-badge :value="unreadMailCount" color="var(--negative)" :show-zero="false">
        <Bell></Bell>
      </el-badge>
    </div>
    <div title="创建群" @click="makeVisible = true">
      <Plus></Plus>
    </div>
    <div title="搜索群" @click="searchVisible = true">
      <Search></Search>
    </div>
  </div>

  <!-- 群通知/验证 -->
  <el-dialog v-model="mailVisible" :show-close="false" class="mailDialog" width="640px">
    <el-tabs v-model="mailTab">
      <el-tab-pane label="通知" name="notice">
        <div class="mailItems" @scroll="onScroll" ref="NoticeList">
          <eachNotice v-for="msg in noticeList" :key="msg.time" :msg="msg" @deleteNotice="deleteNotice"></eachNotice>
        </div>
      </el-tab-pane>
      <el-tab-pane label="收到的申请" name="receiveRequest">
        <div class="mailItems">
          <eachRequest v-for="msg in requestList" :key="msg.time" :msg="msg"></eachRequest>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>

  <!-- 创建群 -->
  <el-dialog v-model="makeVisible" title="创建群" width="640px">
    <div>
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
    </div>
    <template #footer>
      <span class="buildGroupFooter">
        <el-button plain type="info" @click="makeVisible = false">取消</el-button>
        <el-button plain type="primary" @click="makeGroup">创建</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 搜索 -->
  <el-dialog v-model="searchVisible" class="searchDialog" width="640px">
    <el-tabs v-model="searchTab">
      <el-tab-pane label="搜索群" name="searchGroup">
        <div class="searchInputBox">
          <el-input v-model="searchGroupID" placeholder='群号'></el-input>
          <el-button plain type="primary" @click="searchGroup">搜索</el-button>
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
            <el-button plain :size="buttonSize" type="primary" @click="byQuestionVisible = true">回答问题</el-button>
            <el-button plain :size="buttonSize" type="primary" @click="byRequsetVisible = true">发送申请</el-button>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="搜索人" name="searchUser">
        <div class="searchInputBox">
          <el-input v-model="searchUserID" placeholder='用户ID'></el-input>
          <el-button plain type="primary" @click="searchUser">搜索</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>

  <!-- 搜索群-回答入群问题 -->
  <el-dialog v-model="byQuestionVisible" class="searchDialog" width="640px">
    <div class="dialogText">
      <p>{{ "问题: " + searchGroupQ }}</p>
    </div>
    <div class="searchInputBox">
      <el-input v-model="searchGroupA" placeholder="答案"></el-input>
      <el-button plain type="primary" @click="joinGroupByQA">验证</el-button>
    </div>
  </el-dialog>

  <!-- 搜索群-发送申请 -->
  <el-dialog v-model="byRequsetVisible" class="searchDialog" width="640px">
    <div class="searchInputBox">
      <el-input v-model="searchGroupA" placeholder="申请理由(选填)"></el-input>
      <el-button plain type="primary" @click="joinGroupByRequest">申请</el-button>
    </div>
  </el-dialog>

  <!-- 搜索用户 -->
  <namecard
    :uuid="searchUserID"
    :namecardTrigger="searchUserTrigger">
  </namecard>

  <!-- 获取非群消息的websocket消息 -->
  <sysMsgGetter
    @joined="joined"
    @notice="newNotice"
    @newJoinRequest="newJoinRequest"
    @newFriendRequest="newFriendRequest">
  </sysMsgGetter>

</template>

<script>
import axios from 'axios'
import Dexie from 'dexie'

import sysMsgGetter from './sysMsgGetter.vue'
import namecard from './namecard.vue'
import eachNotice from './eachNotice.vue'
import eachRequest from './eachRequest.vue'

import { queryInfo } from '../../assets/js/queryDB.js'
import { dbCRUD } from '../../assets/js/dbCRUD.js'

export default {
  emits: [
    'joinGroupSuccess',
    'gotoSetting',
  ],

  data() {
    return {
      makeGroupName: "",
      makeGroupQ: "",
      makeGroupA: "",
      makeVisible: false,
      mailVisible: false,
      mailTab: "notice",
      unreadMailCount: 0,

      noticeList: [],
      requestList: [],
      page: 0,
      step: 20,
      
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
      searchUserTrigger: false,
      searchUserID: "",
    }
  },

  methods: {
    gotoSetting() {
      this.$emit('gotoSetting')
    },

    // 创建一个群聊
    makeGroup() {
      const QA = { name: this.makeGroupName, Q: this.makeGroupQ, A: this.makeGroupA }
      const URL = `${localStorage.getItem('adress')}/v1/group/register`
      axios.post(URL, QA, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("创建成功")
        this.makeVisible = false
        this.makeGroupName = ""
        this.makeGroupQ = ""
        this.makeGroupA = ""
        this.$emit('joinGroupSuccess', { group: res.data.groupID, name: this.makeGroupName, type: "group" }, true)
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
      const URL = `${localStorage.getItem('adress')}/v1/group/${this.searchGroupID}/verify/question`
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
          message: `搜索失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    searchUser() {
      const URL = `${localStorage.getItem('adress')}/v1/user/${this.searchUserID}/profile/current`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(async res => {
        this.searchUserTrigger = !this.searchUserTrigger
      }).catch(err => {
        ElMessage({
          message: `搜索失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 通过正确回答入群问题进入新群
    joinGroupByQA() {
      const A = { A: this.searchGroupA }
      const URL = `${localStorage.getItem('adress')}/v1/group/${this.searchGroupID}/verify/answer`
      axios.post(URL, A, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
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
      const reason = { reason: this.searchGroupA }
      const URL = `${localStorage.getItem('adress')}/v1/group/${this.searchGroupID}/verify/request`
      axios.post(URL, reason, {
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
      const reason = { reason: this.searchGroupA }
      const URL = `${localStorage.getItem('adress')}/v1/user/${this.searchUserID}/friend`
      axios.post(URL, reason, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("发送成功")
        this.searchVisible = false
        this.byRequsetVisible = false
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
      const { avatar: senderAvatar, username } = senderInfo
      const { avatar: groupAvatar, name: groupName } = groupInfo

      const idx = this.requestList.findIndex(i => i.time === time)
      if (idx === -1) {  // 新入群申请
        this.requestList.push({ time, type, target, state, senderID, payload, senderAvatar, username, groupAvatar, groupName })
        if (!this.mailVisible && state === "等待审核") { this.unreadMailCount += 1 }
      } else {  // 更新入群申请(自己/其它管理员已审核过了)
        this.requestList[idx] = { time, type, target, state, senderID, payload, senderAvatar, username, groupAvatar, groupName }
      }
    },

    // 收到了新的好友申请
    async newFriendRequest(friendRequest) {
      const { time, type, state, senderID, senderKey, payload } = friendRequest
      const senderInfo = await queryInfo("Account", senderKey, senderID)
      const { avatar: senderAvatar, username } = senderInfo

      const idx = this.requestList.findIndex(i => i.time === time)
      if (idx === -1) {
        this.requestList.push({ time, type, state, senderID, payload, senderAvatar, username })
        if (!this.mailVisible && state === "等待审核") { this.unreadMailCount += 1 }
      } else {
        this.requestList[idx] = { time, type, state, senderID, payload, senderAvatar, username }
      }
    },

    joined(msg) {
      this.$emit('joinGroupSuccess', msg)
    },

    buildOrGetDB() {
      const db = new Dexie('Notice')
      db.version(1).stores({
        notice: "&time",
      })
      this.DB = new dbCRUD(db)
    },

    async loadNoticeHistory() {
      const history = await this.DB.queryRange('notice', this.page * this.step, this.step, true)
      this.noticeList = this.noticeList.concat(history.filter(msg => msg.account === localStorage.getItem("account")))
      this.page += 1
    },

    newNotice(noticeMsg) {
      this.noticeList.unshift(noticeMsg)
      this.DB.add("notice", {
        time: noticeMsg.time,
        account: this.$store.state.account, 
        type: noticeMsg.type,
        subType: noticeMsg.subType, 
        payload: noticeMsg.payload,
        meta: JSON.parse(JSON.stringify(noticeMsg.meta)),
      })
      if (!this.mailVisible) {
        this.unreadMailCount += 1
      }
    },

    deleteNotice(time) {
      const idx = this.noticeList.findIndex(i => i.time === time)
      this.noticeList.splice(idx, 1)
      this.DB.delete("notice", "time", time)
      ElMessage.success("删除成功")
    },

    openMailBox() {
      this.mailVisible = true
      this.unreadMailCount = 0
    },

    async onScroll() {
      const threshold = 50
      if (this.$refs.NoticeList.scrollTop <= threshold) {
        await this.loadNoticeHistory()
      }
    },
  },

  computed: {
    buttonSize() {
      return window.innerWidth <= 768 ? "small" : "default"
    },
  },

  async mounted() {
    this.searchState = 0
    this.buildOrGetDB()
    await this.loadNoticeHistory()
  },

  components: {
    sysMsgGetter,
    namecard,
    eachNotice,
    eachRequest,
  }
}
</script>

<style scoped>
.toolsRoot {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 3rem;
  padding: 0.5rem 16px;
  background: var(--tools-toolsRoot-bgcolor);
}

.toolsRoot div svg {
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  color: var(--tools-items-svgcolor);
}

.mailItems {
  display: flex;
  flex-direction: column;
  max-height: 40vh;
  overflow: scroll;
}

.mailItems::-webkit-scrollbar {
  display: none;
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
  color: var(--tools-common-textcolor);
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
  align-items: center;
  border-top: 1px solid;
  border-image: var(--tools-searchResult-border) 1;
  padding-top: 20px;
}

.searchResultL {
  display: flex;
}

.searchResultL img {
  display: block;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  margin-right: 1rem;
}

.searchResultM {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.searchResultM p:first-child {
  font-size: 1.2rem;
}

.searchResultM p {
  color: var(--tools-searchResult-textcolor);
}

.searchResultR {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialogText {
  color: var(--tools-common-textcolor);
}

/* 覆盖el样式 */
:deep(.el-tabs__item) {
  color: var(--tools-tab-textcolor);
}

:deep(.el-tabs__item:hover), :deep(.is-active) {
  color: var(--el-color-primary);
}
</style>


<style>
.searchDialog .el-dialog__header,
.mailDialog .el-dialog__header {
  display: none;
}

.searchDialog .el-dialog__body,
.mailDialog .el-dialog__body {
  padding-top: 0;
}
</style>