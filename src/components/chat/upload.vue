<template>
  <div class="uploadRoot" ref="UploadRoot">
    <div class="uploadL">
      <Upload :class="failed ? 'negative' : progress >= 100 ? 'positive' : 'neutral'"></Upload>
    </div>
    <div class="uploadR" v-if="progress < 100">
      <p class="title">{{ title }}</p>
      <div>
        <div class="overProgress">
          <p>{{ progress + "%" }}</p>
          <p>{{ speed + "/s" }}</p>
        </div>
        <div class="bottomLine">
          <div class="progress" ref="Progress"></div>
        </div>
      </div>
    </div>
    <div class="result" v-else-if="failed">
      <p class="negative">上传失败</p>
    </div>
    <div class="result" v-else>
      <p class="positive">上传成功</p>
    </div>
    <Close class="close" @click="visible = false"></Close>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    speed: String,
    progress: Number,
    show: Boolean,
    failed: Boolean,
  },

  data() {
    return {
      visible: false,
    }
  },

  watch: {
    progress: {
      handler() {
        if (this.$refs.Progress) {
          this.$refs.Progress.style.width = this.progress + '%'
        }
      }
    },

    show: {
      handler(newVal) {
        this.visible = newVal
      }
    },

    visible: {
      handler(newVal) {
        if (newVal) {
          this.$refs.UploadRoot.classList.add("animateIn")
        } else {
          this.$refs.UploadRoot.classList.remove("animateIn")
          this.$refs.UploadRoot.classList.add("animateOut")
          setTimeout(() => {
            this.$refs.UploadRoot.classList.remove("animateOut")
          }, 600)
        }
      }
    },

  }
}
</script>

<style scoped>
.uploadRoot {
  display: flex;
  position: fixed;
  right: -350px;
  top: 96px;
  width: 300px;
  height: 100px;
  padding: 0.8rem 1rem;
  background: var(--upload-uploadRoot-bgcolor);
  border-radius: 8px;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.72);
}

@keyframes slideIn {
  from {
    right: -350px;
  }
  to {
    right: 0;
  }
}

.animateIn {
  animation: slideIn 0.5s ease forwards;
}

@keyframes slideOut {
  from {
    right: 0;
  }
  to {
    right: -350px;
  }
}

.animateOut {
  animation: slideOut 0.5s ease forwards;
}

.close {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  color: var(--upload-progress-textcolor);
}

.uploadL {
  width: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 1rem;
}

.uploadR {
  width: 85%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.title {
  width: 100%;
  height: 28px;
  line-height: 28px;
  font-size: 1.2rem;
  color: var(--upload-progress-textcolor);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.overProgress {
  display: flex;
  justify-content: space-between;
}

.overProgress p {
  font-size: 0.8rem;
  color: var(--upload-progress-textcolor);
}

.bottomLine {
  position: relative;
  width: 100%;
  height: 6px;
  background-color: var(--upload-progressBottom-bgcolor);
  border-radius: 3px;
  margin-top: 4px;
}

.progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 6px;
  border-radius: 3px;
  background: var(--upload-progress-bgcolor);
}

.result {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.result p {
  font-size: calc(1.2rem + 4px);
}

.positive {
  color: var(--positive);
}

.negative {
  color: var(--negative);
}

.neutral {
  color: var(--upload-progress-textcolor);
}
</style>