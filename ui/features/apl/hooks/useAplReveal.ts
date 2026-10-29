import type { AplLinePath } from '@sim/proto/combat_log';
import { useState, useSyncExternalStore } from 'react';

import { aplRevealMatch, type AplRevealRequest, getAplReveal, subscribeAplReveal } from '../model/reveal';

const useMountNonce = () => useState(() => getAplReveal()?.nonce ?? 0)[0];

/** The last request to open a line in the Rotation tab, or null; a request made before the caller mounted counts as none. */
export const useAplReveal = (): AplRevealRequest | null => {
	const since = useMountNonce();
	const request = useSyncExternalStore(subscribeAplReveal, getAplReveal);
	return request && request.nonce > since ? request : null;
};

export interface AplRevealTarget {
	onPath: boolean;
	isTarget: boolean;
	/** Changes with every request that passes `own`, a repeat of the same path included. */
	nonce: number | undefined;
}

const NOWHERE: AplRevealTarget = { onPath: false, isTarget: false, nonce: undefined };

/**
 * Whether the last request's line passes the row or step at `own`, or ends there. The snapshot is a
 * number, so a request for another line re-renders none of the rows it does not pass.
 */
export const useAplRevealTarget = (own: AplLinePath): AplRevealTarget => {
	const since = useMountNonce();
	// The nonce, negative for a row on the way and positive for the line itself; 0 off the path.
	const mark = useSyncExternalStore(subscribeAplReveal, () => {
		const request = getAplReveal();
		if (!request || request.nonce <= since) return 0;
		const { onPath, isTarget } = aplRevealMatch(request.path, own);
		return onPath ? (isTarget ? request.nonce : -request.nonce) : 0;
	});
	return mark ? { onPath: true, isTarget: mark > 0, nonce: Math.abs(mark) } : NOWHERE;
};
