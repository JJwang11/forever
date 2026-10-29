import { APLAction, APLListItem, APLRotation } from '@generated/proto/apl';
import { parseAplLine } from '@sim/proto/combat_log';
import { describe, expect, it } from 'vitest';

import { resolveAplLine } from './apl_line';

const item = (notes: string, action?: APLAction) => APLListItem.create({ notes, action });
const sequence = (count: number, nested?: APLAction): APLAction =>
	APLAction.create({
		action: {
			oneofKind: 'sequence',
			sequence: { name: '', actions: Array.from({ length: count }, (_, i) => (i === 1 && nested ? nested : APLAction.create())) },
		},
	});
const strictSequence = (count: number): APLAction =>
	APLAction.create({
		action: { oneofKind: 'strictSequence', strictSequence: { actions: Array.from({ length: count }, () => APLAction.create()) } },
	});

const rotation = APLRotation.create({
	prepullActions: [{ hide: false }],
	priorityList: [item('p0', sequence(3)), item('p1'), item('p2', sequence(2)), item('p3', sequence(3, strictSequence(2)))],
	groups: [
		{ name: 'first', actions: [item('g0a0')], variables: [] },
		{ name: 'second', actions: [item('g1a0'), item('g1a1'), item('g1a2', sequence(4))], variables: [] },
	],
});

const resolve = (text: string) => resolveAplLine(rotation, parseAplLine(text)!);

describe('resolveAplLine', () => {
	it('names a priority row', () => {
		const resolved = resolve('priority 2')!;
		expect(resolved.pane).toBe('apl-priority-list');
		expect(resolved.item).toBe(rotation.priorityList[1]);
		expect(resolved.prepull).toBe(false);
		expect(resolved.steps).toEqual([]);
	});

	it('names a group row and carries the group name in the crumbs', () => {
		const resolved = resolve('priority 3 > group 2.2')!;
		expect(resolved.pane).toBe('apl-action-groups');
		expect(resolved.item).toBe(rotation.groups[1].actions[1]);
		expect(resolved.crumbs).toEqual([
			{ kind: 'priority', index: 2 },
			{ kind: 'group', group: 1, index: 1, groupName: 'second' },
		]);
	});

	it('keeps trailing steps apart from the row of the sequence', () => {
		const resolved = resolve('priority 1 > step 3')!;
		expect(resolved.item).toBe(rotation.priorityList[0]);
		expect(resolved.steps).toEqual([2]);
	});

	it('names the group action holding the sequence for a group row with a step', () => {
		const resolved = resolve('priority 3 > group 2.3 > step 3')!;
		expect(resolved.pane).toBe('apl-action-groups');
		expect(resolved.item).toBe(rotation.groups[1].actions[2]);
		expect(resolved.steps).toEqual([2]);
	});

	it('takes the row from a group reference that is a step of a sequence', () => {
		const resolved = resolve('priority 3 > step 2 > group 2.2')!;
		expect(resolved.pane).toBe('apl-action-groups');
		expect(resolved.item).toBe(rotation.groups[1].actions[1]);
		expect(resolved.steps).toEqual([]);
	});

	it('walks nested sequences, outermost step first', () => {
		const resolved = resolve('priority 4 > step 2 > step 2')!;
		expect(resolved.item).toBe(rotation.priorityList[3]);
		expect(resolved.steps).toEqual([1, 1]);
	});

	it('names a prepull row', () => {
		const resolved = resolve('prepull 1')!;
		expect(resolved.pane).toBe('apl-priority-list');
		expect(resolved.item).toBe(rotation.prepullActions[0]);
		expect(resolved.prepull).toBe(true);
	});

	it.each([
		'priority 5',
		'prepull 2',
		'group 3.1',
		'group 1.2',
		'step 1',
		'priority 99 > group 1.1',
		'priority 1 > group 3.1',
		'priority 1 > step 4',
		'priority 2 > step 1',
		'priority 3 > step 3',
		'priority 4 > step 2 > step 3',
		'priority 3 > step 3 > group 1.1',
	])('gives null for %s, out of range', text => {
		expect(resolve(text)).toBeNull();
	});
});
