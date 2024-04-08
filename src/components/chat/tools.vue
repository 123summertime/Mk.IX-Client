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

  <sysMsgGetter @newJoinRequest="newJoinRequest"></sysMsgGetter>


  <!-- 群验证 -->
  <el-dialog v-model="mailVisible" title="群验证" width="540px">
    <ul class="GroupMails">
      <li v-for="msg in messageList" :key="msg['time']" class="mail">
        <img :src="msg['avatar']" />
        <div class="mailTexts">
          <p>{{ groupMailText(msg['userName'], msg['type'], msg['group'], msg['groupKey']) }}</p>
          <p>{{ msg['payload'] }}</p>
        </div>
        <div class="mailOpers">
          <Close></Close>
          <Check></Check>
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


  <!-- 搜索群 -->
  <el-dialog v-model="searchVisible" title="搜索群" width="540px">
    <div class="searchGroupID">
      <p>群号</p>
      <div class="searchOpers">
        <el-input v-model="searchGroupID"></el-input>
        <el-button type="primary" @click="searchGroup">搜索</el-button>
      </div>
    </div>

    <div v-if="searchState == 1">
      <div class="groupOpersItem">
        <p>群名</p>
        <p>{{ searchGroupName }}</p>
      </div>

      <el-switch
        class="searchGroupOption"
        v-model="searchGroupOption"
        active-text="通过发送入群申请"
        inactive-text="通过回答验证问题" />

      <div v-if="searchGroupOption">
        <div class="groupOpersItem">
          <p>申请理由</p>
          <el-input v-model="searchGroupA"></el-input>
        </div>
      </div>
      <div v-else>
        <div class="groupOpersItem">
          <p>入群问题</p>
          <p>{{ searchGroupQ }}</p>
        </div>
        <div class="groupOpersItem">
          <p>答案</p>
          <el-input v-model="searchGroupA"></el-input>
        </div>
      </div>
    </div>

    <div v-else-if="searchState == 2">
      <p class="searchFailed">{{ searchFailedDetail }}</p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="searchVisible = false">取消</el-button>
        <el-button type="primary" :disabled="searchState != 1" @click="joinGroupByReq"
          v-if="searchGroupOption">申请</el-button>
        <el-button type="primary" :disabled="searchState != 1" @click="joinGroupByQA" v-else>加入</el-button>
      </span>
    </template>
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

      searchState: 0,
      searchGroupID: "",
      searchGroupName: "",
      searchGroupQ: "",
      searchGroupA: "",
      searchFailedDetail: "",
      searchGroupOption: false,
      searchVisible: false,

      mailVisible: false,

      messageList: [],
    }
  },

  methods: {
    gotoSetting() {
      router.push('/setting')
    },

    makeGroup() {
      const QA = { Q: this.makeGroupQ, A: this.makeGroupA }
      const URL = `http://${localStorage.getItem('adress')}/makeGroup?name=${this.makeGroupName}`
      axios.post(URL, QA, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.makeVisible = false
        this.makeGroupName = ""
        this.makeGroupQ = ""
        this.makeGroupA = ""
        ElMessage.success("创建成功")
        this.$emit('joinGroupSuccess', { "group": res["data"]["groupID"], "name": this.makeGroupName })
      }).catch(err => {
        ElMessage({
          message: `创建失败 ${err['response']['data']['detail']}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    searchGroup() {
      const URL = `http://${localStorage.getItem('adress')}/joinQuestion?group=${this.searchGroupID}`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.searchState = 1
        this.searchGroupName = res["data"]["name"]
        this.searchGroupQ = res["data"]["question"]
      }).catch(err => {
        this.searchState = 2
        this.searchFailedDetail = err['response']['data']['detail']
      })
    },

    joinGroupByQA() {
      const A = { A: this.searchGroupA }
      const URL = `http://${localStorage.getItem('adress')}/join?group=${this.searchGroupID}`
      axios.post(URL, A, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("加入成功")
        this.$emit('joinGroupSuccess', { "group": this.searchGroupID, "name": this.searchGroupName })

        this.searchVisible = false
        this.searchState = 0
        this.searchGroupQ = ""
        this.searchGroupA = ""
        this.searchGroupID = ""
      }).catch(err => {
        ElMessage({
          message: `加入失败 ${err['response']['data']['detail']}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    joinGroupByReq() {
      const URL = `http://${localStorage.getItem('adress')}/joinRequest?group=${this.searchGroupID}&joinText=${this.searchGroupA}`
      axios.post(URL, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("申请已发送")
        this.searchVisible = false
        this.searchState = 0
        this.searchGroupQ = ""
        this.searchGroupA = ""
        this.searchGroupID = ""
      }).catch(err => {
        ElMessage({
          message: `申请失败 ${err['response']['data']['detail']}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    async newJoinRequest(joinRequset) {
      const { time, type, group, groupKey, state, senderID, senderKey, payload } = joinRequset
      const info = await queryInfo("Account", senderKey, senderID)
      const { lastUpdate: _1, ...userInfo } = info
      this.messageList.push({ time, type, group, groupKey, state, payload, ...userInfo })
      console.log(this.messageList)
    },

    // async 解决
    async groupMailText(name, type, group, groupKey) {
      console.log(name, type, group, groupKey)
      const info = await queryInfo("Group", groupKey, group)
      console.log(info)
      if (type === 'join') {
        return `${name} 申请加入 ${info["name"]}`
      }
    }

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
  position: absolute;
  left: 0;
  bottom: 0;
}

.toolsRoot {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 48px;
  padding: 8px 16px;
  background: linear-gradient(rgba(245, 245, 245, 0), rgba(245, 245, 245, 0.2));
  backdrop-filter: blur(8px);
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
  margin: 0 24px;
}

.mail .mailOpers {
  display: flex;
  width: 30%;
  height: 100%;
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

.searchGroupOption {
  width: 100%;
  justify-content: center;
  margin: 4px 0;
}

.searchGroupID {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
}

.searchOpers {
  display: flex;
  width: 60%;
  height: 32px;
}

.searchOpers .el-button {
  margin-left: 12px;
}

.searchFailed {
  color: red;
}
</style>