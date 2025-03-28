<script>
	let {person, personState} = $props();
	let conversations = Object.keys(person);
	let currentConversation = person[conversations[0]];
</script>

<div class="person" style="height:{personState.h}px; width:{personState.w}px; left: {personState.x}px; top: {personState.y}px;">
	
	<div class="beginAffect affect" style="height: {currentConversation.begin_affect*10}%;">
		{#if currentConversation.begin_affect < currentConversation.end_affect}
			<div class="endAffectUp affect" style="bottom: 100%; height: {(currentConversation.end_affect - currentConversation.begin_affect )*10}%;"></div>
		{:else}
			<div class="endAffectDown affect" style="top: 0%; height: {(currentConversation.begin_affect - currentConversation.end_affect)*10}%;"></div>
		{/if}
	</div>
</div>

<style>
	.person {
		background: #555;
		display:  block;
		position: absolute;
		transition: all 2000ms cubic-bezier(0.420, 0.000, 0.580, 1.000); /* ease-in-out */
		transition-timing-function: cubic-bezier(0.420, 0.000, 0.580, 1.000); /* ease-in-out */
	}
	.affect {
		position: absolute;
		width:  100%;
		left: 0px;
	}
	.beginAffect {
		background:  #730066;
		bottom: 0px;
	}
	.endAffectUp {
		background:  #00b9ff;
	}
	.endAffectDown {
		background:  #b31095;
	}
</style>