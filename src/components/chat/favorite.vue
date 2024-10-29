<template>
  <div class="favoriteRoot">
    <div class="imgsOuter" @scroll="onScroll" ref="ImgsOuter">
      <div class="imgs">
        <div class="eachImg" v-for="img, idx in favoriteImgs" :key="img.time">
          <el-popover placement="top" :width="260" trigger="click" :hide-after="0">
            <div class="imgOpers">
              <el-button type="danger" @click="deleteOperation(img, idx)">删除</el-button>
              <el-button type="info" @click="pinnedOperation(img, idx)">置顶</el-button>
              <el-button type="primary" @click="sendOperation(img)">发送</el-button>
            </div>
            <template #reference>
              <img :src="img.payload" />
            </template>
          </el-popover>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      page: 0,
      step: 50,
      favoriteImgs: [],
      DB: null,
    }
  },

  methods: {
    async getFavoriteDB() {
      this.DB = await this.$store.state.favoriteDB
    },

    // 从DB中获取收藏的表情包
    async getFavoriteImg() {
      let imgs = await this.DB.queryRange('Image', this.page * this.step, this.step, false)
      for (const img of imgs) {
        this.favoriteImgs.push(img)
      }
      this.page += 1
    },

    // 快滚动到底时，获取下一页表情包
    async onScroll() {
      const threshold = 50
      const e = this.$refs.ImgsOuter
      if (e.scrollTop + e.clientHeight >= e.scrollHeight - threshold) {
        this.getFavoriteImg()
      }
    },

    deleteOperation(img, idx) {
      this.favoriteImgs.splice(idx, 1)
      this.DB.delete('Image', 'time', img.time)
    },

    pinnedOperation(img, idx) {
      this.favoriteImgs.splice(idx, 1)
      this.DB.delete('Image', 'time', img.time)
      img.time = -1 * Date.now() // 时间戳*-1实现放最前面
      this.favoriteImgs.unshift(img)
      this.DB.add('Image', Object.assign({}, img))
    },

    sendOperation(img) {
      this.$emit('sendFavoriteImg', img.payload)
    },
  },

  async mounted() {
    await this.getFavoriteDB()
    await this.getFavoriteImg()
  }
}
</script>

<style scoped>
.favoriteRoot {
  width: 100%;
  height: 100%;
  background: var(--favorite-favoriteRoot-bgcolor);
}

.imgsOuter {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.imgsOuter::-webkit-scrollbar {
  display: none;
}

.imgs {
  display: flex;
  flex-wrap: wrap;
  padding: 0 24px;
}

.eachImg {
  width: 96px;
  height: 96px;
  margin: 12px 24px 12px 0;
  cursor: pointer;
}

.eachImg:hover {
  background: var(--favorite-eachImg-hover-bgcolor);
}

.eachImg img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.imgOpers {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>