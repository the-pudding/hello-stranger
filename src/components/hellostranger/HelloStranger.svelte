<script>
import Convo from "$components/hellostranger/HelloStranger.convo.svelte";
import Text from "$components/hellostranger/HelloStranger.text.svelte";
import Panel from "$components/hellostranger/HelloStranger.panel.svelte";
import Scrolly from "$components/helpers/Scrolly.svelte";
import { onMount } from "svelte";
import { fade } from 'svelte/transition';
import colors from "$data/colors.json";
import panelVarTranslation from "$data/panelVarTranslation.json"

let { convos, people, copy } = $props();
let filteredConvos = $state({}); // Initialize as an empty object
let baseSize = $state(60); // Base size that changes with screen size
let w = $state(baseSize);
let h = $state(baseSize);
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
let quotePerson = $state(copy.copy[value].quotePerson);
let currentText = $state(copy.copy[value].text);
let currentTime = $state(copy.copy[value].time);
let var_to_show = $state(copy.copy[value].var_to_show);
let quoteState = $state(null);
let zoomDisable = $state(copy.copy[value].zoomDisable);
// Track the selected person ID instead of convo
let selectedPersonId = $state(null);
let selectedConvoId = $state(null);
let isMobileDevice = false;
const zoomSpeed = 2;

// Add scroll position tracking
let scrollY = $state(0);
let isAtTop = $state(true);
let nextTime = $state(0);

let lastWidth = $state(0);
let isResizing = $state(false);

// Simple scroll position update
function updateScrollPosition() {
  if (typeof window !== 'undefined') {
    scrollY = window.scrollY;
    isAtTop = scrollY < 50;
  }
}

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

// ======== LAYOUT CALCULATION =========
// Pure function to calculate layout parameters
function calculateLayoutParams() {
  const fixedHeight = baseSize; // Use baseSize instead of hardcoded 60
  const fixedWidth = fixedHeight * 2;
  const outerPadding = { top: 5, right: 50, bottom: 5, left: 5 };
  const availableWidth = chartWidth - outerPadding.left - outerPadding.right;
  const availableHeight = chartHeight - outerPadding.top - outerPadding.bottom;
  const innerPadding = Math.max(3, Math.min(10, (chartWidth * chartHeight) / 40000));
  
  // Grid layout calculation
  const maxCols = Math.floor((availableWidth + innerPadding) / (fixedWidth + innerPadding));
  const maxRows = Math.floor((availableHeight + innerPadding) / (fixedHeight + innerPadding));
  const maxCells = maxCols * maxRows;
  
  return { 
    maxCols, 
    maxRows, 
    maxCells, 
    innerPadding, 
    outerPadding, 
    fixedWidth, 
    fixedHeight,
    availableWidth,
    availableHeight
  };
}

function filterConvos() {
  // Special conversations to prioritize
  const zoomConvos = [
    "2f749ec2-aa7b-4a41-8aa1-5bd7a387b90a",
    "0d7fc2a3-37b2-44b8-a60a-c69d6016b65e",
    "47e11fd0-9ceb-4ffa-ad74-0203e28427b3",
    "22083989-6244-440b-af5b-93a3a10f6e04"
  ];

  // Set dimensions based on current baseSize
  w = baseSize;
  h = baseSize;
  
  // Rest of the function remains the same...
  const layoutParams = calculateLayoutParams();
  const { maxCells } = layoutParams;
  
  const convoEntries = Object.entries(convos);
  const prioritizedConvos = convoEntries.filter(([id]) => zoomConvos.includes(id));
  const regularConvos = convoEntries.filter(([id]) => !zoomConvos.includes(id));
  
  const availableForRegular = Math.max(0, maxCells - prioritizedConvos.length);
  const selectedRegularConvos = regularConvos.slice(0, availableForRegular);
  
  const selectedConvos = [...prioritizedConvos, ...selectedRegularConvos];
  
  filteredConvos = Object.fromEntries(selectedConvos);
  totalConvos = selectedConvos.length;
  
  return layoutParams;
}

// ======== CONVERSATION LAYOUT =========
// Position conversations on the grid
function updateConvos() {
  
  // Get layout parameters without filtering again
  const layoutParams = calculateLayoutParams();
  const { maxCols, innerPadding, outerPadding, fixedWidth, fixedHeight, availableWidth, availableHeight } = layoutParams;

  // Sort the filtered conversations
  const sortedConvos = Object.entries(filteredConvos).sort((a, b) => {
    if (!sortCategory) return a[0].localeCompare(b[0]);

    const aVal = a[1]?.[sortCategory];
    const bVal = b[1]?.[sortCategory];
    if (aVal !== undefined && bVal !== undefined) {
      return (typeof aVal === 'string')
        ? aVal.localeCompare(bVal)
        : aVal - bVal;
    }
    return aVal !== undefined ? -1 : bVal !== undefined ? 1 : a[0].localeCompare(b[0]);
  });

  // Calculate grid dimensions
  const actualRows = Math.ceil(sortedConvos.length / maxCols);
  const gridWidth = maxCols * fixedWidth + innerPadding * (maxCols - 1);
  const gridHeight = actualRows * fixedHeight + innerPadding * (actualRows - 1);

  // Center the grid in the available space
  const startX = outerPadding.left + (availableWidth - gridWidth) / 2;
  const startY = outerPadding.top + (availableHeight - gridHeight) / 2;

  // Build convoState
  convoState = Object.fromEntries(sortedConvos.map(([key, value], index) => {
    const col = index % maxCols;
    const row = Math.floor(index / maxCols);
    const x = startX + col * (fixedWidth + innerPadding);
    const y = startY + row * (fixedHeight + innerPadding);

    const personIds = Object.keys(value).filter(k => typeof value[k] === 'object' && k.startsWith('5'));

    return [key, {
      ids: personIds.slice(0, 2),
      x,
      y,
      w: fixedWidth,
      h: fixedHeight,
      speed: value === 0 ? [0, 0] : [Math.random() * 2000 + 2000, Math.random() * 2000 + 2000]
    }];
  }));
 
}

function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Update the category function to ensure sortMode and sortCategory are in sync
function updateCategory() {
  const latestItem = [...copy.copy].reverse().find(item => item.time <= value);
  const latestIndex = copy.copy.findIndex(item => item === latestItem);
  nextTime = latestIndex > 0 && copy.copy[latestIndex + 1] ? Number(copy.copy[latestIndex + 1].time) : null;
  
  const newSortCategory = latestItem?.var ?? null;
  const newZoomPerson = latestItem?.zoomPerson ?? null;
  const newPersonColor = latestItem?.personColor ?? null;
  const newSortMode = latestItem?.sortMode ?? null;
  const newQuotePerson = latestItem?.quotePerson ?? null;
  const newCurrentText = latestItem?.text ?? null;
  const newZoomDisable = latestItem?.zoomDisable ?? null;
  const newCurrentTime = Number(latestItem?.time) ?? null;
  const newvar_to_show = latestItem?.var_to_show ?? null;
  // Only update if values are different
  let needsUpdate = false;
  
  if (newSortCategory !== sortCategory) {
    sortCategory = newSortCategory;
    needsUpdate = true;
  }
  
  if (newPersonColor !== personColor) {
    personColor = newPersonColor;
    needsUpdate = true;
  }
  
  if (newSortMode !== sortMode) {
    sortMode = newSortMode;
    needsUpdate = true;
  }

  if (newQuotePerson !== quotePerson) {
    quotePerson = newQuotePerson;
    needsUpdate = true;
  }

  if (newCurrentText !== currentText) {
    currentText = newCurrentText;
    needsUpdate = true;
  }

  if (newCurrentTime !== currentTime) {
    currentTime = newCurrentTime;
    needsUpdate = true;
  }

  // Only update zoom if person changes
  if (newZoomPerson !== zoomPerson) {
    zoomPerson = newZoomPerson;
    updateZoom();
  }

  if (newZoomDisable !== zoomDisable) {
    zoomDisable = newZoomDisable;
  }

  if (newvar_to_show !== var_to_show) {
    var_to_show = newvar_to_show;
  }
  
  // Return whether the category update requires a layout update
  return needsUpdate;
}

// Fixed updatePeople function to properly respect sortMode and sortCategory
function updatePeople() {
  // Use baseSize instead of hardcoded values
  const fixedWidth = baseSize;
  const fixedHeight = baseSize;
  
  // Rest of the function remains mostly the same...
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

  // Define color orders from colors.json for custom sorting
  const colorOrders = {
    politics: ["0", "1", "2", "3", "4", "6"], // Order from colors.json
    race: ["prefer_not_to_say", "other", "mixed", "native_hawaiian_or_pacific_islander", "american_indian_or_alaska_native", "asian", "black_or_african_american", "hispanic_or_latino", "white"],
    edu: ["some_high_school", "completed_high_school", "some_college", "associate_degree", "bachelors_degree", "masters_degree", "doctoral_degree", "professional_degree"]
  };

  // Sort personIds by sortCategory - improved sorting logic with custom ordering
  const sortedPersonIds = Object.keys(personIdGroups).sort((personIdA, personIdB) => {
    // Get representative keys for each personId
    const keysA = personIdGroups[personIdA] || [];
    const keysB = personIdGroups[personIdB] || [];

    // Find the first key that has valid sortCategory data
    let keyA = null;
    for (const k of keysA) {
      if (people[k] && people[k][sortCategory] !== undefined) {
        keyA = k;
        break;
      }
    }

    let keyB = null;
    for (const k of keysB) {
      if (people[k] && people[k][sortCategory] !== undefined) {
        keyB = k;
        break;
      }
    }

    // Fall back to first key if no key with sortCategory was found
    keyA = keyA || (keysA.length > 0 ? keysA[0] : null);
    keyB = keyB || (keysB.length > 0 ? keysB[0] : null);

    // If either key is null, sort alphabetically by personId
    if (!keyA || !keyB) {
      return personIdA.localeCompare(personIdB);
    }

    // Get the sort values from people object
    const dataA = people[keyA];
    const dataB = people[keyB];

    if (!dataA || !dataB) {
      return personIdA.localeCompare(personIdB);
    }

    const aVal = dataA[sortCategory] !== undefined ? dataA[sortCategory] : '';
    const bVal = dataB[sortCategory] !== undefined ? dataB[sortCategory] : '';

    // Use custom ordering for specific categories if available
    if (colorOrders[sortCategory]) {
      const aIndex = colorOrders[sortCategory].indexOf(aVal);
      const bIndex = colorOrders[sortCategory].indexOf(bVal);

      // If both values are found in the color order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one value is found, prioritize the one in the order
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
    }

    // Fall back to default sorting if no custom order or values not found
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal);
    } else {
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    }
  });

  // Start with adaptive inner padding based on available space
  let innerPadding = Math.max(2, Math.min(8, (chartWidth * chartHeight) / 50000));

  // Calculate available space for the grid
  const availableWidth = chartWidth - (outerPadding.left + outerPadding.right);
  const availableHeight = chartHeight - (outerPadding.top + outerPadding.bottom);

  // Calculate how many columns would fit in the available width
  const maxPossibleCols = Math.floor((availableWidth + innerPadding) / (fixedWidth + innerPadding));

  // Calculate required rows based on total personIds and columns
  const requiredRows = Math.ceil(uniquePersonIdCount / maxPossibleCols);

  // Calculate initial grid height with these rows
  const initialGridHeight = requiredRows * fixedHeight + (requiredRows - 1) * innerPadding;

  // Determine final maxCols value
  let maxCols = maxPossibleCols;

  // Check if the grid height fits the available height
  if (initialGridHeight > availableHeight) {
    // Grid is too tall, need to adjust
    // Reduce innerPadding if possible
    innerPadding = Math.max(1, innerPadding - 2);

    // Recalculate with new padding
    const adjustedMaxCols = Math.floor((availableWidth + innerPadding) / (fixedWidth + innerPadding));

    // Use the adjusted values
    maxCols = adjustedMaxCols;
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
    const quoteText = quotePerson == personId ? currentText : null;
    // Apply this position to all people with this personId
    const keysForThisPersonId = personIdGroups[personId] || [];
    keysForThisPersonId.forEach(key => {
      updatedPeople[key] = {
        quoteText: quoteText,
        x,
        y,
        w: fixedWidth,
        h: fixedHeight,
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

  // Reset zoom data
  zoomContainerData = {
    x: 0,
    y: 0,
    scale: 1
  };

  // Find the element to zoom to based on sortMode and zoomPerson
  if (sortMode == "person" && zoomPerson && peopleState[zoomPerson] && zoomDisable == null) {
    zoomData = {
      x: peopleState[zoomPerson].x,
      y: peopleState[zoomPerson].y,
      w: peopleState[zoomPerson].w,
      h: peopleState[zoomPerson].h
    };
  } else if (zoomPerson && convoState[zoomPerson] && zoomDisable == null) {
    zoomData = {
      x: convoState[zoomPerson].x,
      y: convoState[zoomPerson].y,
      w: convoState[zoomPerson].w,
      h: convoState[zoomPerson].h
    };
  }

  // Only apply zoom if we have valid zoom data and container
  if (zoomData != null && peopleContainer) {
    const scale = 1.5 + (60 - baseSize) / 100;

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

function updateSize() {
  if (!peopleContainer) return;
  
  const newWidth = peopleContainer.clientWidth;
  const newHeight = peopleContainer.clientHeight;
  
  // Check if this is an initial load or a real width change
  const isInitialLoad = lastWidth === 0;
  const widthChanged = Math.abs(newWidth - lastWidth) > 10; // 10px threshold
  
  // Skip if:
  // 1. Not initial load AND
  // 2. Width hasn't changed (likely just address bar show/hide)
  if (!isInitialLoad && !widthChanged) {
    return;
  }
  
  // Store the last width for comparison
  lastWidth = newWidth;
  
  // Calculate target base size based on screen width
  let targetBaseSize;
  if (newWidth < 480) {
    targetBaseSize = 30; // Very small screens
  } else if (newWidth < 768) {
    targetBaseSize = 40; // Mobile screens
  } else if (newWidth < 1024) {
    targetBaseSize = 50; // Tablets
  } else {
    targetBaseSize = 60; // Desktop and larger
  }
  
  // Check if we need to update
  const needsUpdate = (newWidth !== chartWidth) || 
                     (newHeight !== chartHeight) || 
                     (targetBaseSize !== baseSize);
  
  if (!needsUpdate) {
    return;
  }
  
  // Set resizing flag to prevent animations during resize
  isResizing = true;
  
  // Update dimensions
  chartWidth = newWidth;
  chartHeight = newHeight;
  baseSize = targetBaseSize;
  w = targetBaseSize;
  h = targetBaseSize;
  
  // Only proceed if we have valid dimensions and component is loaded
  if (chartWidth <= 0 || chartHeight <= 0 || !hasLoaded) {
    // Clear resizing flag even if we exit early
    if (hasLoaded) {
      setTimeout(() => { isResizing = false; }, 300);
    }
    return;
  }
  
  // Force a complete refresh cycle
  const oldFilteredConvos = {...filteredConvos};
  filteredConvos = {};
  
  // Force a DOM update cycle
  setTimeout(() => {
    // Refilter with the original data and reset all layout
    filterConvos();
    
    // Update all layouts in the correct order
    if (sortMode === "person") {
      updatePeople();
      updateConvos();
    } else {
      updateConvos();
      updatePeople(); 
    }
    
    if (zoomPerson) {
      updateZoom();
    }
    
    // Clear resizing flag after a delay
    setTimeout(() => {
      isResizing = false;
    }, 300);
  }, 50);
}

function handleOrientationChange() {
  // Force lastWidth to reset so updateSize will run
  lastWidth = 0;
  // Call updateSize after a delay to let the browser settle
  setTimeout(() => {
    updateSize();
  }, 300);
}

// Better debounced resize handler
let resizeTimeout;
function debouncedResize() {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  resizeTimeout = setTimeout(() => {
    updateSize();
    
    setTimeout(() => {
      const layoutParams = calculateLayoutParams();
      const { maxCells } = layoutParams;
      const currentDisplayed = Object.keys(filteredConvos).length;
      
      if (currentDisplayed < maxCells && currentDisplayed < Object.keys(convos).length) {
        updateSize();
      }
    }, 300);
  }, 150);
}

// Simplified viewport handling
function setupMobileViewport() {
  if (typeof window === 'undefined') return;
  
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  // Set on load
  setViewportHeight();
  
  // Update only on orientation change (not on every resize)
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 300);
    handleOrientationChange();
  });
}

function handleQuoteSelection(personId, convoId) {
  selectedPersonId = personId;
  selectedConvoId = convoId;
  quoteState = people[personId];
}

function closeQuotePanel() {
  quoteState = null;
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
  return minutes + "m " + seconds +"s";
}

function setupResizeHandlers() {
  isMobileDevice = window.innerWidth < 768;
  window.removeEventListener('resize', debouncedResize);
  if (!isMobileDevice) {
    window.addEventListener('resize', debouncedResize);
  }
}

let hasLoaded = $state(false);
let initialized = $state(false);

// Modified onMount to use the setup function
onMount(() => {
  if (!initialized) {
    initialized = true;

    // Set up mobile viewport handling
    setupMobileViewport();

    // Initial setup
    if (peopleContainer) {
      chartWidth = peopleContainer.clientWidth;
      chartHeight = peopleContainer.clientHeight;
      
      // IMPORTANT: Set initial baseSize based on screen width BEFORE filtering
      if (chartWidth < 480) {
        baseSize = 30;
      } else if (chartWidth < 768) {
        baseSize = 40;
      } else if (chartWidth < 1024) {
        baseSize = 50;
      } else {
        baseSize = 60;
      }
      
      // Set w and h to match baseSize
      w = baseSize;
      h = baseSize;
      
      lastWidth = chartWidth; // Initialize lastWidth

      // First update category
      updateCategory();

      // Then filter and update layouts WITH CORRECT baseSize
      filterConvos();
      updateConvos();
      updatePeople();

      if (zoomPerson) {
        updateZoom();
      }
    }

    // Set loaded flag
    requestAnimationFrame(() => {
      hasLoaded = true;
      sceneSpeed = zoomSpeed;
    });

    // Set up event handlers with a slight delay to ensure DOM is ready
    setTimeout(() => {
      setupResizeHandlers();
      
      // Add scroll listener
      window.addEventListener('scroll', updateScrollPosition);
      updateScrollPosition();
    }, 100);
  }
  
  return () => {
    // Only remove if it was added
    if (!isMobileDevice) {
      window.removeEventListener('resize', debouncedResize);
    }
    window.removeEventListener('scroll', updateScrollPosition);
    window.removeEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 300);
      handleOrientationChange();
    });
  };
});

// Main effect to handle value changes and update the visualization accordingly
$effect(() => {
  if (hasLoaded) {
    // Update scene speed first (affects animation transition)
    sceneSpeed = value === 0 ? 0 : zoomSpeed;

    // Update categorical data and check if we need layout updates
    const needsUpdate = updateCategory();

    // Use requestAnimationFrame to batch visual updates
    requestAnimationFrame(() => {
      // Select the proper update sequence based on sortMode
      if (sortMode === "person") {
        // For person mode, first update people positions, then position convos accordingly
        updatePeople();
        updateConvos();
      } else {
        // For non-person modes, first update convo positions, then position people accordingly
        updateConvos();
        updatePeople();
      }

      // Finally update zoom if needed
      if (zoomPerson) {
        updateZoom();
      }

      // Close panel if needed
      if (quoteState !== null) {
        closeQuotePanel();
      }
    });
  }
});

const panelVars = ["age","sex","race","edu","employ","politics"]; //"my_agreeable","my_conscientious","my_extraversion","my_loneliness","my_neurotic","my_open","sleep_today","sleep_usual"];
const panelVarsLabels = {
  "sex": "Sex",
  "race": "Race",
  "age": "Age",
  "edu": "Education",
  "employ": "Employment status",
  "politics": "Political views",
  "my_agreeable": "Agreeable (self-assessed)",
  "my_conscientious": "Conscientious (self-assessed)",
  "my_extraversion": "Extraversion (self-assessed)",
  "my_loneliness": "Loneliness (self-assessed)",
  "my_neurotic": "Neurotic (self-assessed)",
  "my_open": "Open (self-assessed)",
  "sleep_today": "Hours of sleep (today)",
  "sleep_usual": "Hours of sleep (usual)"
};

</script>

<!-- <div class="debug">{sortCategory} // {personColor} // {value}</div> -->
<div id="content">
	<section id="scrolly">
		<div class="visualContainer" bind:this={peopleContainer} class:zoomed={zoomPerson && zoomDisable == null}>
			<div 
        class="zoomContainer {hasLoaded && !isResizing ? 'loaded' : ''}"
        style="transform: translate3d({zoomContainerData.x}px, {zoomContainerData.y}px, 0) scale3d({zoomContainerData.scale}, {zoomContainerData.scale}, 1);
        {hasLoaded && !isResizing ? `transition: transform ${sceneSpeed}s ease-in-out;` : ''}"
      >
			  {#if Object.keys(convoState).length}
			    {#each Object.entries(filteredConvos) as [key, convo] (key)} <!-- Add keyed iteration -->
			      {@const ids = convoState[key]?.ids || []}
			      {@const visible = (zoomDisable == 1) || (zoomPerson === null) || (sortMode == "person" && ids.includes(zoomPerson)) || (sortMode != "person" && key == zoomPerson)}
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
			        {sortCategory}
              {quotePerson}
              {currentTime}
              {nextTime}
              {var_to_show}
			      />
			    {/each}
			  {/if}
			</div>
		{#if isAtTop}
		<div class="headline" transition:fade>
			<h1>30 minutes with a stranger</h1>
			<div class="byline">by <a href="https://pudding.cool/author/alvin-chang/">alvin chang</a></div>
		</div>
		{/if}
	</div>

	<div class="timeline">
		<Scrolly increments={1} linePosition={0.9} showLine={false} bind:value>
			{#each timeRange as time, i}
			{@const active = value === i}
			{#if checkCopy(time) == false || checkCopy(time).time==0 || checkCopy(time).time > 1760 || checkCopy(time).quotePerson != null}
			<div class="step time" class:active>
				{convertTime(time)}
			</div>
			{:else}
			<div class="step {checkCopy(time).addclass ? checkCopy(time).addclass : 'smallText'}" class:active>
				<div class="time">{convertTime(time)}</div>
				<Text copy={checkCopy(time).text} time={convertTime(time)} legend={checkCopy(time).legend}/>
			</div>
			{/if}
			{/each}
		</Scrolly>
	</div>
	<div class="quotePanel" class:shown={quoteState !== null}>
		<div class="close" on:click={closeQuotePanel}>
			Close
		</div>
		{#each panelVars as attribute}
		<div class="panelVar">
			<div class="panelLabel">{panelVarsLabels[attribute]}</div>
			{#if quoteState != null}
			<div class="panelValue">
			  {#if quoteState[attribute] === null || quoteState[attribute] === undefined}
			    --
			  {:else if attribute in panelVarTranslation && quoteState[attribute] in panelVarTranslation[attribute]}
			    {panelVarTranslation[attribute][quoteState[attribute]]}
			  {:else if attribute.indexOf("my_") != -1}
			  	{panelVarTranslation["likert"][Math.round(quoteState[attribute])]}
			  {:else if attribute === 'age'}
			  	{quoteState[attribute].toFixed(0)} years old
			  {:else if typeof quoteState[attribute] === 'number'}
			    {quoteState[attribute].toFixed(2)}
			  {:else if typeof quoteState[attribute] === 'string'}
			    {toTitleCase(quoteState[attribute])}
			  {:else}
			    {quoteState[attribute]}
			  {/if}
			</div>
			{/if}
		</div>
		{/each}
	</div>
</section>
</div>
<style>
	.panelVar {
		display:  block;
		width: 100%;
		margin: 5px 0 10px;
	}
	.panelLabel {
		font-size: 13px;
		font-weight: bold;
		margin-bottom: 2px;
	}
	.panelLabel, .panelValue {
		display: block;
		width: 100%;
	}
	.panelValue {
		font-size: 13px;
		opacity: 0.5;
	}

	.debug {
		position: fixed;
		left:  0;
		top: 0;
	}
	.headline {
		color: var(--text-color);
		position: absolute;
		bottom: 70%;
		text-align: center;
		left: 0%;
		width: 100%;
	}
	.headline h1 {
		font-size: 18px;
    color: white;
    /* font-weight: bold; */
	}
	.timeline {
  position: relative;
  z-index: 100;
  pointer-events: none;
  padding-bottom: 500px;
  transform: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
	}
	
	.zoomContainer {
		width: 100%;
		height: 100vh;
		transform-origin: top left;
		backface-visibility: hidden;
		perspective: 1000px;
	}
  .zoomContainer:not(.loaded) {
    transition: none !important;
  }
	.zoomContainer.loaded {
    will-change: transform;
		transition: transform var(--speed, 1s) ease-in-out;
	}
	.quotePanel {
		position: fixed;
		left: -200px;
		top: 0px;
		height: 100vh;
		font-size: 13px;
		padding: 20px;
		width: 200px;
		background: var(--panel-bg) !important;
		color: var(--panel-text-color);
		transition: all 200ms cubic-bezier(0.250, 0.100, 0.250, 1.000);
		transition-timing-function: cubic-bezier(0.250, 0.100, 0.250, 1.000);
		overflow: hidden;
    scrollbar-color: #000 #000;
	}
	.quotePanel.shown {
		left: 0px;
	}
	.close {
		width: 100%;
		padding: 5px;
		background: var(--button-bg);
		color:  var(--button-text-color);
		font-weight: bold;
		text-align: center;
		cursor: pointer;
		margin-bottom: 20px;
		position: sticky;
		top: 10px;
	}
</style>