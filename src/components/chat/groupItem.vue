<template>
	<div class="main">
		<img :src="'data:image/png;base64,' + avatar" class="avatar">
		<div>{{ lastMessage }}</div>
		<div>
			{{ name }}
		</div>
	</div>
</template>

<script>
export default {
	props: {
		avatar: String,
		group: String,
		name: String,
	},

	data() {
		return {
			lastMessage: "base",
		}
	},

	computed: {
		newMessage() {
			return this.$store.state[this.group]
		}
	},

	watch: {
		newMessage: {
			handler(newVal) {
				const message = JSON.parse(newVal)
				this.lastMessage = message["payload"]
			}
		}
	},

}
</script>

<style scoped>
.main {
	display: flex;
	justify-content: space-between;
}

.avatar {
	border-radius: 50%;
}
</style>