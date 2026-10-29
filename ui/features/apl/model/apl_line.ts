import type { APLAction, APLListItem, APLPrepullAction, APLRotation } from '@generated/proto/apl';
import type { AplLinePath, AplLineSegment } from '@sim/proto/combat_log';

import type { AplPaneId } from './apl_panes';

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
