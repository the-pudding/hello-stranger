<script>
	import Convo from "$components/hellostranger/HelloStranger.convo.svelte";
	import Text from "$components/hellostranger/HelloStranger.text.svelte";
	import Panel from "$components/hellostranger/HelloStranger.panel.svelte";
	import Scrolly from "$components/helpers/Scrolly.svelte";
	import { onMount } from "svelte";
	import quotes from "$data/nearest_quote.json";
	let { convos, people, copy } = $props();
	let w = $state(40);
	let h = $state(40);
	let grouped = $state([]);
	const totalConvos = Object.keys(convos).length;
	let chartWidth = $state(0);
	let chartHeight = $state(0);
	let peopleContainer;
	let convoState = $state({});
	let peopleState = $state({}); 
	let value = $state(0);
	let newValue = 0;
	let sceneSpeed = $state(0);
	let sortCategory = $state(copy.copy[value].var);
	let sortMode = $state(copy.copy[value].sortMode);
	let zoomPerson = $state(copy.copy[value].zoomPerson);
	let personColor = $state(copy.copy[value].personColor);
	let quoteState = $state([null,null,null,null,null,null]);
	// Track the selected person ID instead of convo
	let selectedPersonId = $state(null);
	let selectedConvoId = $state(null);

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
	  // If there's an active zoom person, update the zoom
		if (zoomPerson) {
			updateZoom();
		}
	}

	// Modify the updateCategory function to call updatePeople before updateZoom
	function updateCategory() {
	    const latestItem = [...copy.copy].reverse().find(item => item.time <= value);

	    const newSortCategory = latestItem?.var ?? null;
	    const newZoomPerson = latestItem?.zoomPerson ?? null;
	    const newPersonColor = latestItem?.personColor ?? null;
	    const newSortMode = latestItem?.sortMode ?? null;

	    // Only update if values are different
	    if (newSortCategory !== sortCategory) sortCategory = newSortCategory;
	    if (newPersonColor !== personColor) personColor = newPersonColor;
	    if (newSortMode !== sortMode) sortMode = newSortMode;

	    // Run updatePeople to ensure positions are updated before zooming
	    updatePeople();

	    // Only update zoom if person changes
	    if (newZoomPerson !== zoomPerson) {
	        zoomPerson = newZoomPerson;
	        updateZoom();
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
	    let sortedConvos = Object.entries(convos).sort((a, b) => {
	        const aVal = a[1][sortCategory];
	        const bVal = b[1][sortCategory];

	        if (aVal < bVal) return -1;
	        if (aVal > bVal) return 1;
	        return 0;
	    });

	    let bestCols = 1;
	    let bestRows = totalConvos;
	    let bestSize = 0;

	    // Initial handling for sortMode == "person"
	    if (sortMode == "person") {
	        bestRows = people.length;
	        
	        // Sort people by sortCategory - but just store the sorted data for now
	        let sortedPeople = Object.entries(people).sort((a, b) => {
	            const aVal = a[1][sortCategory];
	            const bVal = b[1][sortCategory];

	            if (aVal < bVal) return -1;
	            if (aVal > bVal) return 1;
	            return 0;
	        });
	        
	        // We'll position these in a grid after calculating the best layout
	        peopleState = {}; // Reset peopleState to prepare for grid layout
	    }

	    // Calculate best grid layout
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

	    // Setup convoState grid
	    let updated = {};
	    let index = 0;

	    for (const [key, value] of sortedConvos) {
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
	            speed: value === 0 ? [0, 0] : [Math.random() * 2000 + 2000, Math.random() * 2000 + 2000]
	        };

	        index++;
	    }

	    convoState = updated;
	    
	    // If sortMode is person, create a grid layout for peopleState too
	    if (sortMode == "person") {
	        let peopleIndex = 0;
	        let updatedPeople = {};
	        
	        // Sort people by sortCategory
	        let sortedPeopleEntries = Object.entries(people).sort((a, b) => {
	            const aVal = a[1][sortCategory];
	            const bVal = b[1][sortCategory];

	            if (aVal < bVal) return -1;
	            if (aVal > bVal) return 1;
	            return 0;
	        });
	        
	        // Now create a grid layout for people
	        for (const [personId, personData] of sortedPeopleEntries) {
	            const col = peopleIndex % bestCols;
	            const row = Math.floor(peopleIndex / bestCols);

	            const x = startX + col * (bestSize * aspectRatio + innerPadding);
	            const y = startY + row * (bestSize + innerPadding);

	            updatedPeople[personId] = {
	                x,
	                y,
	                w: bestSize * aspectRatio,
	                h: bestSize,
	                speed: [Math.random() * 2000 + 2000, Math.random() * 2000 + 2000]
	            };

	            peopleIndex++;
	        }
	        
	        peopleState = updatedPeople;
	    }
	}

	function updateZoom() {
		let zoomData = null;

		zoomContainerData = {
			x: 0,
			y: 0,
			scale: 1
		};

		for (const key in convoState) {
			const ids = convoState[key].ids;
			const index = ids.indexOf(zoomPerson);
			if (index !== -1) {
				if (index == 0) {
					zoomData = {
						x: convoState[key].x,
						y: convoState[key].y,
						w: convoState[key].w,
						h: convoState[key].h
					};
				} else {
					zoomData = {
						x: convoState[key].x + convoState[key].w,
						y: convoState[key].y,
						w: convoState[key].w,
						h: convoState[key].h
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

			// After scaling, move the target's center to the container's center
			const offsetX = containerCenterX - targetCenterX * scale;
			const offsetY = containerCenterY - targetCenterY * scale;

			zoomContainerData = {
				x: offsetX,
				y: offsetY,
				scale
			};
		}
	}


	function handleQuoteSelection(quoteData) {
		// console.log("Person clicked:", quoteData.personId);
		quoteState = quoteData.quoteText;
		// Update the selected person ID when a person is clicked
		selectedPersonId = quoteData.personId;
		selectedConvoId = quoteData.convoId;
	}

	function closeQuotePanel() {
		quoteState = [null, null, null, null, null, null];
		// Clear the selected person when the quote panel is closed
		selectedPersonId = null;
		selectedConvoId = null;
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
	let initialized = false;

	onMount(() => {
		if (!initialized) {
			initialized = true;
			if (typeof value !== "number") value = 0;
			updateSize();
			updateCategory();
			updatePeople();
			updateZoom();

			requestAnimationFrame(() => {
				hasLoaded = true;
				sceneSpeed = 3;
			});
		}

		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
	});

	// Only run when value changes
	$effect(() => {
		if (typeof value !== "number") {
			value = 0;
		}

	  // Set sceneSpeed to 0 when value is 0
		if (value === 0) {
			sceneSpeed = 0;
		} else if (hasLoaded) {
	    // Only reset to normal speed if we're not at the beginning
			sceneSpeed = 3;
		}

		updateCategory();
	});

	// Separate effect for updatePeople to avoid chain reactions
	$effect(() => {
		if (hasLoaded && value != newValue) {
			updatePeople();
			newValue = value;
			closeQuotePanel();
		}
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

			{#if Object.keys(convoState).length}
			{#each Object.entries(convos) as [key, convo]}
			{@const ids = convoState[key]?.ids || []}
			{@const visible = zoomPerson === null || ids.includes(zoomPerson)}
			<Convo 
				convoId={key} 
				{sortMode} 
				{personColor} 
				{convo} 
				{value} 
				quotes={quotes[key]} 
				convoState={convoState[key]} 
				{zoomPerson} 
				{visible} 
				p1state={peopleState[ids[0]]} 
				p2state={peopleState[ids[1]]} 
				p1data={people[ids[0]]} 
				p2data={people[ids[1]]} 
				onQuoteSelect={handleQuoteSelection}
				selectedPersonId={selectedPersonId}
				selectedConvoId={selectedConvoId}
			/>
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
	<div class="quotePanel" class:shown={quoteState[0] !== null}>
		<div class="close" on:click={closeQuotePanel}>
			Close
		</div>
		<p class="p1">{quoteState[0]}</p>
		<p class="p2">{quoteState[1]}</p>
		<p class="p1">{quoteState[2]}</p>
		<p class="p2">{quoteState[3]}</p>
		<p class="p1">{quoteState[4]}</p>
		<p class="p2">{quoteState[5]}</p>
	</div>
</section>
</div>
<style>
	.timeline {
		position: relative;
		z-index: 100;
/* 		pointer-events: none; */
	}
	.step {
		height: auto;
		padding: 60vh 0;
		margin: 0vh auto;
		text-align: center;
		border-top:1px solid red;
/* 		pointer-events: none; */
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
	.quotePanel {
		position: fixed;
		left: -300px;
		top: 0px;
		height: 100vh;
		font-size: 13px;
		padding: 20px;
		width: 300px;
		background: black;
		color: white;
		transition: all 200ms cubic-bezier(0.250, 0.100, 0.250, 1.000);
		transition-timing-function: cubic-bezier(0.250, 0.100, 0.250, 1.000);
		overflow: scroll;
	}
	.quotePanel.shown {
		left: 0px;
	}
	.quotePanel .p2 {
		color: #aaa;
	}
	.close {
		width: 100%;
		padding: 5px;
		background: purple;
		color:  white;
		font-weight: bold;
		text-align: center;
		cursor: pointer;
	}
</style>