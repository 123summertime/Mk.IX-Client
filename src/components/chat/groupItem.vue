<template>
	<div class="main">
		<img :src="'data:image/png;base64,' + avatar" class="avatar">
		<div>
			{{ name }}
		</div>
	</div>
</template>

<script>
export default {
	props: {
		avatar: String,
		name: String,
	},
	data() {
		return {

		}
	}
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