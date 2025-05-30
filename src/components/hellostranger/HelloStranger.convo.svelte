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
        sortCategory,
        quotePerson,
        currentTime,
        nextTime,
        var_to_show
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

// Talking state management - only one can talk at a time
let currentSpeaker = $state('p1'); // null, 'p1', or 'p2'
let p1talking = $derived(currentSpeaker === 'p1');
let p2talking = $derived(currentSpeaker === 'p2');

talkingSpeakerSwitch();

function talkingSpeakerSwitch() {
    if (p1Key == quotePerson) {
        currentSpeaker = 'p1';
    } else if (p2Key == quotePerson) {
        currentSpeaker = 'p2';
    } else {
       currentSpeaker = Math.random() > 0.5 ? "p1" : "p2";
    }
}

// Only try to access convo properties if it exists
if (convo && typeof convo === 'object') {
    const keys = Object.keys(convo);
    p1Key = keys[0] || null;
    p2Key = keys[1] || null;
    p1 = p1Key ? p1data|| {} : {};
    p2 = p2Key ? p2data || {} : {};
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

// const affectDiff = [{
//     "pre_affect": p1.pre_affect,
//     "begin_affect": p1.begin_affect,
//     "middle_affect": p1.middle_affect,
//     "end_affect": p1.end_affect
// },{
//     "pre_affect": p1.pre_affect,
//     "begin_affect": p2.begin_affect,
//     "middle_affect": p2.middle_affect,
//     "end_affect": p2.end_affect
// }];

// Cache color arrays to avoid recreating them on each render
const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--person-default-bg').trim();
const affectPositiveColors = ["#ede977"];
const affectNeutralColor = "#706267";
const affectNegativeColors = ["#ff6bab"];

const allColorsPerson = ["#d62d87","#e06cd5", "#e9a5e2", "#b0877b","#d0caa4", "#face48","#fac937"];
// const allColors = ["#380a32","#5e2956","#b388bd","#b4c97d","#d0fa61"]


// Memoized color getter to improve performance
const colorCache = new Map();
function getAffectColor(val, category) {
    const cacheKey = String(val);
    if (colorCache.has(cacheKey)) {
        return colorCache.get(cacheKey);
    }

    if (category == "raw") {
        const rawColors = ["#f59de2","#f59de2","#706267","#706267","#9bc7d1","#9bc7d1"]
        return rawColors[Math.min(Math.max(0, Math.round(val / 10 * rawColors.length) - 1), rawColors.length - 1)];
    } else {
        const constrainedVal = Math.max(-5, Math.min(5, val));

        let color;
        if (constrainedVal === 0) {
            color = affectNeutralColor;
        } else if (constrainedVal < 0) {
            color = affectNegativeColors[Math.min(Math.abs(constrainedVal), affectNegativeColors.length - 1)];
        } else {
            color = affectPositiveColors[Math.min(Math.abs(constrainedVal), affectPositiveColors.length - 1)];
        }

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
    personColor === "end" ?
    "#331c3d" :
    personColor === "age" ? 
    allColorsPerson[Math.floor( (p1[personColor]-10) / (70-10) * (allColorsPerson.length-1) )] || defaultColor :
    sortCategory === "raw" ? 
    getAffectColor(p1[personColor] || 0, sortCategory) || defaultColor :
    affectColumns.includes(personColor) ? 
    getAffectColor(affectDiff[0][personColor], sortCategory) || defaultColor : 
    (colors[personColor] ? colors[personColor][p1data?.[personColor]] : defaultColor) || defaultColor
    );

let p2BackgroundColor = $derived(
    personColor === "end" ?
    "#331c3d" :
    personColor === "age" ? 
    allColorsPerson[Math.floor((p2[personColor]-10) / (70-10) * (allColorsPerson.length-1) )] || defaultColor :
    sortCategory === "raw" ? 
    getAffectColor(p2[personColor] || 0, sortCategory) || defaultColor :
    affectColumns.includes(personColor) ? 
    getAffectColor(affectDiff[1][personColor], sortCategory) || defaultColor : 
    (colors[personColor] ? colors[personColor][p2data?.[personColor]] : defaultColor) || defaultColor
    );

// Watch for changes to value and reset quotes when it changes
$effect(() => {
    talkingSpeakerSwitch();
    if (value !== prevValue) {
        quoteText = null;
        prevValue = value;
    }
});

// let instant = $state("");
// $effect(() => {
//     if (value === 1800) {
//         instant = "instant"
//         // Generate random delays between 100ms and 1500ms
//         // const p1Delay = Math.floor(Math.random() * 2000) + 100;
//         // const p2Delay = Math.floor(Math.random() * 2000) + 100;

//         // setTimeout(() => {
//         //     p1BackgroundColor = "#100012";
//         //     p1Scale = 100;
//         // }, p1Delay);

//         // setTimeout(() => {
//         //     p2BackgroundColor = "#100012";
//         //     p2Scale = 100;
//         // }, p2Delay);

//     } else {
//         instant = ""
//     }
// });

// Function to handle person click - now also manages talking state
function handlePersonClick(id, convoId) {
    onQuoteSelect(id, convoId);
}

// Only render if we have valid data
const shouldRender = convo && convoState && p1Key && p2Key;

$effect(() => {
    if (visible) {
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

talking={p1talking}
{value}
{currentTime}
{nextTime}
{var_to_show}
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

talking={p2talking}
{value}
{currentTime}
{nextTime}
{var_to_show}
/>
{/if}