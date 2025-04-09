<script>
    // Component for displaying quote panel
    let { 
        quoteState, 
        onClose 
    } = $props();

    // Computed property to determine if the panel should be shown
    let isShown = $derived(quoteState && quoteState[0] !== null);

    // Handle close button click
    function handleClose() {
        if (onClose && typeof onClose === 'function') {
            onClose();
        }
    }
</script>

<div class="quotePanel" class:shown={isShown}>
    <div class="close" on:click={handleClose}>
        Close
    </div>
    <p class="p1">{quoteState?.[0] || ''}</p>
    <p class="p2">{quoteState?.[1] || ''}</p>
    <p class="p1">{quoteState?.[2] || ''}</p>
    <p class="p2">{quoteState?.[3] || ''}</p>
    <p class="p1">{quoteState?.[4] || ''}</p>
    <p class="p2">{quoteState?.[5] || ''}</p>
</div>

<style>
    .quotePanel {
        position: fixed;
        left: -300px;
        top: 0px;
        height: 100vh;
        font-size: 13px;
        padding: 20px;
        width: 300px;
        background: black;
        color: white;
        transition: all 200ms cubic-bezier(0.250, 0.100, 0.250, 1.000);
        transition-timing-function: cubic-bezier(0.250, 0.100, 0.250, 1.000);
        overflow: scroll;
    }
    
    .quotePanel.shown {
        left: 0px;
    }
    
    .quotePanel .p1 {
        color: white;
    }
    
    .quotePanel .p2 {
        color: #aaa;
    }
    
    .close {
        width: 100%;
        padding: 5px;
        background: purple;
        color: white;
        font-weight: bold;
        text-align: center;
        cursor: pointer;
    }
</style>