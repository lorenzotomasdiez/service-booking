// Core Components for BarberPro
// Mobile-first, Argentina-optimized components

export { default as Button } from './Button.svelte';
export { default as Input } from './Input.svelte';
export { default as Card } from './Card.svelte';
export { default as Modal } from './Modal.svelte';
export { default as Loading } from './Loading.svelte';

// Component Types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type InputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number';
export type InputFormat = 'none' | 'phone' | 'dni' | 'currency';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type LoadingVariant = 'spinner' | 'skeleton' | 'pulse' | 'dots';
export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';
export type LoadingColor = 'primary' | 'secondary' | 'neutral' | 'white';