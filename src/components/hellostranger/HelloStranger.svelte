<script>
	import Person from "$components/hellostranger/HelloStranger.person.svelte";
	import { onMount } from "svelte";
	let { convos, people, copy } = $props();
	let w = $state(40);
	let h = $state(40);
	let grouped = $state([]);
	const totalPeople = Object.keys(people).length;

	let chartWidth = $state(0);
	let chartHeight = $state(0);
	let peopleContainer;
	let peopleState = $state({});
	let sortCategory = $state("begin_affect");

	function updateSize() {
		if (peopleContainer) {
			chartWidth = peopleContainer.clientWidth;
			chartHeight = peopleContainer.clientHeight;
		}
		updatePeople();
	}

	function updatePeople() {
		const innerPadding = w*h/600;
		const outerPadding = 10;

		// Sort people by sortCategory
		const sortedEntries = Object.entries(people).sort((a, b) => {
			const keys = {"a": Object.keys(a[1])[0], "b": Object.keys(b[1])[0] };
			const aVal = a[1][keys.a][sortCategory];
			const bVal = b[1][keys.b][sortCategory];

			// Handles strings and numbers
			if (aVal < bVal) return -1;
			if (aVal > bVal) return 1;
			return 0;
		});
		let bestCols = 1;
		let bestRows = totalPeople;
		let bestSize = 0;

		for (let cols = 1; cols <= totalPeople; cols++) {
			const rows = Math.ceil(totalPeople / cols);
			const totalInnerWidth = innerPadding * (cols - 1);
			const totalInnerHeight = innerPadding * (rows - 1);

			const maxWidth = (chartWidth - 2 * outerPadding - totalInnerWidth) / cols;
			const maxHeight = (chartHeight - 2 * outerPadding - totalInnerHeight) / rows;

			const size = Math.floor(Math.min(maxWidth, maxHeight));

			if (size > bestSize) {
				bestSize = size;
				bestCols = cols;
				bestRows = rows;
			}
		}

		const totalGridWidth = bestCols * bestSize + innerPadding * (bestCols - 1);
		const totalGridHeight = bestRows * bestSize + innerPadding * (bestRows - 1);

		const startX = (chartWidth - totalGridWidth) / 2;
		const startY = (chartHeight - totalGridHeight) / 2;

		let updated = {};
		let index = 0;

		for (const [key, value] of sortedEntries) {
			const col = index % bestCols;
			const row = Math.floor(index / bestCols);

			const x = startX + col * (bestSize + innerPadding);
			const y = startY + row * (bestSize + innerPadding);

			updated[key] = {
				x,
				y,
				w: bestSize,
				h: bestSize
			};

			index++;
		}

		peopleState = updated;
	}

	function clicked() {
		sortCategory = "age";
		updatePeople();
	}


	onMount(() => {
		updateSize();
		updatePeople();
		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
	});

	$effect(() => {
		
	});
</script>

<div class="peopleContainer" bind:this={peopleContainer}>
	{#if Object.keys(peopleState).length}
	{#each Object.entries(people) as [key, person]}
	<Person {person} personState={peopleState[key]} />
	{/each}
	{/if}
</div>
<div class="button" on:click={clicked}>button</div>

<style>
	.peopleContainer {
		position: relative;
		width: 100%;
		height: 100vh;
		background: #222;
	}
	.button {
		position: fixed;
		left: 10px;
		background: white;
		padding: 2px;
		cursor: pointer;
		top:  10px;
	}
</style>
