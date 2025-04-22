<script>
  import { onMount, createEventDispatcher } from 'svelte';
  
  // Disable runes for this component
  export let sketch;
  export let width = window.innerWidth;
  export let height = window.innerHeight;
  export let parentDivStyle = "display: block;";
  export let debug = false;
  
  // Container reference
  let container;
  let p5Instance = null;
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  onMount(async () => {
    try {
      // Dynamically import p5
      const p5Module = await import('p5');
      const p5 = p5Module.default;
      
      if (typeof sketch !== 'function') {
        console.error('Error: sketch must be a function, but got:', typeof sketch);
        return;
      }
      
      if (debug) {
        console.log('Creating p5 instance with sketch:', sketch);
      }
      
      // Create p5 instance with the container as the parent element
      p5Instance = new p5(sketch, container);
      
      // Dispatch the instance event
      dispatch('instance', p5Instance);
      
      return () => {
        // Clean up the p5 instance when the component is destroyed
        if (p5Instance && typeof p5Instance.remove === 'function') {
          p5Instance.remove();
          p5Instance = null;
        }
      };
    } catch (error) {
      console.error('Error creating p5 instance:', error);
    }
  });
</script>

<svelte:options runes={false} />

<div bind:this={container} style={parentDivStyle} class="p5-container"></div>

<style>
  .p5-container {
    position: relative;
  }
</style>