import type { APLListItem, APLPrepullAction, APLRotation } from '@generated/proto/apl';
import type { AplLinePath, AplLineSegment } from '@sim/proto/combat_log';

import type { AplPaneId } from './apl_panes';

export interface ResolvedAplLine {
	readonly pane: Extract<AplPaneId, 'apl-priority-list' | 'apl-action-groups'>;
	readonly item: APLListItem | APLPrepullAction;
	readonly prepull: boolean;
	readonly steps: ReadonlyArray<number>;
	readonly crumbs: ReadonlyArray<AplLineSegment & { readonly groupName?: string }>;
}

/** The editor row a cast's path names, with the sequence steps below it. Null when the path no longer fits the rotation. */
export function resolveAplLine(rotation: APLRotation, path: AplLinePath): ResolvedAplLine | null {
	let rowEnd = path.length;
	while (rowEnd > 0 && path[rowEnd - 1].kind === 'step') rowEnd--;
	const steps = path.slice(rowEnd).map(segment => segment.index);
	const rowPath = path.slice(0, rowEnd);
	if (rowPath.some(segment => segment.kind === 'step')) return null;

	const row = rowPath[rowPath.length - 1];
	if (!row) return null;

	let item: APLListItem | APLPrepullAction | undefined;
	let pane: ResolvedAplLine['pane'] = 'apl-priority-list';
	if (row.kind === 'prepull') item = rotation.prepullActions[row.index];
	else if (row.kind === 'priority') item = rotation.priorityList[row.index];
	else if (row.kind === 'group') {
		pane = 'apl-action-groups';
		item = rotation.groups[row.group]?.actions[row.index];
	}
	if (!item) return null;

	const crumbs = path.map(segment => (segment.kind === 'group' ? { ...segment, groupName: rotation.groups[segment.group]?.name } : segment));
	return { pane, item, prepull: row.kind === 'prepull', steps, crumbs };
}
