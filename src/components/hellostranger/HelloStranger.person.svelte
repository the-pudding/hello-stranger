<script>
    // Import sprite if needed
    // import Sprites from "./HelloStranger.sprites.svelte";
    
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
        onClick = () => {},
        data
    } = $props();
    
    // Local reactive state using proper Svelte 5 syntax
    let isSelected = $state(selected);
    let isVisible = $state(visible);
    
    // Effect to update local state when props change
    $effect(() => {
        isSelected = selected;
        isVisible = visible;
    });

    // Computed values using derived state
    const height = $derived(sortMode === "person" ? personState.h : convoState.h);
    const width = $derived(sortMode === "person" ? personState.w : convoState.w/2);
</script>

<div
    class="person"
    class:fadeOut={!isVisible}
    class:selected={isSelected}
    style="
        height: {height}px;
        width: {width}px;
        transform: {transform};
    "
    on:click={onClick}
>
    <div class="backgroundColor" 
        style:background={backgroundColor}
        style:transform={scale}
    ></div>
    
    <!-- Use sprite component if available, otherwise use direct image path -->
    <!-- <Sprites /> -->
    <img class="sprite" src="assets/hello-stranger/person.gif" alt="Person sprite" />
</div>

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
        transition: transform 1800ms cubic-bezier(0.420, 0.000, 0.580, 1.000), opacity 0.3s ease-in-out;
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
        left: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        transform-origin: bottom;
        transition: transform 1s ease-in-out, background 1s ease-in-out;
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