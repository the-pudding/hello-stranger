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
    chartHeight,
    sortCategory
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
    "begin_affect": p1.begin_affect - (p1.pre_affect || 0) + startNum,
    "middle_affect": p1.middle_affect - (p1.pre_affect || 0) + startNum,
    "end_affect": p1.end_affect - (p1.pre_affect || 0) + startNum
},{
    "pre_affect": startNum,
    "begin_affect": p2.begin_affect - (p2.pre_affect || 0) + startNum,
    "middle_affect": p2.middle_affect - (p2.pre_affect || 0) + startNum,
    "end_affect": p2.end_affect - (p2.pre_affect || 0) + startNum
}];

// Cache color arrays to avoid recreating them on each render
const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--person-default-bg').trim();
// const affectPositiveColors = ["#d0caa4", "#d6c284", "#e1b766", "#efa94b", "#ff9734"];
const affectPositiveColors = ["#e0e8b3"];
const affectNeutralColor = "#9982ad";
// const affectNegativeColors = ["#ab5add", "#be6bdd", "#cf7edd", "#dd91df", "#e9a5e2"];
const affectNegativeColors = ["#5e2956"];

const allColorsPerson = ["#d62d87","#e06cd5", "#e9a5e2", affectNeutralColor,"#d0caa4", "#d6c284","#fac937"];
const allColors = ["#380a32","#5e2956","#b388bd","#b4c97d","#d0fa61"]

// Memoized color getter to improve performance
const colorCache = new Map();
function getAffectColor(val, category) {
    // Return from cache if available
    const cacheKey = String(val);
    if (colorCache.has(cacheKey)) {
        return colorCache.get(cacheKey);
    }
    
    if (category == "raw") {
        return allColors[Math.round(val / 10 * allColors.length) - 1];
    } else {
        // Constrain values to the range -5 to +5
        const constrainedVal = Math.max(-5, Math.min(5, val));

        let color;
        if (constrainedVal === 0) {
            color = affectNeutralColor;
        } else if (constrainedVal < 0) {
            color = affectNegativeColors[Math.min(Math.abs(constrainedVal), affectNegativeColors.length - 1)];
        } else {
            color = affectPositiveColors[Math.min(Math.abs(constrainedVal), affectPositiveColors.length - 1)];
        }

    // Cache the result
        colorCache.set(cacheKey, color);
        return color;
    }
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
let p1Scale = $derived(affectColumns.includes(personColor) && value != 1800 ? 
`scaleY(${(p1[personColor] || 0) / 10})` : 
"scaleY(1)"
);

let p2Scale = $derived(affectColumns.includes(personColor) && value != 1800 ? 
`scaleY(${(p2[personColor] || 0) / 10})` : 
"scaleY(1)"
);

// Precompute background colors
let p1BackgroundColor = $derived(
    personColor === "age" ? 
        // When personColor is "age", use bucketed colors from allColorsPerson
        allColorsPerson[Math.floor( (p1[personColor]-10) / (70-10) * (allColorsPerson.length-1) )] || defaultColor :
    sortCategory === "raw" ? 
        // When sortCategory is "raw", use direct personColor value
        getAffectColor(p1[personColor] || 0, sortCategory) || defaultColor :
        // Otherwise use the existing logic
        affectColumns.includes(personColor) ? 
        getAffectColor(affectDiff[0][personColor], sortCategory) || defaultColor : 
        (colors[personColor] ? colors[personColor][p1data?.[personColor]] : defaultColor) || defaultColor
    );

let p2BackgroundColor = $derived(
    personColor === "age" ? 
        // When personColor is "age", use bucketed colors from allColorsPerson
        allColorsPerson[Math.floor((p2[personColor]-10) / (70-10) * (allColorsPerson.length-1) )] || defaultColor :
    sortCategory === "raw" ? 
        // When sortCategory is "raw", use direct personColor value
        getAffectColor(p2[personColor] || 0, sortCategory) || defaultColor :
        // Otherwise use the existing logic
        affectColumns.includes(personColor) ? 
        getAffectColor(affectDiff[1][personColor], sortCategory) || defaultColor : 
        (colors[personColor] ? colors[personColor][p2data?.[personColor]] : defaultColor) || defaultColor
    );

// Watch for changes to value and reset quotes when it changes
$effect(() => {
    if (value !== prevValue) {
        quoteText = null;
        prevValue = value;
        // if (convoId == "0020a0c5-1658-4747-99c1-2839e736b481") {
        //     console.log(convo)
        // }
    }
});
let instant = $state("");
$effect(() => {
    if (value === 1800) {
        instant = "instant"
        // Generate random delays between 100ms and 1500ms
        const p1Delay = Math.floor(Math.random() * 2000) + 100;
        const p2Delay = Math.floor(Math.random() * 2000) + 100;
        
        // Set p1BackgroundColor and scale with its random delay
        setTimeout(() => {
            p1BackgroundColor = "#000";
            p1Scale = 100;
        }, p1Delay);
        
        // Set p2BackgroundColor and scale with its random delay
        setTimeout(() => {
            p2BackgroundColor = "#000";
            p2Scale = 100;
        }, p2Delay);
        
        
    } else {
        instant = ""
    }
});

// Function to handle person click - optimized to avoid unnecessary work
function handlePersonClick(id, convoId) {
    // console.log(id)
    onQuoteSelect(id, convoId);
}

// Only render if we have valid data
const shouldRender = convo && convoState && p1Key && p2Key;


$effect(() => {
  // This effect will trigger whenever key props change
  // Most importantly, when visible changes or when convo is removed/added
  if (visible) {
    // Force a redraw when becoming visible
    // This can help Svelte better handle conditionally rendered components
    const tempStyle = document.createElement('style');
    document.head.appendChild(tempStyle);
    document.head.removeChild(tempStyle);
  }
});
</script>

{#if shouldRender}
<Person
number="1"
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
onClick={() => handlePersonClick(p1Key, convoId)}
{w}
{h}
{convoId}
{zoomPerson}
opacity={p1Opacity}
metric={convo[sortCategory]}
{instant}
/>

<Person
number="2"
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
onClick={() => handlePersonClick(p2Key, convoId)}
{w}
{h}
{convoId}
{zoomPerson}
opacity={p2Opacity}
metric={convo[sortCategory]}
{instant}
/>
{/if}