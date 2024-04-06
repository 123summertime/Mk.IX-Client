<template>
  <div class="toolsRoot">
    <div title="设置" @click="gotoSetting">
      <Tools></Tools>
    </div>
    <div title="收件箱">
      <Bell></Bell>
    </div>
    <div title="创建群" @click="makeVisible = true">
      <Plus></Plus>
    </div>
    <div title="搜索群" @click="searchVisible = true">
      <Search></Search>
    </div>
  </div>

  <sysMsgGetter></sysMsgGetter>

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
        <el-button type="primary" @click="gotoMakeGroup">确认</el-button>
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
      <div class="groupOpersItem">
        <p>入群问题</p>
        <p>{{ searchGroupQ }}</p>
      </div>
      <div class="groupOpersItem">
        <p>答案</p>
        <el-input v-model="searchGroupA"></el-input>
      </div>
    </div>
    <div v-else-if="searchState == 2">
      <p class="searchFailed">{{ searchFailedDetail }}</p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="searchVisible = false">取消</el-button>
        <el-button type="primary" :disabled="searchState != 1" @click="gotoJoinGroup">加入</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import axios from 'axios'

import router from './../../router/index.js'
import sysMsgGetter from './sysMsgGetter.vue'

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
      searchVisible: false,
    }
  },

  methods: {
    gotoSetting() {
      router.push('/setting')
    },

    gotoMakeGroup() {
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

    gotoJoinGroup() {
      const A = {A: this.searchGroupA}
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

.groupOpersItem {
  display: flex;
  height: 32px;
  justify-content: space-between;
  margin: 8px 0;
}

.groupOpersItem p, .searchGroupID p {
  line-height: 32px;
}

.groupOpersItem .el-input {
  width: 60%;
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