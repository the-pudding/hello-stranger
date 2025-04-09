<script>
	import { getContext } from "svelte";
	import HelloStranger from "$components/hellostranger/HelloStranger.svelte";
	import Footer from "$components/Footer.svelte";

	const copy = getContext("copy");
	// const data = getContext("data");

	import convosJson from "$data/conversations.json";

	const entries = Object.entries(convosJson);
	// const filteredEntries = entries.filter((_, i) => i % 2 === 0);
	const filteredEntries = entries;
	const newConvos = Object.fromEntries(filteredEntries);

	// Reassign to convos
	let convos = newConvos;
	import people from "$data/people.json";
</script>

<svelte:boundary onerror={(e) => console.error(e)}>
	<HelloStranger {convos} {people} {copy} />
	<!-- <Footer recirc={true} /> -->

</svelte:boundary>
