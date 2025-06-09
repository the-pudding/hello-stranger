<script>
  import Convo from "$components/hellostranger/HelloStranger.convo.svelte";
  import Text from "$components/hellostranger/HelloStranger.text.svelte";
  import Panel from "$components/hellostranger/HelloStranger.panel.svelte";
  import Scrolly from "$components/helpers/Scrolly.svelte";
  import { onMount } from "svelte";
  import { fade } from 'svelte/transition';
  import colors from "$data/colors.json";
  import panelVarTranslation from "$data/panelVarTranslation.json"

  // Props
  let { convos, people, copy } = $props();

  // Core state
  let prefersReducedMotion = $state(false);
  let filteredConvos = $state({});
  let baseSize = $state(60);
  let w = $state(60);
  let h = $state(60);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let peopleContainer;
  let convoState = $state({});
  let peopleState = $state({});
  let value = $state(0);
  let sceneSpeed = $state(0);
  let scrollY = $state(0);
  let isAtTop = $state(true);
  let lastWidth = $state(0);
  let isResizing = $state(false);
  let hasLoaded = $state(false);
  let initialized = $state(false);
  let containerReady = $state(false);

  // Copy-derived state
  let sortCategory = $state(copy.copy[0]?.var);
  let sortMode = $state(copy.copy[0]?.sortMode);
  let zoomPerson = $state(copy.copy[0]?.zoomPerson);
  let personColor = $state(copy.copy[0]?.personColor);
  let quotePerson = $state(copy.copy[0]?.quotePerson);
  let currentText = $state(copy.copy[0]?.text);
  let currentTime = $state(copy.copy[0]?.time);
  let var_to_show = $state(copy.copy[0]?.var_to_show);
  let zoomDisable = $state(copy.copy[0]?.zoomDisable);
  let nextTime = $state(0);

  // Selection state
  let selectedPersonId = $state(null);
  let selectedConvoId = $state(null);
  let quoteState = $state(null);

  // Zoom state
  let zoomContainerData = $state({ x: 0, y: 0, scale: 1 });

  // Constants
  const ZOOM_SPEED = 2;
  const TICK_NUMS = 60;
  const ZOOM_CONVOS = [
    "2f749ec2-aa7b-4a41-8aa1-5bd7a387b90a",
    "0d7fc2a3-37b2-44b8-a60a-c69d6016b65e", 
    "47e11fd0-9ceb-4ffa-ad74-0203e28427b3",
    "22083989-6244-440b-af5b-93a3a10f6e04"
  ];

  const COLOR_ORDERS = {
    politics: ["0", "1", "2", "3", "4", "6"],
    race: ["prefer_not_to_say", "other", "mixed", "native_hawaiian_or_pacific_islander", "american_indian_or_alaska_native", "asian", "black_or_african_american", "hispanic_or_latino", "white"],
    edu: ["some_high_school", "completed_high_school", "some_college", "associate_degree", "bachelors_degree", "masters_degree", "doctoral_degree", "professional_degree"]
  };

  const PANEL_VARS = ["age","sex","race","edu","employ","politics","pre_affect","begin_affect","middle_affect","end_affect"];
  const PANEL_VARS_LABELS = {
    "sex": "Sex",
    "race": "Race", 
    "age": "Age",
    "edu": "Education",
    "employ": "Employment status",
    "politics": "Political views",
    "pre_affect": "Affect before convo",
    "begin_affect": "Affect at beginning",
    "middle_affect": "Affect in middle",
    "end_affect": "Affect at end",
    "my_agreeable": "Agreeable (self-assessed)",
    "my_conscientious": "Conscientious (self-assessed)",
    "my_extraversion": "Extraversion (self-assessed)",
    "my_loneliness": "Loneliness (self-assessed)",
    "my_neurotic": "Neurotic (self-assessed)",
    "my_open": "Open (self-assessed)",
    "sleep_today": "Hours of sleep (today)",
    "sleep_usual": "Hours of sleep (usual)"
  };

  // Generate time range once
  const timeRange = Array.from({ length: 30 * TICK_NUMS + 1 }, (_, i) => i);

  // Wait for container to be ready with valid dimensions
  function waitForContainer() {
    return new Promise((resolve) => {
      const checkContainer = () => {
        if (peopleContainer && peopleContainer.clientWidth > 0 && peopleContainer.clientHeight > 0) {
          resolve();
        } else {
          requestAnimationFrame(checkContainer);
        }
      };
      checkContainer();
    });
  }

  // Calculate base size based on container width
  function calculateBaseSize(width) {
    if (width < 480) return 30;
    if (width < 768) return 40;
    if (width < 1024) return 50;
    if (width < 1440) return 60;
    if (width < 1920) return 70;
    return 80;
  }

  // Initialize container dimensions and base size
  async function initializeContainer() {
    if (!peopleContainer || containerReady) return;

    // Wait for container to have valid dimensions
    await waitForContainer();

    const newWidth = peopleContainer.clientWidth;
    const newHeight = peopleContainer.clientHeight;
    const newBaseSize = calculateBaseSize(newWidth);

    // Set initial values
    chartWidth = newWidth;
    chartHeight = newHeight;
    baseSize = newBaseSize;
    w = h = newBaseSize;
    lastWidth = newWidth;
    containerReady = true;

    // Now that we have valid dimensions, proceed with layout
    updateCategory();
    filterConvos();
    updateConvos();
    updatePeople();
    if (zoomPerson) updateZoom();

    // Mark as loaded
    requestAnimationFrame(() => {
      hasLoaded = true;
      sceneSpeed = ZOOM_SPEED;
    });
  }

  // Memoized layout calculation
  function calculateLayoutParams() {
    const fixedHeight = baseSize;
    const fixedWidth = fixedHeight * 2;
    const outerPadding = { top: 10, right: 60, bottom: 10, left: 5 };
    const availableWidth = chartWidth - outerPadding.left - outerPadding.right;
    const availableHeight = chartHeight - outerPadding.top - outerPadding.bottom;
    const innerPadding = Math.max(3, Math.min(10, (chartWidth * chartHeight) / 40000));
    
    const maxCols = Math.floor((availableWidth + innerPadding) / (fixedWidth + innerPadding));
    const maxRows = Math.floor((availableHeight + innerPadding) / (fixedHeight + innerPadding));
    const maxCells = maxCols * maxRows;
    
    return { 
      maxCols, maxRows, maxCells, innerPadding, outerPadding, 
      fixedWidth, fixedHeight, availableWidth, availableHeight
    };
  }

  function filterConvos() {
    if (!containerReady) return;
    
    w = h = baseSize;
    const { maxCells } = calculateLayoutParams();
    
    const convoEntries = Object.entries(convos);
    const prioritizedConvos = convoEntries.filter(([id]) => ZOOM_CONVOS.includes(id));
    const regularConvos = convoEntries.filter(([id]) => !ZOOM_CONVOS.includes(id));
    
    const availableForRegular = Math.max(0, maxCells - prioritizedConvos.length);
    const selectedConvos = [...prioritizedConvos, ...regularConvos.slice(0, availableForRegular)];
    
    filteredConvos = Object.fromEntries(selectedConvos);
  }

  function updateConvos() {
    if (!containerReady) return;
    
    const { maxCols, innerPadding, outerPadding, fixedWidth, fixedHeight, availableWidth, availableHeight } = calculateLayoutParams();

    const sortedConvos = Object.entries(filteredConvos).sort((a, b) => {
      if (!sortCategory) return a[0].localeCompare(b[0]);
      const aVal = a[1]?.[sortCategory];
      const bVal = b[1]?.[sortCategory];
      if (aVal !== undefined && bVal !== undefined) {
        return typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      }
      return aVal !== undefined ? -1 : bVal !== undefined ? 1 : a[0].localeCompare(b[0]);
    });

    const actualRows = Math.ceil(sortedConvos.length / maxCols);
    const gridWidth = maxCols * fixedWidth + innerPadding * (maxCols - 1);
    const gridHeight = actualRows * fixedHeight + innerPadding * (actualRows - 1);

    const startX = outerPadding.left + (availableWidth - gridWidth) / 2;
    const startY = outerPadding.top + (availableHeight - gridHeight) / 2;

    convoState = Object.fromEntries(sortedConvos.map(([key, value], index) => {
      const col = index % maxCols;
      const row = Math.floor(index / maxCols);
      const x = startX + col * (fixedWidth + innerPadding);
      const y = startY + row * (fixedHeight + innerPadding);
      const personIds = Object.keys(value).filter(k => typeof value[k] === 'object' && k.startsWith('5'));

      return [key, {
        ids: personIds.slice(0, 2),
        x, y, 
        w: fixedWidth, 
        h: fixedHeight,
        speed: value === 0 ? [0, 0] : [Math.random() * 2000 + 2000, Math.random() * 2000 + 2000]
      }];
    }));
  }

  function updatePeople() {
    if (!containerReady) return;
    
    const fixedWidth = baseSize;
    const fixedHeight = baseSize;
    const outerPadding = { top: 5, right: 50, bottom: 5, left: 5 };
    
    // Collect and group person IDs
    const personIdGroups = {};
    if (filteredConvos && Object.keys(filteredConvos).length > 0) {
      Object.values(filteredConvos).forEach(person => {
        if (person) {
          Object.keys(person).forEach(key => {
            if (typeof person[key] === "object" && key[0] === "5") {
              const personId = key.split('-')[0] || key;
              if (!personIdGroups[personId]) personIdGroups[personId] = [];
              personIdGroups[personId].push(key);
            }
          });
        }
      });
    }

    // Sort person IDs using optimized sort
    const sortedPersonIds = Object.keys(personIdGroups).sort((personIdA, personIdB) => {
      const keysA = personIdGroups[personIdA] || [];
      const keysB = personIdGroups[personIdB] || [];

      let keyA = keysA.find(k => people[k]?.[sortCategory] !== undefined) || keysA[0];
      let keyB = keysB.find(k => people[k]?.[sortCategory] !== undefined) || keysB[0];

      if (!keyA || !keyB) return personIdA.localeCompare(personIdB);

      const dataA = people[keyA];
      const dataB = people[keyB];
      if (!dataA || !dataB) return personIdA.localeCompare(personIdB);

      const aVal = dataA[sortCategory] ?? '';
      const bVal = dataB[sortCategory] ?? '';

      // Use custom ordering if available
      if (COLOR_ORDERS[sortCategory]) {
        const aIndex = COLOR_ORDERS[sortCategory].indexOf(aVal);
        const bIndex = COLOR_ORDERS[sortCategory].indexOf(bVal);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
      }

      return typeof aVal === 'string' && typeof bVal === 'string' 
        ? aVal.localeCompare(bVal) 
        : aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });

    // Calculate grid layout
    const availableWidth = chartWidth - (outerPadding.left + outerPadding.right);
    const availableHeight = chartHeight - (outerPadding.top + outerPadding.bottom);
    let innerPadding = Math.max(2, Math.min(8, (chartWidth * chartHeight) / 50000));

    let maxCols = Math.floor((availableWidth + innerPadding) / (fixedWidth + innerPadding));
    const requiredRows = Math.ceil(sortedPersonIds.length / maxCols);
    const initialGridHeight = requiredRows * fixedHeight + (requiredRows - 1) * innerPadding;

    if (initialGridHeight > availableHeight) {
      innerPadding = Math.max(1, innerPadding - 2);
      maxCols = Math.floor((availableWidth + innerPadding) / (fixedWidth + innerPadding));
    }
    maxCols = Math.max(1, maxCols);

    const actualCols = Math.min(maxCols, sortedPersonIds.length);
    const actualRows = Math.ceil(sortedPersonIds.length / actualCols);
    const totalGridWidth = actualCols * fixedWidth + (actualCols - 1) * innerPadding;
    const finalGridHeight = actualRows * fixedHeight + (actualRows - 1) * innerPadding;

    const gridStartX = outerPadding.left + (availableWidth - totalGridWidth) / 2;
    const gridStartY = outerPadding.top + (availableHeight - finalGridHeight) / 2;

    // Create people state
    let updatedPeople = {};
    sortedPersonIds.forEach((personId, index) => {
      const col = index % actualCols;
      const row = Math.floor(index / actualCols);
      const x = gridStartX + col * (fixedWidth + innerPadding);
      const y = gridStartY + row * (fixedHeight + innerPadding);
      const quoteText = quotePerson === personId ? currentText : null;

      personIdGroups[personId].forEach(key => {
        updatedPeople[key] = {
          quoteText, x, y, w: fixedWidth, h: fixedHeight, opacity: 1
        };
      });
    });

    peopleState = updatedPeople;
  }

  function updateCategory() {
    const latestItem = [...copy.copy].reverse().find(item => item.time <= value);
    if (!latestItem) return false;

    const latestIndex = copy.copy.findIndex(item => item === latestItem);
    nextTime = latestIndex > 0 && copy.copy[latestIndex + 1] ? Number(copy.copy[latestIndex + 1].time) : null;
    
    let needsUpdate = false;
    
    // Batch state updates
    const updates = [
      [latestItem?.var, sortCategory, v => sortCategory = v],
      [latestItem?.personColor, personColor, v => personColor = v],
      [latestItem?.sortMode, sortMode, v => sortMode = v],
      [latestItem?.quotePerson, quotePerson, v => quotePerson = v],
      [latestItem?.text, currentText, v => currentText = v],
      [Number(latestItem?.time), currentTime, v => currentTime = v],
      [latestItem?.zoomDisable, zoomDisable, v => zoomDisable = v],
      [latestItem?.var_to_show, var_to_show, v => var_to_show = v]
    ];

    updates.forEach(([newVal, currentVal, setter]) => {
      if (newVal !== currentVal) {
        setter(newVal);
        needsUpdate = true;
      }
    });

    // Handle zoom separately
    if (latestItem?.zoomPerson !== zoomPerson) {
      zoomPerson = latestItem?.zoomPerson;
      updateZoom();
    }
    
    return needsUpdate;
  }

  function updateZoom() {
    if (!containerReady) return;
    
    zoomContainerData = { x: 0, y: 0, scale: 1 };

    let zoomData = null;
    if (sortMode === "person" && zoomPerson && peopleState[zoomPerson] && !zoomDisable) {
      zoomData = peopleState[zoomPerson];
    } else if (zoomPerson && convoState[zoomPerson] && !zoomDisable) {
      zoomData = convoState[zoomPerson];
    }

    if (zoomData && peopleContainer) {
      let scale = 1.5 + (80 - baseSize) / 100;
      if (chartWidth < 1200) {
        scale = 2 + (80 - baseSize) / 100;
      }
      const targetCenterX = zoomData.x + zoomData.w / 2;
      const targetCenterY = zoomData.y + zoomData.h / 2;
      const containerCenterX = peopleContainer.clientWidth / 2;
      const containerCenterY = peopleContainer.clientHeight / 2;

      zoomContainerData = {
        x: containerCenterX - targetCenterX * scale,
        y: containerCenterY - targetCenterY * scale,
        scale
      };
    }
  }

  // Optimized resize handling - only runs after container is ready
  function updateSize() {
    if (!peopleContainer || !containerReady) return;
    
    const newWidth = peopleContainer.clientWidth;
    const newHeight = peopleContainer.clientHeight;
    
    const isInitialLoad = lastWidth === 0;
    const widthChanged = Math.abs(newWidth - lastWidth) > 10;
    
    if (!isInitialLoad && !widthChanged) return;
    
    lastWidth = newWidth;
    
    const targetBaseSize = calculateBaseSize(newWidth);
    
    const needsUpdate = (newWidth !== chartWidth) || 
                       (newHeight !== chartHeight) || 
                       (targetBaseSize !== baseSize);
    
    if (!needsUpdate) return;
    
    isResizing = true;
    chartWidth = newWidth;
    chartHeight = newHeight;
    baseSize = targetBaseSize;
    w = h = targetBaseSize;
    
    if (chartWidth <= 0 || chartHeight <= 0) {
      setTimeout(() => isResizing = false, 300);
      return;
    }
    
    // Batch updates
    setTimeout(() => {
      filterConvos();
      if (sortMode === "person") {
        updatePeople();
        updateConvos();
      } else {
        updateConvos();
        updatePeople(); 
      }
      if (zoomPerson) updateZoom();
      setTimeout(() => isResizing = false, 300);
    }, 50);
  }

  // Utility functions
  function toTitleCase(str) {
    return str ? str.toLowerCase().split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') : '';
  }

  function convertTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}m ${seconds}s`;
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

  function handleQuoteSelection(personId, convoId) {
    if (selectedPersonId === personId) {
      closeQuotePanel();
    } else {
      selectedPersonId = personId;
      selectedConvoId = convoId;
      quoteState = people[personId];
    }
  }

  function closeQuotePanel() {
    quoteState = null;
    selectedPersonId = null;
    selectedConvoId = null;
  }

  function updateScrollPosition() {
    if (typeof window !== 'undefined') {
      scrollY = window.scrollY;
      isAtTop = scrollY < 50;
    }
  }

  // Debounced resize handler - only works after container is ready
  let resizeTimeout;
  function debouncedResize() {
    if (!containerReady) return;
    
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateSize();
      setTimeout(() => {
        const { maxCells } = calculateLayoutParams();
        const currentDisplayed = Object.keys(filteredConvos).length;
        if (currentDisplayed < maxCells && currentDisplayed < Object.keys(convos).length) {
          updateSize();
        }
      }, 300);
    }, 150);
  }

  function setupMobileViewport() {
    if (typeof window === 'undefined') return;
    
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        setViewportHeight();
        if (containerReady) {
          lastWidth = 0;
          setTimeout(updateSize, 300);
        }
      }, 300);
    });
  }

  // Mount lifecycle
  onMount(() => {
    if (initialized) return;
    initialized = true;

    setupMobileViewport();

    // Initialize container when it's ready
    initializeContainer();

    setTimeout(() => {
      const isMobileDevice = window.innerWidth < 768;
      if (!isMobileDevice) {
        window.addEventListener('resize', debouncedResize);
      }
      
      window.addEventListener('scroll', updateScrollPosition);
      updateScrollPosition();

      // Reduced motion handling
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const updatePreference = (e) => {
        prefersReducedMotion = e.matches;
        if (prefersReducedMotion) sceneSpeed = 0;
      };
      
      mediaQuery.addListener(updatePreference);
      prefersReducedMotion = mediaQuery.matches;
      if (prefersReducedMotion) sceneSpeed = 0;

      return () => mediaQuery.removeListener(updatePreference);
    }, 100);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('scroll', updateScrollPosition);
    };
  });

  // Main reactive effect - only runs after container is ready
  $effect(() => {
    if (!hasLoaded || !containerReady) return;

    sceneSpeed = value === 0 ? 0 : ZOOM_SPEED;
    const needsUpdate = updateCategory();

    requestAnimationFrame(() => {
      if (sortMode === "person") {
        updatePeople();
        updateConvos();
      } else {
        updateConvos();
        updatePeople();
      }

      if (zoomPerson) updateZoom();
      if (quoteState !== null) closeQuotePanel();
    });
  });
</script>

<div id="content" class="reducedMotion{prefersReducedMotion}">
  <section id="scrolly">
    <div class="visualContainer" bind:this={peopleContainer} class:zoomed={zoomPerson && !zoomDisable}>
      <div 
        class="zoomContainer {hasLoaded && !isResizing ? 'loaded' : ''}"
        style="transform: translate3d({zoomContainerData.x}px, {zoomContainerData.y}px, 0) scale3d({zoomContainerData.scale}, {zoomContainerData.scale}, 1);
        {hasLoaded && !isResizing ? `transition: transform ${sceneSpeed}s ease-in-out;` : ''}"
      >
        {#if Object.keys(convoState).length && containerReady}
          {#each Object.entries(filteredConvos) as [key, convo] (key)}
            {@const ids = convoState[key]?.ids || []}
            {@const visible = zoomDisable === 1 || !zoomPerson || (sortMode === "person" && ids.includes(zoomPerson)) || (sortMode !== "person" && key === zoomPerson)}
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
              {selectedPersonId}
              {selectedConvoId}
              {w}
              {h}
              {chartWidth}
              {chartHeight}
              {sortCategory}
              {quotePerson}
              {currentTime}
              {nextTime}
              {var_to_show}
              {prefersReducedMotion}
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
          {@const copyData = checkCopy(time)}
          {#if checkCopy(time) == false || checkCopy(time).time==0 || checkCopy(time).time > 1780 || checkCopy(time).quotePerson != null}
            <div class="step time" class:active>
              {convertTime(time)}
            </div>
          {:else}
            <div class="step {copyData.addclass || 'smallText'}" class:active>
              <div class="time">{convertTime(time)}</div>
              <Text copy={copyData.text} time={convertTime(time)} legend={copyData.legend}/>
            </div>
          {/if}
        {/each}
      </Scrolly>
    </div>

    <div class="quotePanel" class:shown={quoteState !== null}>
      <div class="close" on:click={closeQuotePanel}>Close</div>
      {#each PANEL_VARS as attribute}
        <div class="panelVar">
          <div class="panelLabel">{PANEL_VARS_LABELS[attribute]}</div>
          {#if quoteState}
            <div class="panelValue">
              {#if quoteState[attribute] === null || quoteState[attribute] === undefined}
                --
              {:else if attribute in panelVarTranslation && quoteState[attribute] in panelVarTranslation[attribute]}
                {panelVarTranslation[attribute][quoteState[attribute]]}
              {:else if attribute.indexOf("my_") !== -1}
                {panelVarTranslation["likert"][Math.round(quoteState[attribute])]}
              {:else if attribute === 'age'}
                {quoteState[attribute].toFixed(0)} years old
              {:else if attribute.indexOf("affect") !== -1}
                {quoteState[attribute].toFixed(0)} / 10
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
  
  <div class="bottomWords">
    Thanks for reading to the end ◡̈
  </div>
</div>

<style>
  .bottomWords {
    margin: 100px 0;
    text-align: center;
  }
  
  .panelVar {
    display: block;
    width: 100%;
    margin: 5px 0 10px;
  }
  
  .panelLabel {
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 2px;
    display: block;
    width: 100%;
  }
  
  .panelValue {
    font-size: 13px;
    opacity: 0.5;
    display: block;
    width: 100%;
  }

  .headline {
    color: var(--text-color);
    position: absolute;
    bottom: 70%;
    text-align: center;
    left: 0;
    width: 100%;
  }
  
  .headline h1 {
    font-size: 18px;
    color: white;
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
  
  .reducedMotiontrue .zoomContainer {
    transition: none !important;
  }
  
  .quotePanel {
    position: fixed;
    left: -200px;
    top: 0;
    height: 100vh;
    font-size: 13px;
    padding: 20px;
    width: 200px;
    background: var(--panel-bg) !important;
    color: var(--panel-text-color);
    transition: all 200ms cubic-bezier(0.250, 0.100, 0.250, 1.000);
    overflow: hidden;
    scrollbar-color: #000 #000;
  }
  
  .quotePanel.shown {
    left: 0;
  }
  
  .close {
    width: 100%;
    padding: 5px;
    background: var(--button-bg);
    color: var(--button-text-color);
    font-weight: bold;
    text-align: center;
    cursor: pointer;
    margin-bottom: 20px;
    position: sticky;
    top: 10px;
  }
</style>