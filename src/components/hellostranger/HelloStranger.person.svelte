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
        metric,
        convoId,
        zoomPerson,
        opacity = 1,
        instant,
        talking,
        value,
        currentTime,
        nextTime,
        var_to_show,
        prefersReducedMotion
    } = $props();

    const nameLookup = {
        "5b0319e68d753d0001cc75c7": "Kate",
        "5b315e97f23189000161a03d": "Dawn",
        "5dde8fba82f458000c8c7c75": "Dave",
        "5d5dc2d37bfc8400013b653c": "Eve",
        "5f1d266c6f7d7f62a219fade": "Hank",
        "5ef0d0a8074e4c413a113a68": "Faith",
        "59ad6f1e09709e00013c2ba5": "Paige",
        "5d37d2861566530016a061de": "Raúl"
    }


    function darkenColor(hex, factor = 0.3) {
        // Remove # if present
        hex = hex.replace('#', '');

        // Parse hex to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Find the strongest component
        const max = Math.max(r, g, b);
        const boost = 0.2; // How much stronger to keep the dominant color

        // Darken each component, giving extra strength to the dominant one
        const darkR = Math.round(r * (factor + (r === max ? boost : 0)));
        const darkG = Math.round(g * (factor + (g === max ? boost : 0)));
        const darkB = Math.round(b * (factor + (b === max ? boost : 0)));

        // Convert back to hex
        const toHex = (n) => n.toString(16).padStart(2, '0');

        return `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`;
    }

    function darkestColor(hex, factor = 0.27) {
        // Remove # if present
        hex = hex.replace('#', '');

        // Parse hex to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Find the strongest component
        const max = Math.max(r, g, b);
        const boost = 0.2; // How much stronger to keep the dominant color

        // Darken each component, giving extra strength to the dominant one
        const darkR = Math.round(r * (factor + (r === max ? boost : 0)));
        const darkG = Math.round(g * (factor + (g === max ? boost : 0)));
        const darkB = Math.round(b * (factor + (b === max ? boost : 0)));

        // Convert back to hex
        const toHex = (n) => n.toString(16).padStart(2, '0');

        return `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`;
    }

    function lightenColor(hex, factor = 1.3) {
     // Remove # if present
       hex = hex.replace('#', '');

     // Parse hex to RGB
       const r = parseInt(hex.substr(0, 2), 16);
       const g = parseInt(hex.substr(2, 2), 16);
       const b = parseInt(hex.substr(4, 2), 16);

     // Apply factor equally to all components
       const lightR = Math.min(255, Math.round(r * factor));
       const lightG = Math.min(255, Math.round(g * factor));
       const lightB = Math.min(255, Math.round(b * factor));

     // Convert back to hex
       const toHex = (n) => n.toString(16).padStart(2, '0');

       return `#${toHex(lightR)}${toHex(lightG)}${toHex(lightB)}`;
   }

   let mainColor = $derived(darkenColor(backgroundColor));
   let bgColor = $derived(lightenColor(backgroundColor));
   let darkerColor = $derived(darkestColor(backgroundColor));

// Local reactive state using proper Svelte 5 syntax
   let isSelected = $state(selected);
   let isVisible = $state(visible);
   let currentOpacity = $state(opacity);
   let isLoaded = $state(false);

   const frameRate = 6; 

// Effect to update local state when props change
   $effect(() => {
    isSelected = selected;
    isVisible = visible;
    currentOpacity = opacity;
});

// Create variable for current sprite frame
   let currentFrame = $state(0);
   let currentAsciiArt = $state('');


/// SPRITE FORMATTING
/// [male,female]-[0,1,2,3,4]-[1,2,3]
// Determine sex with fallback and prevent unnecessary recalculations
   const sex = (data?.sex === 'male' || data?.sex === 'female') 
   ? data.sex 
   : Math.random() > 0.5 ? 'male' : 'female';
   const color = personData.race === "white" || personData.race === "asian" ? Math.abs(personKey.split('').reduce((h, c) => h + c.charCodeAt(0), 0) % 2) : personData.race === "black_or_african_american" ? 3 + Math.abs(personKey.split('').reduce((h, c) => h + c.charCodeAt(0), 0) % 2) : personData.race === "hispanic_or_latino" ? 2 + Math.abs(personKey.split('').reduce((h, c) => h + c.charCodeAt(0), 0) % 2) : personData.race === "native_hawaiian_or_pacific_islander" || personData.race === "american_indian_or_alaska_native" ? 2 : Math.abs(personKey.split('').reduce((h, c) => h + c.charCodeAt(0), 0) % 5);
    // const color = 0;
    const numMax = 3; // this means the generator has 1 possible sprite(s) for this sex and color 
    const num = Math.abs(Array.from(personKey || '').reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0) % numMax);
    let smile = "";
    // Animation for ASCII sprite cycling
    // Animation for ASCII sprite cycling
    let spriteKey = `${sex}_${color}_${num}`;
    const laughTexts = ["I could eat soup anytime. I love soup at any time.","Oh yeah. Oh my God. It's not soup weather right now. It's the end of August!","Hahahahaha. Hey, it brought you to this place, right?","Hahaha.","Mmmhmm!","I am so delighted that you exist in the world, to do that. Because it's important! This is like critical, critical work that you and I do. And just: Yes! Yes! So you know, you get $15 but a little encouragement for me, too. Keep going!","Yeah, I think I needed that this week.","I’m delighted we got to meet. This was kinda fun. I feel like this is fate somehow.","I feel like I needed this. I feel like you helped me so much.","Good, I love that. That makes me happy. I feel like I’ve accomplished something today.","I wish you were down closer. I’d be like: Hey, let’s grab coffee!"]
    $effect(() => {
    // Get the correct sprite key based on personData
    if (personState?.quoteText && zoomPerson == convoId && laughTexts.indexOf(personState.quoteText) != -1) {
        smile = "smile"
    } else {
        smile = "";
    }
    spriteKey = `${sex}_${color}_${num}${smile}`;
    
    
    // Skip if sprites or the specific sprite key is not available
    if (!sprites || !sprites[spriteKey] || !sprites[spriteKey].length) {
        return;
    }
    mainColor = darkenColor(backgroundColor);
    bgColor = lightenColor(backgroundColor);
    darkerColor = darkestColor(backgroundColor);
    
    // Set initial sprite frame
    currentAsciiArt = sprites[spriteKey][0];
    currentFrame = 0;
    
    // Mark as loaded
    isLoaded = true;
    if (prefersReducedMotion) {
        return
    }
    // Only start animation if talking is true
    if (!talking && value > 1800) {
        return; // Exit early if not talking
    }
    if (value == 1800 && instant == "instant") {
        spriteKey = "end" + number;
        mainColor = "#2e0a33";
    }
    
    // Animation loop variables
    let frameCount = 0;
    
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

// React to visibility changes to ensure proper rendering
$effect(() => {
    if (visible) {
        // Force element to be properly rendered when becoming visible
        // by triggering a reflow
        if (typeof document !== 'undefined' && typeof window !== 'undefined') {
            // Force a reflow by accessing offsetHeight
            requestAnimationFrame(() => {
                const tempStyle = document.createElement('style');
                document.head.appendChild(tempStyle);
                document.head.removeChild(tempStyle);
            });
        }
    }
});

// Ensure resize transitions work smoothly
$effect(() => {
    // Force a reflow whenever transform changes to ensure smooth transitions
    if (transform && typeof document !== 'undefined') {
        requestAnimationFrame(() => {
            // Accessing offsetHeight here forces a reflow
            document.body.offsetHeight;
        });
    }
});

// Allow external debugging if needed
let debugInfo = $state({
    personKey,
    visible,
    transform
});


// Update debug info when key props change
$effect(() => {
    debugInfo = {
        personKey,
        visible,
        transform,
        scale,
        backgroundColor
    };
});

function formatCatData(value, category) {
    if (category == "race") {
        const raceCat = {
            "white": "White",
            "mixed": "Mixed",
            "asian": "Asian",
            "hispanic_or_latino": "Hisp",
            "black_or_african_american": "Black",
            "nan": "--",
            "native_hawaiian_or_pacific_islander": "Haw/PacIsl",
            "american_indian_or_alaska_native": "Native",
            "other": "Other",
            "prefer_not_to_say": "--"
        }
        return raceCat[value];
    }
    if (category == "politics") {
        const polCat = {
            "1": "Very Con",
            "2": "Con",
            "3": "Center",
            "4": "Lib",
            "6": "Very lib"
        }
        return polCat[value];
    }
    if (category == "age") {
        return "Age: " + value
    }
    return value;

}
</script>

<div
class="person person{number} nomotion{prefersReducedMotion} {instant}"
class:fadeOut={!isVisible}
class:selected={isSelected}
class:quoteText={personState?.quoteText}
class:loaded={isLoaded}
style="
height: {h}px;
width: {w}px;
transform: {transform};
opacity: {isVisible ? currentOpacity : 0};
background: {bgColor};
"
on:click={onClick}
data-person-key={personKey}
data-convo-id={convoId}
>
<div class="backgroundColor" 
style="background: {backgroundColor}; transform: {scale}; border-top: 0.5px solid  {darkerColor}"
></div>

<div class="asciiContainer"
style:color={mainColor}
style:transform="scale({w/60})"
>
<pre>{currentAsciiArt}</pre>
</div>

{#if personState?.quoteText && zoomPerson == convoId}
<div class="quote" style="width:{personState.quoteText.length*3}px;">
    {personState.quoteText}
    <div class="progressbar" style="height:{ (value - currentTime) / (nextTime - currentTime - ((nextTime - currentTime)*.2) ) * 100}%;"></div>
</div>
{/if}
<!-- <div class="catData">{spriteKey}</div> -->
{#if var_to_show}
<div class="catData">{formatCatData(personData[var_to_show], var_to_show)}</div>
{/if}
{#if !var_to_show && zoomPerson == convoId && value != 0}
<div class="catData">{nameLookup[personKey]}</div>
{/if}
</div>

<style>


    .asciiContainer {
        font-family: "Lucida Console", Monaco, monospace;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        font-size: 2.9em;
        line-height: 0.8rem;
        font-weight: bold;
        letter-spacing: -0.1em;
        color: var(--person-color);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 2s ease-in-out;
        user-select: none;
    }
    
    .asciiContainer pre {
        margin: 0;
        padding: 0;
        font-family: inherit;
        line-height: 0.2rem;
        font-size: 1em;
        letter-spacing: -0.1em;
    }
    .person2 .asciiContainer pre {
       transform: scaleX(-1);
   }

   .person {
    background: var(--person-default-bg);
    display: block;
    position: absolute;
    transform-origin: top left;
    border: 1px solid #000;
    font-size: 2px;
    color: white;
    opacity: 1;
    transition: transform 2s ease-in-out, opacity 0.3s ease-in-out, background 2s ease-in-out;
    cursor: pointer;
    /* Hardware acceleration optimizations */
    will-change: transform, opacity;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
}
.instant.person {
    pointer-events: none;
}
.person.nomotiontrue {
    transition: none !important;
}
.person.selected  {
    z-index: 10;
    box-sizing: content-box;
    border: 3px solid var(--person-hl-color);
    margin-left: -3px;
    margin-top: -3px;
}
.person.quoteText {
    z-index: 10;
    box-sizing: content-box;
    margin-left: -3px;
    margin-top: -3px;
    border: 3px solid var(--quote-hl-color);
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
.nomotiontrue .backgroundColor {
    transition: none !important;
}
.instant .backgroundColor {
    color: #222 !important;
    /* transition: none; */
}
/* .instant .asciiContainer pre {
    transform: scaleX(1);
} */
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
    border: 1px dashed var(--person-hl-color);
    z-index: 5;
    transition: transform 500ms cubic-bezier(0.420, 0.000, 0.580, 1.000), 
    opacity 0.3s ease-in-out, 
}

.person.selected:hover, .person.quoteText:hover {
    border: 3px solid var(--person-hl-color);
}

.progressbar {
    position: absolute;
    top: 0px;
    right: 0px;
    height: 100%;
    max-height: 100%;
    background: var(--quote-hl-color);
    width: 5px;
    opacity: 0.5;
    transition: height 100ms cubic-bezier(0.420, 0.000, 0.580, 1.000);
}
</style>