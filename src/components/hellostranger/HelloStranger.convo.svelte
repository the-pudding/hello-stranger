<script>
    let { convo, personState, visible, p1data, p2data, personColor } = $props();
    const [p1Key, p2Key] = Object.keys(convo);
    const p1 = convo[p1Key];
    const p2 = convo[p2Key];

    const colors = ['#d73027','#fc8d59','#fee090','#e0f3f8','#91bfdb','#4575b4'];
    const affectDiff = [{
        "pre_affect": 4,
        "begin_affect": p1.begin_affect - p1.pre_affect + 4,
        "middle_affect": p1.middle_affect - p1.pre_affect + 4,
        "end_affect": p1.end_affect - p1.pre_affect + 4
    },{
        "pre_affect": 4,
        "begin_affect": p2.begin_affect - p2.pre_affect + 4,
        "middle_affect": p2.middle_affect - p2.pre_affect + 4,
        "end_affect": p2.end_affect - p2.pre_affect + 4
    }];
    const affectColors = ['#d73027','#fc8d59','#fee090','#ffffbf','#e0f3f8','#91bfdb','#4575b4']
</script>

<div
class="person p1"
class:fadeOut={!visible}
style="
height: {personState.h}px;
width: {personState.w / 2}px;
transform: translate({personState.x}px, {personState.y}px);
transition:
transform {personState.speed[0]}ms cubic-bezier(0.420, 0.000, 0.580, 1.000),
opacity 0.5s ease-in-out;
"
>
{#if !["pre_affect", "begin_affect", "middle_affect", "end_affect"].includes(personColor)}
    <div class="backgroundColor" style:background={colors[p1data[personColor]] || '#000'}></div>
{:else}
    <div
    class="affect"
    style:height={`${p1[personColor] * 10}%`}
    style:background={affectColors[affectDiff[1][personColor]]}
    />
{/if}
</div>

<div
class="person p2"
class:fadeOut={!visible}
style="
height: {personState.h}px;
width: {personState.w / 2}px;
transform: translate({personState.x + personState.w / 2}px, {personState.y}px);
transition:
transform {personState.speed[1]}ms cubic-bezier(0.420, 0.000, 0.580, 1.000),
opacity 0.5s ease-in-out;
"
>
{#if !["pre_affect", "begin_affect", "middle_affect", "end_affect"].includes(personColor)}
    <div class="backgroundColor" style:background={colors[p2data[personColor]] || '#000'}></div>
{:else}
    <div
    class="affect"
    style:height={`${p2[personColor] * 10}%`}
    style:background={affectColors[affectDiff[1][personColor]]}
    />
{/if}
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
        transition: opacity 0.5s ease-in-out;
    }
    .backgroundColor {
        position: absolute;
        left:  0px;
        top:  0px;
        width: 100%;
        height: 100%;
    }
    .fadeOut {
        opacity: 0;
        pointer-events: none;
    }

    .person.p2 {
        margin-left: -1px;
    }

    .affect {
        position: absolute;
        width: 100%;
        left: 0px;
        bottom: 0px;
        transition: all 1s ease-in-out;
    }

</style>
