<script lang="ts">
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'primary' | 'secondary' | 'danger' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled: boolean = false;
  export let fullWidth: boolean = false;
  export let onClick: (() => void) | undefined = undefined;
  export let className: string = '';

  const sizeClasses: Record<string, string> = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  $: classes = [
    'btn',
    `btn-${variant}`,
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  ].join(' ');
</script>

<button 
  {type} 
  class={classes} 
  {disabled} 
  on:click={onClick} 
>
  <slot />
</button>
