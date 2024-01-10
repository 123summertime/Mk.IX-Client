<template>
  <div class="inputBoxRoot">
    <div class="bar">
      <el-button type="primary" @click="sending" :disabled="message ? false : true" class="send">发送</el-button>
    </div>
    <textarea v-model=message @keydown="onKeyDown" v-on:paste="pasteImg"></textarea>
  </div>
</template>

<script>
export default {
  props: {
    currGroup: String
  },

  data() {
    return {
      message: "",
    }
  },

  methods: {
    sending() {
      this.$store.state.wsConnections[this.currGroup].send(JSON.stringify({
        "group": this.currGroup,
        "type": "text",
        "payload": this.message,
      }))
      this.message = ""
    },

    onKeyDown(event) {
      if (!this.message) { return }
      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault()
        this.sending()
      }
    },

    pasteImg(event) {
      var items = (event.clipboardData || event.originalEvent.clipboardData).items;

      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          var blob = items[i].getAsFile();
          var reader = new FileReader();
          reader.onload = function (event) {
            var img = new Image();
            img.src = event.target.result;

            img.onload = function () {
              // Create a canvas element
              var canvas = document.createElement('canvas');
              var ctx = canvas.getContext('2d');

              // Set canvas dimensions to the image dimensions
              canvas.width = img.width;
              canvas.height = img.height;

              // Draw the image on the canvas
              ctx.drawImage(img, 0, 0);

              // Convert the canvas content to WebP format
              canvas.toBlob(function (webpBlob) {
                // Convert the WebP blob to Base64
                var readerWebP = new FileReader();
                readerWebP.onload = function (eventWebP) {
                  var base64WebP = eventWebP.target.result;
                  console.log(base64WebP); // Base64 representation of the WebP image
                };
                readerWebP.readAsDataURL(webpBlob);
              }, 'image/webp');
            };
          };

          reader.readAsDataURL(blob);
        }
      }
    }
  }
}
</script>

<style scoped>
.inputBoxRoot {
  display: flex;
  flex-direction: column;
  background-color: lightsalmon;
}

.bar {
  width: 100%;
  height: 36px;
  background-color: brown;
}

textarea {
  width: 100%;
  flex-grow: 1;
  padding: 16px;
  font-size: 1.2rem;
  font-family: Microsoft Yahei;
  resize: none;
  border: none;
  outline: none;
  background-color: transparent;
}

textarea::-webkit-scrollbar {
  display: none;
}
</style>