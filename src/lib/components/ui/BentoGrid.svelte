<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
</script>

<div
	class={cn(
		'grid w-full auto-rows-[22rem] grid-cols-3 gap-4',
		className
	)}
>
	<slot />
</div>
