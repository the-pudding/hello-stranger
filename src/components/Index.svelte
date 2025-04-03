<script>
	import { getContext } from "svelte";
	import HelloStranger from "$components/hellostranger/HelloStranger.svelte";
	import Footer from "$components/Footer.svelte";

	const copy = getContext("copy");
	// const data = getContext("data");

	import convos from "$data/conversations.json";
	import people from "$data/people.json";
</script>

<svelte:boundary onerror={(e) => console.error(e)}>
	<HelloStranger {convos} {people} {copy} />
	<!-- <Footer recirc={true} /> -->

</svelte:boundary>
