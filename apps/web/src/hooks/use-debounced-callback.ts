"use client";

import { useCallback, useEffect, useRef } from "react";

function useDebouncedCallback<Args extends unknown[]>(
	callback: (...args: Args) => void,
	delayMs = 350,
) {
	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	useEffect(() => {
		return () => clearTimeout(timeoutRef.current);
	}, []);

	return useCallback(
		(...args: Args) => {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => {
				callbackRef.current(...args);
			}, delayMs);
		},
		[delayMs],
	);
}

export { useDebouncedCallback };
