import { showToast } from './toast';

export function handleMutationError(
    error: unknown,
    context: string,
    customMessage?: string
) {
    console.error(`Error ${context}:`, error);
    showToast.error(customMessage || `Failed to ${context}`);
}

export function handleMutationSuccess(message: string) {
    showToast.success(message);
}
