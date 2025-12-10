<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let delay: number = 200;
</script>

<div class={cn('flex flex-col gap-4', className)}>
	<slot {delay} />
</div>
