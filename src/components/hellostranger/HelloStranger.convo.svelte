<script>
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
        selectedConvoId
    } = $props();
    
    // Add null/undefined check for convo
    const affectColumns = ["pre_affect", "begin_affect", "middle_affect", "end_affect"];
    
    // Initialize default values in case convo is undefined
    let p1Key = null;
    let p2Key = null;
    let p1 = {};
    let p2 = {};
    
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
            getAffectColor(affectDiff[0][personColor]) || '#aaa' : 
            (colors[personColor] ? colors[personColor][p1data?.[personColor]] : '#000') || '#000'
    );
    
    let p2BackgroundColor = $derived(
        affectColumns.includes(personColor) ? 
            getAffectColor(affectDiff[1][personColor]) || '#aaa' : 
            (colors[personColor] ? colors[personColor][p2data?.[personColor]] : '#000') || '#000'
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
            // Only process if we have quotes data
            if (!quotes || !quotes[String(value)]) {
                return;
            }
            
            // Call the parent callback with the quote text and person info
            if (onQuoteSelect && typeof onQuoteSelect === 'function') {
                onQuoteSelect({
                    quoteText: quotes[String(value)],
                    personId: id,
                    convoId: convoId,
                    value: value
                });
            }
        } catch (error) {
            console.error('Error in handlePersonClick:', error);
        }
    }
    
    // Only render if we have valid data
    const shouldRender = convo && convoState && p1Key && p2Key;
</script>

{#if shouldRender}
<div
class="person p1"
class:fadeOut={!visible}
class:selected={isP1Selected}
style="
height: {convoState.h}px;
width: {convoState.w / 2}px;
transform: {p1Transform};
"
on:click={() => handlePersonClick(p1Key, 0)}
>
    <div class="backgroundColor" 
    style:background={p1BackgroundColor}
    style:transform={p1Scale}
    ></div>
</div>

<div
class="person p2"
class:fadeOut={!visible}
class:selected={isP2Selected}
style="
height: {convoState.h}px;
width: {convoState.w / 2}px;
transform: {p2Transform};
"
on:click={() => handlePersonClick(p2Key, 1)}
>
    <div class="backgroundColor" 
    style:background={p2BackgroundColor}
    style:transform={p2Scale}
    ></div>
</div>
{/if}

<style>
    .person {
        background: #000;
        display: block;
        position: absolute;
        transform-origin: top left;
        border: 1px solid #000;
        font-size: 2px;
        color: white;
        opacity: 1;
        transition: transform 2000ms cubic-bezier(0.420, 0.000, 0.580, 1.000), opacity 0.5s ease-in-out;
        cursor: pointer;
        /* Hardware acceleration optimizations */
        will-change: transform, opacity;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
    }
    
    .person.selected {
        z-index: 10;
        border: 3px solid #ff6600; /* Bright orange border */
        box-shadow: 0 0 10px rgba(255, 102, 0, 0.7); /* Optional glow effect */
    }
    
    .backgroundColor {
        position: absolute;
        left: 0px;
        bottom: 0px;
        width: 100%;
        height: 100%;
        transform-origin: bottom;
        transition: transform 1.5s ease-in-out, background 1.5s ease-in-out;
        will-change: transform, background;
    }
    
    .fadeOut {
        opacity: 0;
        pointer-events: none;
    }
    
    /* Minimize repaints and reflows when elements change state */
    .person:not(.fadeOut):hover {
        z-index: 5;
        filter: brightness(1.2);
        transition: transform 1000ms cubic-bezier(0.420, 0.000, 0.580, 1.000), 
                  opacity 0.5s ease-in-out, 
                  filter 0.3s ease;
    }
</style>