<script>
	import Convo from "$components/hellostranger/HelloStranger.convo.svelte";
	import Text from "$components/hellostranger/HelloStranger.text.svelte";
	import Scrolly from "$components/helpers/Scrolly.svelte";
	import { onMount } from "svelte";
	let { convos, people, copy } = $props();
	let w = $state(40);
	let h = $state(40);
	let grouped = $state([]);
	const totalConvos = Object.keys(convos).length;
	let chartWidth = $state(0);
	let chartHeight = $state(0);
	let peopleContainer;
	let peopleState = $state({});
	let value = $state(0);
	let sceneSpeed = $state(0);
	let sortCategory = $state(copy.copy[value].var);
	let zoomPerson = $state(copy.copy[value].zoomPerson);
	let personColor = $state(copy.copy[value].personColor);

	let timeRange = [];
	let zoomContainerData = $state({
		x: 0,
		y: 0,
		scale: 1
	});

	for (let i = 0; i <= 30; i++) {
		timeRange.push(i);
	}

	function updateSize() {
		if (peopleContainer) {
			chartWidth = peopleContainer.clientWidth;
			chartHeight = peopleContainer.clientHeight;
		}
		updatePeople();
	}

	function updateCategory() {

		let newSortCategory = null;
		let newZoomPerson = null;
		let newPersonColor = null;

		for (let i = 0; i < copy.copy.length; i++) {
			const item = copy.copy[i];
			if (item.time <= value) {
				newSortCategory = item.var;
				newZoomPerson = item.zoomPerson;
				newPersonColor = item.personColor;
			}
		}

		newSortCategory = newSortCategory ?? null;
		newZoomPerson = newZoomPerson ?? null;
		newPersonColor = newPersonColor ?? null;

		if (newSortCategory !== sortCategory) {
			sortCategory = newSortCategory;
		}

		if (newZoomPerson !== zoomPerson) {
			zoomPerson = newZoomPerson;
			updateZoom();
		}
		if (newPersonColor != personColor) {
			personColor = newPersonColor;
		}
	}



	function updatePeople() {
		const innerPadding = Math.max(3, Math.min(10, (w * h) / 400));
		const outerPadding = {
			top: 5,
			right: 50,
			bottom: 5,
			left: 5
		};
		const aspectRatio = 2; // Width is double the height

		// Sort convos by sortCategory
		const sortedEntries = Object.entries(convos).sort((a, b) => {
			const aVal = a[1][sortCategory];
			const bVal = b[1][sortCategory];

			if (aVal < bVal) return -1;
			if (aVal > bVal) return 1;
			return 0;
		});

		let bestCols = 1;
		let bestRows = totalConvos;
		let bestSize = 0;

		for (let cols = 1; cols <= totalConvos; cols++) {
			const rows = Math.ceil(totalConvos / cols);
			const totalInnerWidth = innerPadding * (cols - 1);
			const totalInnerHeight = innerPadding * (rows - 1);

			const maxHeight = (chartHeight - outerPadding.top - outerPadding.bottom - totalInnerHeight) / rows;
			const maxWidth = (chartWidth - outerPadding.left - outerPadding.right - totalInnerWidth) / (cols * aspectRatio);

			const size = Math.floor(Math.min(maxHeight, maxWidth));

			if (size > bestSize) {
				bestSize = size;
				bestCols = cols;
				bestRows = rows;
			}
		}

		const totalGridWidth = bestCols * (bestSize * aspectRatio) + innerPadding * (bestCols - 1);
		const totalGridHeight = bestRows * bestSize + innerPadding * (bestRows - 1);

		const startX = outerPadding.left + (chartWidth - outerPadding.left - outerPadding.right - totalGridWidth) / 2;
		const startY = outerPadding.top + (chartHeight - outerPadding.top - outerPadding.bottom - totalGridHeight) / 2;

		let updated = {};
		let index = 0;

		for (const [key, value] of sortedEntries) {
			const col = index % bestCols;
			const row = Math.floor(index / bestCols);

			const x = startX + col * (bestSize * aspectRatio + innerPadding);
			const y = startY + row * (bestSize + innerPadding);

			updated[key] = {
				ids: Object.keys(value).slice(0, 2),
				x,
				y,
				w: bestSize * aspectRatio,
				h: bestSize,
				speed: [Math.random() * 2000 + 2000, Math.random() * 2000 + 2000]
			};

			index++;
		}

		peopleState = updated;
	}

	function updateZoom() {
		let zoomData = null;

		zoomContainerData = {
			x: 0,
			y: 0,
			scale: 1
		};

		for (const key in peopleState) {
			const ids = peopleState[key].ids;
			const index = ids.indexOf(zoomPerson);
			if (index !== -1) {
				if (index == 0) {
					zoomData = {
						x: peopleState[key].x,
						y: peopleState[key].y,
						w: peopleState[key].w,
						h: peopleState[key].h
					};
				} else {
					zoomData = {
						x: peopleState[key].x + peopleState[key].w,
						y: peopleState[key].y,
						w: peopleState[key].w,
						h: peopleState[key].h
					};
				}
				break;
			}
		}

		if (zoomData != null && peopleContainer) {
			const scale = 10;

			const targetCenterX = zoomData.x + zoomData.w / 2;
			const targetCenterY = zoomData.y + zoomData.h / 2;

			const containerCenterX = peopleContainer.clientWidth / 2;
			const containerCenterY = peopleContainer.clientHeight / 2;

			// After scaling, move the target’s center to the container’s center
			const offsetX = containerCenterX - targetCenterX * scale;
			const offsetY = containerCenterY - targetCenterY * scale;

			zoomContainerData = {
				x: offsetX,
				y: offsetY,
				scale
			};

			// Re-render elements at the new size
			for (const key in peopleState) {
				peopleState[key].w *= scale;
				peopleState[key].h *= scale;
			}
		}
	}



	function checkCopy(time) {
		let final = false;
		for (let k = 0; k < copy.copy.length; k++) {
			if (copy.copy[k].time == time) {
				final = copy.copy[k];
			}
		}
		return final;
	}

	function convertTime(time) {
		if (time < 10) {
			return "0:0" + time;
		}
		return "0:" + time;
	}

	let hasLoaded = $state(false);
	onMount(() => {
		if (typeof value !== "number") {
			value = 0;
		}
		updateSize();
		updateCategory();
		updatePeople();
		updateZoom();
		requestAnimationFrame(() => {
			hasLoaded = true;
			sceneSpeed = 3;
		});
		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
	});

	$effect(() => {
		if (typeof value !== "number") {
			value = 0;
		}
		updateCategory();
		updatePeople();
	});

</script>
<div id="content">
	<section id="scrolly">

		<div class="visualContainer" bind:this={peopleContainer}>
			<div
			class="zoomContainer {hasLoaded ? 'loaded' : ''}"
			style="transform: translate3d({zoomContainerData.x}px, {zoomContainerData.y}px, 0) scale3d({zoomContainerData.scale}, {zoomContainerData.scale}, 1);
			{hasLoaded ? `transition: transform ${sceneSpeed}s ease-in-out;` : ''}"
			>

			{#if Object.keys(peopleState).length}
			{#each Object.entries(convos) as [key, convo]}
			{@const ids = peopleState[key]?.ids || []}
			{@const visible = zoomPerson === null || ids.includes(zoomPerson)}
			<Convo {personColor} {convo} personState={peopleState[key]} {zoomPerson} {visible} p1data={people[ids[0]]} p2data={people[ids[1]]}/>
			{/each}
			{/if}
		</div>
	</div>
	<div class="timeline">
		<Scrolly bind:value top={0}>
			{#each timeRange as time, i}
			{@const active = value === i}
			{#if checkCopy(time) == false}
			<div class="step time" class:active>
				{convertTime(time)}
			</div>
			{:else}
			<div class="step {checkCopy(time).addclass ? checkCopy(time).addclass : 'smallText'}" class:active>
				<div class="time">{convertTime(time)}</div>
				<Text copy={checkCopy(time).text} time={convertTime(time)} />
			</div>
			{/if}
			{/each}
		</Scrolly>
	</div>
</section>
</div>
<style>
	.timeline {
		position: relative;
		z-index: 100;
		pointer-events: none;
	}
	.step {
		height: 120vh;
		margin: 0vh auto;
		text-align: center;
		border-top:1px solid red;
		pointer-events: none;
	}
	.step:last-child {
		padding-bottom: 80px;
		margin-bottom: 0px;
	}
	.time {
		width: calc(100% - 5px);
		text-align: right;
		margin-right: 5px;
	}
	.step p {
		padding: 1rem;
	}
	.zoomContainer {
		width: 100%;
		height: 100vh;
		transform-origin: top left;
		backface-visibility: hidden;
		perspective: 1000px;
	}
	.zoomContainer.loaded {
		transition: transform var(--speed, 3s) ease-in-out;
	}
</style>
