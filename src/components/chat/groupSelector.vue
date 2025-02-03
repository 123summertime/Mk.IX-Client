<template>
  <el-dialog
    v-model="visible"
    :title="computedTitle"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="640px">
    <div class="groups">
      <div v-for="item in groupList" :key="item.group" @click="selectGroup(item)"
        class="groupItem"
        :class="{ 'selected': groupID === item.group }">
        <img :src="item.avatar" />
        <p class="groupName">{{ item.name }}</p>
      </div>
    </div>
    <template #footer>
      <div>
        <el-button plain type="info" @click="canceled">取消</el-button>
        <el-button plain type="primary" @click="selected">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
export default {
  emits: [
    'groupSelectorSelected',
    'groupSelectorCanceled',
  ],

  props: {
    title: String
  },

  data() {
    return {
      visible: true,
      groupID: "",
      groupType: "",
      groupName: "",
      avatar: "",
    }
  },

  methods: {
    getAllGroups() {
      this.groupList = this.$store.state.groupList
    },

    selectGroup(item) {
      this.groupID = item.group
      this.groupType = item.type
      this.groupName = item.name
      this.avatar = item.avatar
    },

    selected() {
      if (this.groupID === '') { return }
      this.$emit('groupSelectorSelected', {
        groupID: this.groupID,
        groupType: this.groupType,
        name: this.groupName,
        avatar: this.avatar
      })
    },

    canceled() {
      this.$emit('groupSelectorCanceled')
    }
  },

  computed: {
    computedTitle() {
      return this.groupName ? this.title + this.groupName : this.title
    }
  },

  mounted() {
    this.getAllGroups()
  }
}
</script>

<style scoped>
.groups {
  display: flex;
  flex-direction: column;
  max-height: 40vh;
  overflow: scroll;
}

.groups::-webkit-scrollbar {
  display: none;
}

.groupItem {
  display: flex;
  padding: 8px;
  border-radius: 8px;
}

.groupItem:hover {
  background: var(--groupSelector-hover-bgcolor);
  cursor: pointer;
}

.groupName {
  color: var(--groupSelector-groupName-textcolor);
}

.selected {
  background: var(--groupSelector-selected-bgcolor) !important;
}

.groupItem img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.groupItem p {
  line-height: 48px;
  margin-left: 24px;
}
</style>