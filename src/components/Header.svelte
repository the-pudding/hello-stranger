<script>
	// shadow, plain, line, bubble
	import wordmark from "$svg/wordmark-sticker.svg";
</script>

<header>
	<div class="wordmark">
		<a href="https://pudding.cool" aria-label="The Pudding" target="_self"
			>{@html wordmark}</a
		>
	</div>
</header>

<style>
	header {
/* 		background-image:  url('assets/app/grain.png'); */
		background-size: 200px 200px;
		background: var(--bgcolor);
	}
	.wordmark {
		max-width: 14em;
		margin: 0 auto;
		padding: 32px 0;
		transform: rotate(-4deg);
		transform: rotate(var(--left-tilt, -2deg));
    	transition: transform calc(var(--1s) * 0.25);
	}

	.wordmark a {
		border: none;
		display: block;
		color: var(--color-fg);
	}

	.wordmark:hover {
		background-color: transparent;
		transform: rotate(0deg) scale(1.05);
	}
</style>
