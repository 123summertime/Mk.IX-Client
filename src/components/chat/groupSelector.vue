<template>
  <el-dialog
    v-model="visible"
    width="640px"
    :title="computedTitle"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false">
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
        <el-button @click="canceled">取消</el-button>
        <el-button type="primary" :disabled="groupID === ''" @click="selected">确定</el-button>
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
      groupName: "",
    }
  },

  methods: {
    getAllGroups() {
      this.groupList = this.$store.state.groupList
    },

    selectGroup(item) {
      this.groupID = item.group
      this.groupName = item.name
    },

    selected() {
      this.$emit('groupSelectorSelected', this.groupID)
    },

    canceled() {
      this.$emit('groupSelectorCanceled')
    }
  },

  computed: {
    computedTitle() {
      return this.groupName ? this.title + "至 " + this.groupName : this.title
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
  background-color: var(--groupSelector-hover-bgcolor);
  cursor: pointer;
}

.groupName {
  color: var(--groupSelector-groupName-textcolor);
}

.selected {
  background-color: var(--groupSelector-selected-bgcolor) !important;
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