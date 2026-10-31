import { Target as TargetProto } from '@generated/proto/common';
import type { Encounter } from '@sim/raid/encounter';
import { describe, expect, it } from 'vitest';

import { booleanConfigs } from './configs';

describe('booleanConfigs', () => {
	it('shows Immune to Bleeds off by default', () => {
		const target = TargetProto.create();
		const encounter = {
			modifyTarget: (_: number, modify: (target: TargetProto) => void) => modify(target),
		} as unknown as Encounter;
		const bleedImmune = booleanConfigs({ encounter, targetIndex: 0, getTarget: () => target }).find(config => config.id.endsWith('bleed-immune'))!;

		expect(bleedImmune.getValue?.(null)).toBe(false);
		bleedImmune.setValue?.(null, true);
		expect(target.bleedImmune).toBe(true);
		expect(bleedImmune.getValue?.(null)).toBe(true);
	});
});
