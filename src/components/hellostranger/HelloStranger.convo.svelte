<script>
	let { convo, personState } = $props();
	const [p1Key, p2Key] = Object.keys(convo);
	const p1 = convo[p1Key];
	const p2 = convo[p2Key];
</script>

<div
	class="person p1"
	style="
		height: {personState.h}px;
		width: {personState.w / 2}px;
		transform: translate({personState.x}px, {personState.y}px);
		transition: transform {personState.speed[0]}ms cubic-bezier(0.420, 0.000, 0.580, 1.000);
	"
>
	<div class="beginAffect affect" style="height: {p1.begin_affect * 10}%;">
		{#if p1.begin_affect < p1.end_affect}
			<div
				class="endAffectUp affect"
				style="bottom: 100%; height: {(p1.end_affect - p1.begin_affect) * 10}%;"
			></div>
		{:else}
			<div
				class="endAffectDown affect"
				style="top: 0%; height: {(p1.begin_affect - p1.end_affect) * 10}%;"
			></div>
		{/if}
	</div>
</div>

<div
	class="person p2"
	style="
		height: {personState.h}px;
		width: {personState.w / 2}px;
		transform: translate({personState.x + personState.w / 2}px, {personState.y}px);
		transition: transform {personState.speed[1]}ms cubic-bezier(0.420, 0.000, 0.580, 1.000);
	"
>
	<div class="beginAffect affect" style="height: {p2.begin_affect * 10}%;">
		{#if p2.begin_affect < p2.end_affect}
			<div
				class="endAffectUp affect"
				style="bottom: 100%; height: {(p2.end_affect - p2.begin_affect) * 10}%;"
			></div>
		{:else}
			<div
				class="endAffectDown affect"
				style="top: 0%; height: {(p2.begin_affect - p2.end_affect) * 10}%;"
			></div>
		{/if}
	</div>
</div>

<style>
	.person {
		background: #000;
		display: block;
		position: absolute;
		transform-origin: top left;
		border: 1px solid #000;
	}
	.person.p2 {
		margin-left: -1px;
	}

	.affect {
		position: absolute;
		width: 100%;
		left: 0px;
	}

	.beginAffect {
		background: #555;
		bottom: 0px;
		width: 100%;
		left: 0px;
	}

	.endAffectUp {
		background: #00b9ff;
	}

	.endAffectDown {
		background: #b31095;
	}
</style>
