<script>
// Import sprite if needed
// import Sprites from "./HelloStranger.sprites.svelte";
import sprites from "$data/sprites.json";
// Using Svelte 5 runes syntax for props
const {
    personKey, 
    personData,
    convoState,
    personState,
    sortMode,
    personColor,
    backgroundColor,
    transform = '',
    scale = '',
    selected = false,
    visible = true,
    w,
    h,
    number,
    onClick = () => {},
    data,
    metric
} = $props();

// Local reactive state using proper Svelte 5 syntax
let isSelected = $state(selected);
let isVisible = $state(visible);
const frameRate = 6; 
// Effect to update local state when props change
$effect(() => {
    isSelected = selected;
    isVisible = visible;
});

// Create variable for current sprite frame
let currentFrame = $state(0);
let currentAsciiArt = $state('');


const sex = (data?.sex === 'male' || data?.sex === 'female') 
  ? data.sex 
  : Math.random() > 0.5 ? 'male' : 'female';
const color = 0;
const num = 0;
    
// Animation for ASCII sprite cycling
$effect(() => {
    // Get the correct sprite key based on personData
    // const sex = personData?.sex || 'male';
    // const color = personData?.color || 0;
    // const num = personData?.num || 0;
    
    const spriteKey = `${sex}_${color}_${num}`;
    
    // Animation loop variables
    let frameCount = 0;
    
    // Set initial sprite frame
    currentAsciiArt = sprites[spriteKey][0];
    
    // Set up animation interval to cycle through frames
    const interval = setInterval(() => {
        // Cycle through available frames
        frameCount = (frameCount + 1) % sprites[spriteKey].length;
        currentAsciiArt = sprites[spriteKey][frameCount];
        currentFrame = frameCount;
    }, 1000/frameRate);
    
    // Cleanup when component is destroyed or dependencies change
    return () => clearInterval(interval);
});
</script>

<div
    class="person person{number}"
    class:fadeOut={!isVisible}
    class:selected={isSelected}
    class:talking={personState.quoteText}
    style="
        height: {h}px;
        width: {w}px;
        transform: {transform};
    "
    on:click={onClick}
>
    <div class="backgroundColor" 
        style:background={backgroundColor}
        style:transform={scale}
    ></div>
    
    <div class="asciiContainer">
        <pre>{currentAsciiArt}</pre>
    </div>
    <div class="catData">{metric} ({personData.age}/{personData.sex[0]}/{personData.race[0]})</div>
    {#if personState.quoteText}
    <div class="quote" style="width:{personState.quoteText.length*3}px;">
        {personState.quoteText}
    </div>
    {/if}
</div>

<style>
    
    .catData {
        position: absolute;
        right: 0;
        bottom: 0;
        background: black;
        color: white;
/*         font-weight: bold; */
        font-size: 7px;
        width: 100%;
    }
    .asciiContainer {
        font-family: "Lucida Console", Monaco, monospace;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        font-size: 3em;
        line-height: 1;
        letter-spacing: -0.1em;
        color: black;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .asciiContainer pre {
        margin: 0;
        padding: 0;
        font-family: inherit;
        line-height: 0.5;
        font-size: 1.1em;
    }
    .person2 .asciiContainer pre {
         transform: scaleX(-1);
    }
     
    .person {
        background: #ddd;
        display: block;
        position: absolute;
        transform-origin: top left;
        border: 1px solid #000;
        font-size: 2px;
        color: white;
        opacity: 1;
        transition: transform 2s ease-in-out, opacity 0.3s ease-in-out;
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
    .person.talking {
         z-index: 99;
         box-shadow: 0 0 10px #e373ff;
    }
    .backgroundColor {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        transform-origin: bottom;
        transition: transform 2s ease-in-out, background 2s ease-in-out;
        will-change: transform, background;
    }
    
    .fadeOut {
        opacity: 0;
        pointer-events: none;
    }
    
    .sprite {
        position: relative;
        width: 100%;
        height: auto;
    }
    
    /* Minimize repaints and reflows when elements change state */
    .person:not(.fadeOut):hover {
        z-index: 5;
        filter: brightness(1.2);
        transition: transform 500ms cubic-bezier(0.420, 0.000, 0.580, 1.000), 
                  opacity 0.3s ease-in-out, 
                  filter 0.2s ease;
    }
</style>