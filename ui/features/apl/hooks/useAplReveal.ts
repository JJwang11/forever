import type { AplLinePath } from '@sim/proto/combat_log';
import { useState, useSyncExternalStore } from 'react';

import { aplRevealLine, aplRevealMatch, type AplRevealRequest, getAplReveal, subscribeAplReveal } from '../model/reveal';

/** The last request to open a line in the Rotation tab, or null; a request made before the caller mounted counts as none. */
export const useAplReveal = (): AplRevealRequest | null => {
	const [since] = useState(() => getAplReveal()?.nonce ?? 0);
	const request = useSyncExternalStore(subscribeAplReveal, getAplReveal);
	return request && request.nonce > since ? request : null;
};

export interface AplRevealTarget {
	onPath: boolean;
	isTarget: boolean;
	/** Changes with every request, a repeat of the same path included. */
	nonce: number | undefined;
}

const NOWHERE: AplRevealTarget = { onPath: false, isTarget: false, nonce: undefined };

// A request is an event: each caller matches it once, against where it stood when the request came. A row that
// takes the revealed index later (a row above it deleted or moved) matches nothing.
const useHandledOnce = (match: (path: AplLinePath) => Omit<AplRevealTarget, 'nonce'>): AplRevealTarget => {
	const request = useAplReveal();
	const [handled, setHandled] = useState(NOWHERE);
	if (request && request.nonce !== handled.nonce) {
		const next = { ...match(request.path), nonce: request.nonce };
		setHandled(next);
		return next;
	}
	return handled;
};

/** Whether the last request's line passes the row or step at `own`, or ends there. */
export const useAplRevealTarget = (own: AplLinePath): AplRevealTarget => useHandledOnce(path => aplRevealMatch(path, own));

/** For a section or a group with no path of its own: whether the last request's line sits under it. */
export const useAplRevealOpen = (holds: (line: AplLinePath) => boolean): AplRevealTarget =>
	useHandledOnce(path => ({ onPath: holds(aplRevealLine(path)), isTarget: false }));
