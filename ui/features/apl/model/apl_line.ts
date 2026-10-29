import { type APLAction, type APLListItem, type APLPrepullAction, type APLRotation, APLRotation_Type } from '@generated/proto/apl';
import type { AplLinePath, AplLineSegment } from '@sim/proto/combat_log';
import type { SimResult, UnitMetrics } from '@sim/proto/sim_result';

import type { AplPaneId } from './apl_panes';

/** The rotation a run ran, and whether the player's rotation differs from it now. */
export interface AplRun {
	readonly rotation: APLRotation;
	readonly changed: boolean;
}

/**
 * The rotation the run's request carried for `player`, or null when the user picked Auto or Simple: the request
 * holds an APL generated from those too. A rotation with no type is an APL, as `Player.getRotationType` reads it.
 */
export function runRotation(result: SimResult, player: UnitMetrics): APLRotation | null {
	const rotation = result.request.raid?.parties[Math.floor(player.index / 5)]?.players[player.index % 5]?.rotation;
	return rotation && (rotation.type === APLRotation_Type.TypeAPL || rotation.type === APLRotation_Type.TypeUnknown) ? rotation : null;
}

export interface ResolvedAplLine {
	readonly pane: Extract<AplPaneId, 'apl-priority-list' | 'apl-action-groups'>;
	readonly item: APLListItem | APLPrepullAction;
	readonly prepull: boolean;
	readonly steps: ReadonlyArray<number>;
	readonly crumbs: ReadonlyArray<AplLineSegment & { readonly groupName?: string }>;
}

const stepsOf = (action: APLAction | undefined): APLAction[] | undefined => {
	const impl = action?.action;
	if (impl?.oneofKind === 'sequence') return impl.sequence.actions;
	if (impl?.oneofKind === 'strictSequence') return impl.strictSequence.actions;
	return undefined;
};

/**
 * The editor row a cast's path names, taken from the last segment that is not a step, with the steps after it.
 * Null when any segment no longer fits the rotation, a step included.
 */
export function resolveAplLine(rotation: APLRotation, path: AplLinePath): ResolvedAplLine | null {
	let row: { item: APLListItem | APLPrepullAction; segment: AplLineSegment } | undefined;
	let action: APLAction | undefined;
	let steps: number[] = [];
	for (const segment of path) {
		if (segment.kind === 'step') {
			const next = stepsOf(action)?.[segment.index];
			if (!next) return null;
			action = next;
			steps.push(segment.index);
			continue;
		}
		const item =
			segment.kind === 'prepull'
				? rotation.prepullActions[segment.index]
				: segment.kind === 'group'
					? rotation.groups[segment.group]?.actions[segment.index]
					: rotation.priorityList[segment.index];
		if (!item) return null;
		row = { item, segment };
		action = item.action;
		steps = [];
	}
	if (!row) return null;

	const crumbs = path.map(segment => (segment.kind === 'group' ? { ...segment, groupName: rotation.groups[segment.group].name } : segment));
	const pane = row.segment.kind === 'group' ? 'apl-action-groups' : 'apl-priority-list';
	return { pane, item: row.item, prepull: row.segment.kind === 'prepull', steps, crumbs };
}
