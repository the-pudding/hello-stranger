<script>
	import Convo from "$components/hellostranger/HelloStranger.convo.svelte";
	import Text from "$components/hellostranger/HelloStranger.text.svelte";
	import Panel from "$components/hellostranger/HelloStranger.panel.svelte";
	import Scrolly from "$components/helpers/Scrolly.svelte";
	import { onMount } from "svelte";
	import { fade } from 'svelte/transition';;
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
	const tickNums = 60;
	let zoomContainerData = $state({
		x: 0,
		y: 0,
		scale: 1
	});

	for (let i = 0; i <= 30 * tickNums; i++) {
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
				filterConvos();

	      // Use requestAnimationFrame for better performance
				requestAnimationFrame(() => {
					updateConvos();
					updatePeople();
					if (zoomPerson) updateZoom();
				});
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
    
    // Define outer padding structure like in updateConvos
    const outerPadding = {
    	top: 5,
    	right: 50,
    	bottom: 5,
    	left: 5
    };
    
    // Calculate how many personIds we need to display
    const uniqueKeys = new Set();
    const personIdGroups = {};
    
    // Collect all keys and group by personId
    if (filteredConvos && Object.keys(filteredConvos).length > 0) {
    	Object.values(filteredConvos).forEach(person => {
    		if (person) {
    			Object.keys(person).forEach(key => {
    				if (typeof person[key] === "object" && key[0] === "5") {
    					uniqueKeys.add(key);

                        // Extract personId from key
    					const personId = key.split('-')[0] || key;

    					if (!personIdGroups[personId]) {
    						personIdGroups[personId] = [];
    					}
    					personIdGroups[personId].push(key);
    				}
    			});
    		}
    	});
    }
    
    // Count unique personIds
    const uniquePersonIdCount = Object.keys(personIdGroups).length;

    // Sort personIds by sortCategory
    const sortedPersonIds = Object.keys(personIdGroups).sort((personIdA, personIdB) => {
        // Get representative keys for each personId
    	const keyA = personIdGroups[personIdA][0];
    	const keyB = personIdGroups[personIdB][0];

        // Get the sort values
    	const dataA = people[keyA];
    	const dataB = people[keyB];

    	const aVal = dataA && dataA[sortCategory] !== undefined ? dataA[sortCategory] : '';
    	const bVal = dataB && dataB[sortCategory] !== undefined ? dataB[sortCategory] : '';

        // Handle different data types
    	if (typeof aVal === 'string' && typeof bVal === 'string') {
    		return aVal.localeCompare(bVal);
    	} else {
    		if (aVal < bVal) return -1;
    		if (aVal > bVal) return 1;
    		return 0;
    	}
    });
    
    // Calculate optimal grid dimensions based on the container size and number of personIds
    // Start with adaptive inner padding based on available space
    let innerPadding = Math.max(2, Math.min(8, (chartWidth * chartHeight) / 50000));
    
    // Calculate minimum required outer padding
    const minOuterPadding = 10;
    
    // Calculate available space for the grid
    const availableWidth = chartWidth - (outerPadding.left + outerPadding.right);
    const availableHeight = chartHeight - (outerPadding.top + outerPadding.bottom);
    
    // Try to find an optimal grid layout
    // Calculate how many columns would fit in the available width
    const maxPossibleCols = Math.floor((availableWidth + innerPadding) / (fixedWidth + innerPadding));
    
    // Calculate required rows based on total personIds and columns
    const requiredRows = Math.ceil(uniquePersonIdCount / maxPossibleCols);
    
    // Calculate initial grid height with these rows
    const initialGridHeight = requiredRows * fixedHeight + (requiredRows - 1) * innerPadding;
    
    // Declare variables that will be assigned in conditional blocks
    let maxCols;
    
    // Check if the grid height fits the available height
    if (initialGridHeight > availableHeight) {
        // Grid is too tall, need to adjust
        // Reduce innerPadding if possible
    	innerPadding = Math.max(1, innerPadding - 2);

        // Recalculate with new padding
    	const adjustedMaxCols = Math.floor((availableWidth + innerPadding) / (fixedWidth + innerPadding));
    	const adjustedRows = Math.ceil(uniquePersonIdCount / adjustedMaxCols);

        // Use the adjusted values - FIXED: Using assignment instead of redeclaration
    	maxCols = adjustedMaxCols;
        // Update requiredRows with new value
    	let localRequiredRows = adjustedRows;
    } else {
        // Grid fits, use original calculations - FIXED: Using assignment
    	maxCols = maxPossibleCols;
    }
    
    // Ensure we have at least 1 column
    maxCols = Math.max(1, maxCols);
    
    // Calculate final grid dimensions
    const actualCols = Math.min(maxCols, uniquePersonIdCount);
    const actualRows = Math.ceil(uniquePersonIdCount / actualCols);
    
    
    // Calculate total grid width and height
    const totalGridWidth = actualCols * fixedWidth + (actualCols - 1) * innerPadding;
    const finalGridHeight = actualRows * fixedHeight + (actualRows - 1) * innerPadding;
    
    // Calculate grid dimensions for positioning
    const gridStartX = outerPadding.left + (availableWidth - totalGridWidth) / 2;
    const gridStartY = outerPadding.top + (availableHeight - finalGridHeight) / 2;
    
    // Create grid layout for people
    let updatedPeople = {};
    
    // Position each personId in the grid
    sortedPersonIds.forEach((personId, index) => {
        // Calculate exact grid position
    	const col = index % actualCols;
    	const row = Math.floor(index / actualCols);

        // Calculate exact pixel position
    	const x = gridStartX + col * (fixedWidth + innerPadding);
    	const y = gridStartY + row * (fixedHeight + innerPadding);

        // Apply this position to all people with this personId
    	const keysForThisPersonId = personIdGroups[personId] || [];
    	keysForThisPersonId.forEach(key => {
    		updatedPeople[key] = {
    			x,
    			y,
    			w: fixedWidth,
    			h: fixedHeight,
    			speed: [Math.random() * 2000 + 2000, Math.random() * 2000 + 2000],
                opacity: 1 // Fully visible
            };
        });
    });
    
    // Set peopleState to the updated layout
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
		const scale = 1.5;

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
	console.log(quoteData)
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
	  // Calculate minutes and seconds
	const minutes = Math.floor(time / 60);
	const seconds = Math.floor(time % 60);

	  // Format minutes and seconds without padStart
	const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
	const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;

	  // Return in MM:SS format
	return formattedMinutes + ":" + formattedSeconds;
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
	if (hasLoaded) {
	    // Immediately check value type and set if needed
		if (typeof value !== "number") {
			value = 0;
		}

	    // Update scene speed first (affects animation transition)
		sceneSpeed = value === 0 ? 0 : 3;

	    // Update categorical data
		updateCategory();

	    // Use requestAnimationFrame to batch visual updates
	    // This prevents multiple reflows and repaints
		requestAnimationFrame(() => {
			updateConvos();
			updatePeople();

	      // Only close panel if needed
			if (quoteState[0] !== null) {
				closeQuotePanel();
			}
		});
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
<!-- <div class="debug">{value}</div> -->
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
			{w}
			{h}
			{chartWidth}
			{chartHeight}
			/>
			{/each}
			{/if}
		</div>
		{#if value == 0}
		<div class="headline" transition:fade>
			<h1>hello, stranger</h1>
			<div class="byline">by <a href="https://pudding.cool/author/alvin-chang/">alvin chang</a></div>
		</div>
		{/if}
	</div>
	
	<div class="timeline">
		<Scrolly bind:value top={chartHeight/2.1}>
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
	.debug {
		position: fixed;
		left:  0;
		top: 0;
	}
	.headline {
		color: black;
		position: absolute;
		bottom: 70%;
		text-align: center;
		left: 0%;
		width: 100%;
	}
	.headline h1 {
		font-size: 17px;
	}
	.timeline {
		position: relative;
		z-index: 100;
		pointer-events: none;
	}
	.step {
		height: 20px;
		padding: 0;
		margin: 0vh auto;
		text-align: center;
		pointer-events: none;
/* 		border-top: 1px solid red; */
}
.step.active {
	font-weight: bold;
	font-size: 15px;
}
.step:last-child {
	padding-bottom: 80px;
	margin-bottom: 0px;
}
.step.tick {
	padding: 0;
	text-align: right;
	width: 100%;
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