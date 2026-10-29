import { useAplReveal, useAplRevealTarget } from '@features/apl/hooks/useAplReveal';
import type { AplLinePath } from '@sim/proto/combat_log';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { aplRevealLine, aplRevealPane, getAplReveal, requestAplReveal } from './reveal';

const priority = (index: number) => ({ kind: 'priority', index }) as const;
const step = (index: number) => ({ kind: 'step', index }) as const;
const group = (groupIndex: number, index: number) => ({ kind: 'group', group: groupIndex, index }) as const;

describe('aplRevealLine', () => {
	it('starts at the row the Rotation tab shows: the last segment that is not a step', () => {
		expect(aplRevealLine([priority(5), group(1, 0), step(2)])).toEqual([group(1, 0), step(2)]);
		expect(aplRevealLine([priority(3), step(1), step(0)])).toEqual([priority(3), step(1), step(0)]);
	});
});

describe('aplRevealPane', () => {
	it('opens the action groups for a group row and the priority pane for a priority or prepull row', () => {
		expect(aplRevealPane([priority(5), group(1, 0), step(2)])).toBe('apl-action-groups');
		expect(aplRevealPane([priority(3), step(1)])).toBe('apl-priority-list');
		expect(aplRevealPane([{ kind: 'prepull', index: 0 }])).toBe('apl-priority-list');
	});
});

describe('useAplRevealTarget', () => {
	const flagsFor = (own: AplLinePath) => renderHook(() => useAplRevealTarget(own));

	it('marks the row and the steps above the one that fired as on the path, and that step as the target', () => {
		const row = flagsFor([priority(3)]);
		const outer = flagsFor([priority(3), step(1)]);
		const leaf = flagsFor([priority(3), step(1), step(0)]);
		const sibling = flagsFor([priority(3), step(0)]);
		const other = flagsFor([priority(4)]);

		act(() => requestAplReveal([priority(3), step(1), step(0)]));

		expect(row.result.current).toMatchObject({ onPath: true, isTarget: false });
		expect(outer.result.current).toMatchObject({ onPath: true, isTarget: false });
		expect(leaf.result.current).toMatchObject({ onPath: true, isTarget: true });
		expect(sibling.result.current).toMatchObject({ onPath: false, isTarget: false });
		expect(other.result.current).toMatchObject({ onPath: false, isTarget: false });
	});

	it('targets the group row, not the priority row that referenced its group', () => {
		const referencing = flagsFor([priority(5)]);
		const groupRow = flagsFor([group(1, 0)]);

		act(() => requestAplReveal([priority(5), group(1, 0)]));

		expect(referencing.result.current).toMatchObject({ onPath: false, isTarget: false });
		expect(groupRow.result.current).toMatchObject({ onPath: true, isTarget: true });
	});

	it('gives a second request for the same path a new nonce, so the same row reveals again', () => {
		const leaf = flagsFor([priority(2)]);

		act(() => requestAplReveal([priority(2)]));
		const first = leaf.result.current.nonce;
		act(() => requestAplReveal([priority(2)]));

		expect(leaf.result.current).toMatchObject({ onPath: true, isTarget: true });
		expect(leaf.result.current.nonce).not.toBe(first);
	});

	it('ignores a request made before the row mounted', () => {
		act(() => requestAplReveal([priority(7)]));
		const late = flagsFor([priority(7)]);
		const reveal = renderHook(() => useAplReveal());

		expect(getAplReveal()?.path).toEqual([priority(7)]);
		expect(late.result.current).toMatchObject({ onPath: false, isTarget: false });
		expect(reveal.result.current).toBeNull();
	});
});
