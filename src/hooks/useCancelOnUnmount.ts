import { useEffect, useRef } from 'react';

/**
 * Returns an AbortSignal that is automatically aborted when the component unmounts.
 *
 * Usage:
 *   const signal = useCancelOnUnmount();
 *   useEffect(() => {
 *       fetchData(signal).then(setData);
 *   }, [signal]);
 *
 * When the component unmounts (e.g. user navigates away), any in-flight HTTP
 * requests using this signal are cancelled immediately, freeing the browser's
 * per-origin connection slot for the new page's requests.
 */
export function useCancelOnUnmount(): AbortSignal {
    const controllerRef = useRef<AbortController | null>(null);

    // Create a fresh controller on first access (safe for concurrent mode)
    if (controllerRef.current === null) {
        controllerRef.current = new AbortController();
    }

    useEffect(() => {
        // Create a fresh controller for this mount cycle
        const controller = new AbortController();
        controllerRef.current = controller;

        return () => {
            controller.abort();
        };
    }, []);

    return controllerRef.current.signal;
}
