export function dontWait(
	callback: () => Promise<unknown>,
	errorCallback?: (err: Error) => void,
): void {
	process.nextTick(async () => {
		try {
			await callback();
		} catch (error) {
			errorCallback?.(error as Error);
		}
	});
}
