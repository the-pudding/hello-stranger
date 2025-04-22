<script>
    // import Sprites from "$components/hellostranger/HelloStranger.sprites.svelte";
    // Props for the Person component
    let {
        personKey,
        personData,
        convoState,
        personState,
        sortMode,
        personColor,
        backgroundColor,
        transform,
        scale,
        selected,
        visible,
        onClick,
        data
    } = $props();
</script>

<div
    class="person"
    class:fadeOut={!visible}
    class:selected={selected}
    style="
        height: {40}px;
        width: {80 / 2}px;
        transform: {transform};
    "
    on:click={onClick}
>
    <div class="backgroundColor" 
        style:background={backgroundColor}
        style:transform={scale}
    ></div>
    <img class="sprite" src="assets/hello-stranger/person.gif" />
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