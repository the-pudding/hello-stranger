<script>
	import Convo from "$components/hellostranger/HelloStranger.convo.svelte";
	import Text from "$components/hellostranger/HelloStranger.text.svelte";
	import Panel from "$components/hellostranger/HelloStranger.panel.svelte";
	import Scrolly from "$components/helpers/Scrolly.svelte";
	import { onMount } from "svelte";
	import quotes from "$data/nearest_quote.json";
	let { convos, people, copy } = $props();
	let filteredConvos = $state({}); // Initialize as an empty object
	let w = $state(60);  // Fixed width
	let h = $state(60);  // Fixed height
	let grouped = $state([]);
	let totalConvos = Object.keys(convos).length;
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

	// Add a debounced resize handler instead of an effect
	let resizeTimeout;
	function debouncedResize() {
	    // Clear any existing timeout
	    if (resizeTimeout) {
	        clearTimeout(resizeTimeout);
	    }
	    
	    // Set a new timeout to execute after 100ms of no resize events
	    resizeTimeout = setTimeout(() => {
	        if (chartWidth > 0 && chartHeight > 0 && hasLoaded) {
	            // Recalculate the number of items to display based on new dimensions
	            filterConvos();
	            updateConvos();
	            updatePeople();
	            
	            if (zoomPerson) {
	                updateZoom();
	            }
	        }
	    }, 100);
	}

	function filterConvos() {
		// This function now primarily updates w and h values 
		// The actual filtering happens in updateConvos based on fixed cell size
		
		// Set w and h to your fixed values
		w = 60;  // Fixed width
		h = 60;  // Fixed height
		
		// Return true to indicate that we should proceed with updates
		return true;
	}

	function updateSize() {
		if (peopleContainer) {
			const newWidth = peopleContainer.clientWidth;
			const newHeight = peopleContainer.clientHeight;
			
			if (newWidth !== chartWidth || newHeight !== chartHeight) {
				chartWidth = newWidth;
				chartHeight = newHeight;
				
				// Force immediate recalculation
				filterConvos(); // This now just updates w and h values
				
				// Completely reset states to force re-rendering
				convoState = {};
				peopleState = {};
				
				// Then rebuild - update the people first, then convos
				setTimeout(() => {
					updateConvos(); // This now filters based on fixed size
					updatePeople();
					if (zoomPerson) updateZoom();
				}, 0);
			}
		}
	}

	// Modify the updateCategory function
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

	    // We don't need to call updatePeople here as it's now called after updateConvos
	    // in the effect that watches value changes

	    // Only update zoom if person changes
		if (newZoomPerson !== zoomPerson) {
			zoomPerson = newZoomPerson;
			updateZoom();
		}
	}

	function updateConvos() {
		// Fixed size for each convo cell
		const fixedHeight = 60; // Fixed height
		const fixedWidth = fixedHeight * 2; // Width is double the height (aspect ratio of 2)
		
		// Make inner padding responsive to available space
		let innerPadding = Math.max(3, Math.min(10, (chartWidth * chartHeight) / 40000));
		
		// Reduce outer padding to utilize more space
		const outerPadding = {
			top: 5,
			right: 50,
			bottom: 5,
			left: 5
		};
		
		// Sort convos by sortCategory
		let sortedConvos = Object.entries(convos).sort((a, b) => {
			// Check if sortCategory exists in the object first
			const aVal = a[1][sortCategory] !== undefined ? a[1][sortCategory] : '';
			const bVal = b[1][sortCategory] !== undefined ? b[1][sortCategory] : '';

			// Handle different data types appropriately
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return aVal.localeCompare(bVal);
			} else {
				// For numbers or other comparable types
				if (aVal < bVal) return -1;
				if (aVal > bVal) return 1;
				return 0;
			}
		});
		
		// Calculate how many cells we can fit with the fixed size
		const availableWidth = chartWidth - outerPadding.left - outerPadding.right;
		const availableHeight = chartHeight - outerPadding.top - outerPadding.bottom;
		
		// Number of columns that can fit
		const maxCols = Math.floor((availableWidth + innerPadding) / (fixedWidth + innerPadding));
		
		// Number of rows that can fit
		const maxRows = Math.floor((availableHeight + innerPadding) / (fixedHeight + innerPadding));
		
		// Total number of cells that can fit
		const maxCells = maxCols * maxRows;
		
		// Limit the number of convos to display
		const displayCount = Math.min(sortedConvos.length, maxCells);
		
		// Update totalConvos for other functions that might use this value
		totalConvos = displayCount;
		
		// Limit the sorted convos to just those we'll display
		sortedConvos = sortedConvos.slice(0, displayCount);
		
		// Create filteredConvos from the sorted and limited entries
		filteredConvos = Object.fromEntries(sortedConvos);
		
		// Calculate grid dimensions
		const totalGridWidth = maxCols * fixedWidth + innerPadding * (maxCols - 1);
		const actualRows = Math.ceil(displayCount / maxCols);
		const totalGridHeight = actualRows * fixedHeight + innerPadding * (actualRows - 1);
		
		// Calculate starting position to center the grid
		const startX = outerPadding.left + (availableWidth - totalGridWidth) / 2;
		const startY = outerPadding.top + (availableHeight - totalGridHeight) / 2;
		
		// Setup convoState grid
		let updated = {};
		let index = 0;
		
		for (const [key, value] of sortedConvos) {
			const col = index % maxCols;
			const row = Math.floor(index / maxCols);

			const x = startX + col * (fixedWidth + innerPadding);
			const y = startY + row * (fixedHeight + innerPadding);

			updated[key] = {
				ids: Object.keys(value).slice(0, 2),
				x,
				y,
				w: fixedWidth,
				h: fixedHeight,
				speed: value === 0 ? [0, 0] : [Math.random() * 2000 + 2000, Math.random() * 2000 + 2000]
			};

			index++;
		}

		convoState = updated;
	}

	function updatePeople() {
		// Fixed size for each person cell
		const fixedWidth = 60;  // Fixed width
		const fixedHeight = 60; // Fixed height
		const aspectRatio = fixedWidth / fixedHeight;
		
		// Make inner padding responsive to available space
		let innerPadding = Math.max(2, Math.min(8, (chartWidth * chartHeight) / 50000));
		
		// Reduce outer padding to utilize more space
		const outerPadding = {
			top: 3,
			right: 50,
			bottom: 10,
			left: 3
		};
		
		// Reset peopleState to prepare for grid layout
		peopleState = {}; 
		
		// Step 1: Get all unique keys from the objects inside filteredConvos
		const uniqueKeys = new Set();

		// Check if filteredConvos exists and has values before trying to iterate
		if (filteredConvos && Object.keys(filteredConvos).length > 0) {
			Object.values(filteredConvos).forEach(person => {
				if (person) { // Add additional check to ensure person is defined
					Object.keys(person).forEach(key => {
						if (typeof person[key] === "object" && !uniqueKeys.has(key) && key[0] == "5") {
							uniqueKeys.add(key);    
						}
					});
				}
			});
		}
		
		// Step 2: Filter the people object to keep only entries 
		// where all keys from uniqueKeys exist
		let result = {};
		uniqueKeys.forEach(item => {
			result[item] = people[item];
		});

		let filteredPeople = result;
		
		// Fix: Properly sort people by sortCategory
		let sortedPeopleEntries = Object.entries(filteredPeople).sort((a, b) => {
			// Get the values, make sure they exist and have the sortCategory property
			const aVal = a[1] && a[1][sortCategory] !== undefined ? a[1][sortCategory] : '';
			const bVal = b[1] && b[1][sortCategory] !== undefined ? b[1][sortCategory] : '';

			// Handle different data types appropriately
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return aVal.localeCompare(bVal);
			} else {
				// For numbers or other comparable types
				if (aVal < bVal) return -1;
				if (aVal > bVal) return 1;
				return 0;
			}
		});
		
		// Calculate how many cells we can fit with the fixed size
		const availableWidth = chartWidth - outerPadding.left - outerPadding.right;
		const availableHeight = chartHeight - outerPadding.top - outerPadding.bottom;
		
		// Number of columns that can fit
		const maxCols = Math.floor((availableWidth + innerPadding) / (fixedWidth + innerPadding));
		
		// Number of rows that can fit
		const maxRows = Math.floor((availableHeight + innerPadding) / (fixedHeight + innerPadding));
		
		// Total number of cells that can fit
		const maxCells = maxCols * maxRows;
		
		// Limit the number of people to display
		const displayCount = Math.min(sortedPeopleEntries.length, maxCells);
		
		// Limit the sorted people entries to just those we'll display
		sortedPeopleEntries = sortedPeopleEntries.slice(0, displayCount);
		
		// Calculate grid dimensions
		const totalGridWidth = maxCols * fixedWidth + innerPadding * (maxCols - 1);
		const actualRows = Math.ceil(displayCount / maxCols);
		const totalGridHeight = actualRows * fixedHeight + innerPadding * (actualRows - 1);
		
		// Calculate starting position to center the grid
		const startX = outerPadding.left + (availableWidth - totalGridWidth) / 2;
		const startY = outerPadding.top + (availableHeight - totalGridHeight) / 2;
		
		// Create grid layout for people
		let updatedPeople = {};
		let peopleIndex = 0;
		
		// Position each person in the grid
		for (const [personId, personData] of sortedPeopleEntries) {
			const col = peopleIndex % maxCols;
			const row = Math.floor(peopleIndex / maxCols);

			const x = startX + col * (fixedWidth + innerPadding);
			const y = startY + row * (fixedHeight + innerPadding);

			updatedPeople[personId] = {
				x,
				y,
				w: fixedWidth,
				h: fixedHeight,
				speed: [Math.random() * 2000 + 2000, Math.random() * 2000 + 2000]
			};

			peopleIndex++;
		}
		
		peopleState = updatedPeople;
	}

	function countUniqueInnerKeys(objectOfObjects) {
	  // Create a Set to track unique keys
		const uniqueKeys = new Set();

	  // Iterate through each object in the parent object
		Object.values(objectOfObjects).forEach(innerObject => {
	    // For each inner object, add its keys to our Set
			Object.keys(innerObject).forEach(key => {
				uniqueKeys.add(key);
			});
		});

	  // Return the size of the Set (number of unique keys)
		return uniqueKeys.size;
	}

	function updateZoom() {
		let zoomData = null;

		zoomContainerData = {
			x: 0,
			y: 0,
			scale: 1
		};

		if (sortMode == "person" && zoomPerson) {
			zoomData = {
				x: peopleState[zoomPerson].x,
				y: peopleState[zoomPerson].y,
				w: peopleState[zoomPerson].w,
				h: peopleState[zoomPerson].h
			};
		} else if (zoomPerson) {
			zoomData = {
				x: convoState[zoomPerson].x,
				y: convoState[zoomPerson].y,
				w: convoState[zoomPerson].w,
				h: convoState[zoomPerson].h
			};
		}

		if (zoomData != null && peopleContainer) {
			const scale = 5;

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

	// Modify onMount to initially set up the component without relying on reactive updates
	onMount(() => {
		if (!initialized) {
			initialized = true;
			if (typeof value !== "number") value = 0;
			
			// For initial setup, directly set values and call update functions
			if (peopleContainer) {
				chartWidth = peopleContainer.clientWidth;
				chartHeight = peopleContainer.clientHeight;
				
				// Initial setup - make sure we have proper order of operations
				// First filter and create the filteredConvos
				filterConvos();
				updateConvos();
				// Then update people using the filtered convos
				updatePeople();
				// Finally set category and handle zoom if needed
				updateCategory();
				
				if (zoomPerson) {
					updateZoom();
				}
			}
			
			// Set loaded flag after initial setup
			requestAnimationFrame(() => {
				hasLoaded = true;
				sceneSpeed = 3;
			});
		}

		// Use the debounced version for resize events
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
			updateConvos();
			newValue = value;
			closeQuotePanel();
		}
	});

	$effect(() => {
	    // Track window size changes for responsive updates
	    const checkSize = () => {
	        updateSize();
	    };
	    
	    if (typeof window !== 'undefined') {
	        window.addEventListener('resize', checkSize);
	        
	        // Ensure initial size is set
	        setTimeout(checkSize, 100);
	        
	        return () => window.removeEventListener('resize', checkSize);
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
			{#each Object.entries(filteredConvos) as [key, convo]}
			{@const ids = convoState[key]?.ids || []}
			{@const visible = zoomPerson === null || (sortMode == "person" && ids.includes(zoomPerson)) || (sortMode != "person" && key == zoomPerson)}
			<Convo 
			convoId={key} 
			{sortMode} 
			{personColor} 
			convo={filteredConvos[key]}
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
		pointer-events: none;
	}
	.step {
		height: auto;
		padding: 60vh 0;
		margin: 0vh auto;
		text-align: center;
/* 		border-top:1px solid red; */
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