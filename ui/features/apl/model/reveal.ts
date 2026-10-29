import type { AplLinePath, AplLineSegment } from '@sim/proto/combat_log';
import { Emitter } from '@sim/state/events';

import type { ResolvedAplLine } from './apl_line';

/** A request to open a cast's line in the Rotation tab. The nonce tells a repeat of the same path from the last one. */
export interface AplRevealRequest {
	readonly path: AplLinePath;
	readonly nonce: number;
}

// One page holds one sim, so the Timeline and the Rotation tab share the module's one request.
let current: AplRevealRequest | null = null;
const changed = new Emitter<void>();

export const getAplReveal = (): AplRevealRequest | null => current;

export const subscribeAplReveal = (listener: () => void): (() => void) => changed.on(listener);

export function requestAplReveal(path: AplLinePath): void {
	current = { path, nonce: (current?.nonce ?? 0) + 1 };
	changed.emit();
}

/** The part of a cast's path the Rotation tab shows: from its row, the last segment that is not a step, down. */
export function aplRevealLine(path: AplLinePath): AplLinePath {
	let row = path.length - 1;
	while (row > 0 && path[row].kind === 'step') row--;
	return path.slice(Math.max(row, 0));
}

export function aplRevealPane(path: AplLinePath): ResolvedAplLine['pane'] {
	return aplRevealLine(path)[0]?.kind === 'group' ? 'apl-action-groups' : 'apl-priority-list';
}

const sameSegment = (a: AplLineSegment, b: AplLineSegment) =>
	a.kind === b.kind && a.index === b.index && (a.kind !== 'group' || (b.kind === 'group' && a.group === b.group));

/** Where the row or step at `own` sits against the line a request reveals: on the way to it, or the line itself. */
export function aplRevealMatch(path: AplLinePath, own: AplLinePath): { onPath: boolean; isTarget: boolean } {
	const line = aplRevealLine(path);
	const onPath = own.length > 0 && own.length <= line.length && own.every((segment, index) => sameSegment(segment, line[index]));
	return { onPath, isTarget: onPath && own.length === line.length };
}
