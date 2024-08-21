<template>
  <div class="favoriteRoot">
    <div class="imgsOuter" @scroll="onScroll" ref="ImgsOuter">
      <div class="imgs">
        <div class="eachImg" v-for="img, idx in favoriteImgs" :key="img['time']"
          title="左键发送，中键删除，右键移至最前"
          @mouseup="operations($event, idx, img)"
          @contextmenu.prevent=" (e) => { e.preventDefault() }">
          <img :src="img['payload']" />
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
      step: 20,
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
      if (e.scrollLeft + e.clientWidth >= e.scrollWidth - threshold) {
        this.getFavoriteImg()
      }
    },

    operations(event, idx, img) {
      const oper = event.button

      // 左键
      if (oper === 0) {
        this.$emit('sendFavoriteImg', img.payload)
        return
      }

      // 中键
      if (oper === 1) {
        this.favoriteImgs.splice(idx, 1)
        this.DB.delete('Image', 'time', img.time)
        return
      }

      // 右键
      if (oper === 2) {
        this.favoriteImgs.splice(idx, 1)
        this.DB.delete('Image', 'time', img.time)
        img.time = -1 * Date.now() // 时间戳*-1实现放最前面
        this.favoriteImgs.unshift(img)
        this.DB.add('Image', Object.assign({}, img))
        return
      }
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
  background-color: lightsalmon;
}

.imgsOuter {
  height: 100%;
  overflow-x: auto;
}

.imgs {
  display: grid;
  grid-template-rows: 45% 45%;
  grid-template-columns: repeat(auto-fill, 150px);
  grid-auto-flow: column;
  gap: 8px;
  height: 100%;
  padding: 8px 8px 0 8px;
}

.eachImg {
  width: 150px;
  height: 100%;
  border-radius: 8px;
}

.eachImg:hover {
  background-color: lightcyan;
}

.eachImg img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  margin: auto auto;
}
</style>