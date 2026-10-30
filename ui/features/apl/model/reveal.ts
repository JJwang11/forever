import type { APLAction, APLListItem, APLPrepullAction, APLRotation } from '@generated/proto/apl';
import type { AplLinePath } from '@sim/proto/combat_log';
import { Emitter } from '@sim/state/events';

import { resolveAplLine, type ResolvedAplLine } from './apl_line';

/** A cast's line to open in the Rotation tab: its row and the steps down to the one that fired, as objects of the live rotation. */
export interface AplRevealRequest {
	readonly kind: ResolvedAplLine['kind'];
	readonly item: APLListItem | APLPrepullAction;
	readonly steps: ReadonlyArray<APLAction>;
}

// One page holds one sim, so the Timeline and the Rotation tab share the module's one emitter.
export const aplReveals = new Emitter<AplRevealRequest>();

/**
 * Sends the line `path` names in `rotation`, the player's own, to the Rotation tab, whose rows find themselves
 * in it by identity. False, with nothing sent, when the path no longer fits the rotation.
 */
export function requestAplReveal(rotation: APLRotation, path: AplLinePath): boolean {
	const line = resolveAplLine(rotation, path);
	if (!line) return false;
	aplReveals.emit({ kind: line.kind, item: line.item, steps: line.stepActions });
	return true;
}
