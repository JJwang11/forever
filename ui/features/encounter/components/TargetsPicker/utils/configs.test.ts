import { Target as TargetProto } from '@generated/proto/common';
import type { Encounter } from '@sim/raid/encounter';
import { describe, expect, it } from 'vitest';

import { booleanConfigs } from './configs';

describe('booleanConfigs', () => {
	it('shows Takes Bleeds on by default and stores the inverse', () => {
		const target = TargetProto.create();
		const encounter = {
			modifyTarget: (_: number, modify: (target: TargetProto) => void) => modify(target),
		} as unknown as Encounter;
		const takesBleeds = booleanConfigs({ encounter, targetIndex: 0, getTarget: () => target }).find(config => config.id.endsWith('takes-bleeds'))!;

		expect(takesBleeds.getValue?.(null)).toBe(true);
		takesBleeds.setValue?.(null, false);
		expect(target.bleedImmune).toBe(true);
		expect(takesBleeds.getValue?.(null)).toBe(false);
	});
});
