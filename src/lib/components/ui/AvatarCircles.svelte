<script lang="ts">
	import { cn } from '$lib/utils';

	interface Avatar {
		imageUrl: string;
		profileUrl: string;
	}

	export let avatarUrls: Avatar[];
	export let numPeople: number = 0;
	export let className: string = '';
</script>

<div class={cn('z-10 flex -space-x-4 rtl:space-x-reverse', className)}>
	{#each avatarUrls as avatar, i}
		<a href={avatar.profileUrl} target="_blank" rel="noopener noreferrer">
			<img
				class="h-10 w-10 rounded-full border-2 border-background"
				src={avatar.imageUrl}
				alt="Avatar {i + 1}"
			/>
		</a>
	{/each}
	{#if numPeople > 0}
		<a
			class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-center text-xs font-medium text-foreground hover:bg-muted/80"
			href="#"
		>
			+{numPeople}
		</a>
	{/if}
</div>
