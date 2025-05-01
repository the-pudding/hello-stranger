<script>
    import Person from "$components/hellostranger/HelloStranger.person.svelte";
    import colors from "$data/colors.json";
    
    let { 
        convo, 
        convoState, 
        visible, 
        p1data, 
        p2data, 
        personColor, 
        sortMode, 
        p1state, 
        p2state, 
        quotes, 
        value,
        convoId,
        onQuoteSelect,
        selectedPersonId,
        selectedConvoId,
        zoomPerson,
        w,
        h,
        chartWidth,
        chartHeight
    } = $props();
    
    // Add null/undefined check for convo
    const affectColumns = ["pre_affect", "begin_affect", "middle_affect", "end_affect"];
    
    // Initialize default values in case convo is undefined
    let p1Key = null;
    let p2Key = null;
    let p1 = {};
    let p2 = {};
    let p1Opacity = 1;
    let p2Opacity = 1;
    // Only try to access convo properties if it exists
    if (convo && typeof convo === 'object') {
        const keys = Object.keys(convo);
        p1Key = keys[0] || null;
        p2Key = keys[1] || null;
        p1 = p1Key ? convo[p1Key] || {} : {};
        p2 = p2Key ? convo[p2Key] || {} : {};
    }
    
    const startNum = 0;
    // Precompute affect differences to avoid recalculations during renders
    const affectDiff = [{
        "pre_affect": startNum,
        "begin_affect": p1.begin_affect - (p1.begin_affect || 0) + startNum,
        "middle_affect": p1.middle_affect - (p1.begin_affect || 0) + startNum,
        "end_affect": p1.end_affect - (p1.begin_affect || 0) + startNum
    },{
        "pre_affect": startNum,
        "begin_affect": p2.begin_affect - (p2.begin_affect || 0) + startNum,
        "middle_affect": p2.middle_affect - (p2.begin_affect || 0) + startNum,
        "end_affect": p2.end_affect - (p2.begin_affect || 0) + startNum
    }];
    
    // Cache color arrays to avoid recreating them on each render
    const defaultColor = "#aaaaaa";
    const affectPositiveColors = ["#d0844e","#e29546","#f0a839","#fabe28","#ffd500","#ffd500","#ffd500","#ffd500","#ffd500","#ffd500"];
    const affectNeutralColor = "#aaaaaa";
    const affectNegativeColors = ["#e54877","#bd3070","#951c66","#6d0b59","#460048","#460048","#460048","#460048","#460048","#460048"];
    
    // Memoized color getter to improve performance
    const colorCache = new Map();
    function getAffectColor(val) {
        // Return from cache if available
        const cacheKey = String(val);
        if (colorCache.has(cacheKey)) {
            return colorCache.get(cacheKey);
        }
        
        let color;
        if (val === 0) {
            color = affectNeutralColor;
        } else if (val < 0) {
            color = affectNegativeColors[Math.min(Math.abs(val), affectNegativeColors.length - 1)];
        } else {
            color = affectPositiveColors[Math.min(Math.abs(val), affectPositiveColors.length - 1)];
        }
        
        // Cache the result
        colorCache.set(cacheKey, color);
        return color;
    }
    
    let quoteText = $state(null);
    let prevValue = $state(value);
    
    // Use derived state to make the selection checks reactive
    let isP1Selected = $derived(selectedPersonId === p1Key && convoId === selectedConvoId);
    let isP2Selected = $derived(selectedPersonId === p2Key && convoId === selectedConvoId);
    
    // Calculate transform values once to avoid repeated string concatenation
    // This reduces layout thrashing during animations
    let p1Transform = $derived(
        `translate3d(${sortMode === 'person' ? p1state?.x || 0 : convoState?.x || 0}px, ` +
        `${sortMode === 'person' ? p1state?.y || 0 : convoState?.y || 0}px, 0)`
    );
    let p2Transform = $derived(
        `translate3d(${sortMode === 'person' ? p2state?.x || 0 : (convoState?.x || 0) + (convoState?.w || 0) / 2}px, ` +
        `${sortMode === 'person' ? p2state?.y || 0 : convoState?.y || 0}px, 0)`
    );

    // Precompute scale values for transforms rather than changing heights

    let p1Scale = $derived(affectColumns.includes(personColor) ? 
        `scaleY(${(p1[personColor] || 0) / 10})` : 
        "scaleY(1)"
    );

    let p2Scale = $derived(affectColumns.includes(personColor) ? 
        `scaleY(${(p2[personColor] || 0) / 10})` : 
        "scaleY(1)"
    );
    
    // Precompute background colors
    let p1BackgroundColor = $derived(
        affectColumns.includes(personColor) ? 
            getAffectColor(affectDiff[0][personColor]) || defaultColor : 
            (colors[personColor] ? colors[personColor][p1data?.[personColor]] : defaultColor) || defaultColor
    );
    
    let p2BackgroundColor = $derived(
        affectColumns.includes(personColor) ? 
            getAffectColor(affectDiff[1][personColor]) || defaultColor : 
            (colors[personColor] ? colors[personColor][p2data?.[personColor]] : defaultColor) || defaultColor
    );
    
    // Watch for changes to value and reset quotes when it changes
    $effect(() => {
        if (value !== prevValue) {
            quoteText = null;
            prevValue = value;
        }
    });
    
    // Function to handle person click - optimized to avoid unnecessary work
  function handlePersonClick(id, key) {
  try {
    console.log("Quotes data:", quotes);
    console.log("Current value:", value);
    
    // Convert value from seconds to minutes
    const minuteIndex = Math.floor(value / 60);
    console.log("Looking for quotes at minute index:", minuteIndex);
    
    // First check if quotes exists
    if (!quotes) {
      console.log("quotes is undefined or null");
      return;
    }
    
    // Check if there are quotes for this minute index
    if (!quotes[minuteIndex]) {
      console.log("No quotes for this minute index:", minuteIndex);
      
      // Try to find the closest available minute index
      const availableIndices = Object.keys(quotes)
        .filter(index => quotes[index] !== null)
        .map(Number);
      
      if (availableIndices.length > 0) {
        const closest = availableIndices.reduce((prev, curr) => 
          Math.abs(curr - minuteIndex) < Math.abs(prev - minuteIndex) ? curr : prev
        );
        console.log("Using closest available minute index:", closest);
        
        // Call the parent callback with the quote text and person info using the closest available index
        if (onQuoteSelect && typeof onQuoteSelect === 'function') {
          const quoteData = {
            quoteText: quotes[closest],
            personId: id,
            convoId: convoId,
            value: value
          };
          console.log("Sending quote data:", quoteData);
          onQuoteSelect(quoteData);
        }
      } else {
        console.log("No valid indices available in the quotes data");
        return;
      }
    } else {
      // We found quotes for this exact minute index
      console.log("Found quotes for this minute index:", quotes[minuteIndex]);
      
      // Call the parent callback with the quote text and person info
      if (onQuoteSelect && typeof onQuoteSelect === 'function') {
        const quoteData = {
          quoteText: quotes[minuteIndex],
          personId: id,
          convoId: convoId,
          value: value
        };
        console.log("Sending quote data:", quoteData);
        onQuoteSelect(quoteData);
      } else {
        console.log("onQuoteSelect is not a function or is undefined");
      }
    }
  } catch (error) {
    console.error('Error in handlePersonClick:', error);
  }
}
    
    // Only render if we have valid data
    const shouldRender = convo && convoState && p1Key && p2Key;
</script>

{#if shouldRender}
    <Person
        personKey={p1Key}
        personData={p1}
        convoState={convoState}
        personState={p1state}
        sortMode={sortMode}
        personColor={personColor}
        backgroundColor={p1BackgroundColor}
        transform={p1Transform}
        scale={p1Scale}
        selected={isP1Selected}
        visible={visible}
        data={p1data}
        onClick={() => handlePersonClick(p1Key, 0)}
        {w}
        {h}
        opacity={p1Opacity}
    />

    <Person
        personKey={p2Key}
        personData={p2}
        convoState={convoState}
        personState={p2state}
        sortMode={sortMode}
        personColor={personColor}
        backgroundColor={p2BackgroundColor}
        transform={p2Transform}
        scale={p2Scale}
        selected={isP2Selected}
        visible={visible}
        data={p2data}
        onClick={() => handlePersonClick(p2Key, 1)}
        {w}
        {h}
        opacity={p2Opacity}
    />
{/if}