import * as PresetUtils from '@app/preset_utils';
import { Spec } from '@generated/proto/common';
import { SavedTalents } from '@generated/proto/ui';
import type { PresetSettings } from '@sim/presets/types';

import arcaneFire from './apls/arcaneFireFill.apl.siml';
import arcaneFrost from './apls/arcaneFrostFill.apl.siml';
import deepFire from './apls/deepFire.apl.siml';
import ffb from './apls/ffb.apl.siml';
import frost from './apls/frost.apl.siml';
import DefaultsJson from './defaults.siml';
import P1ArcaneGearJson from './gear_sets/p1Arcane.gear.siml';

// The spec's defaults, from defaults.siml.
export const Defaults = PresetUtils.specDefaultsFromSettings(Spec.SpecMage, DefaultsJson);

export const P1ArcaneGear = PresetUtils.makePresetGear('P1 Arcane', P1ArcaneGearJson, { devOnly: true });

export const ArcaneFrostAplPreset = PresetUtils.makePresetAPLRotation('Arcane Frost', arcaneFrost);
export const ArcaneFireAplPreset = PresetUtils.makePresetAPLRotation('Arcane Fire', arcaneFire);
export const FFBAplPreset = PresetUtils.makePresetAPLRotation('FFB', ffb);
export const FireAplPreset = PresetUtils.makePresetAPLRotation('Fire', deepFire);
export const FrostAplPreset = PresetUtils.makePresetAPLRotation('Frost', frost);

export const ArcaneFrostTalents = PresetUtils.makePresetTalents('Arcane Frost', Defaults.talents);
export const ArcaneFireTalents = PresetUtils.makePresetTalents('Arcane Fire', SavedTalents.create({ talentsString: '0502205003100311531-230510301001-003' }));
export const FFBTalents = PresetUtils.makePresetTalents('FFB', SavedTalents.create({ talentsString: '-2355000013011503-2035010311013002' }));
export const FireTalents = PresetUtils.makePresetTalents('Fire', SavedTalents.create({ talentsString: '05022050001001-23550000130135031-003' }));
export const FrostTalents = PresetUtils.makePresetTalents('Frost', SavedTalents.create({ talentsString: '05022050011003--053500030100331251' }));

// What every build but Frost sets, from defaults.siml, so a build picked after Frost takes its range and the rest back.
export const DefaultSettings: PresetSettings = {
	name: 'Default',
	specOptions: Defaults.specOptions,
	consumables: Defaults.consumables,
	buffs: Defaults.individualBuffs,
	partyBuffs: Defaults.partyBuffs,
	raidBuffs: Defaults.raidBuffs,
	debuffs: Defaults.debuffs,
	playerOptions: {
		distanceFromTarget: Defaults.other?.distanceFromTarget,
		profession1: Defaults.other?.profession1,
		profession2: Defaults.other?.profession2,
		reactionTimeMs: Defaults.other?.reactionTime,
	},
};

export const ArcaneFrostBuild = PresetUtils.makePresetBuild('Arcane Frost', {
	gear: P1ArcaneGear,
	talents: ArcaneFrostTalents,
	//rotationType: APLRotationType.TypeAuto,
	rotation: ArcaneFrostAplPreset,
	settings: DefaultSettings,
});

export const ArcaneFireBuild = PresetUtils.makePresetBuild('Arcane Fire', {
	gear: P1ArcaneGear,
	talents: ArcaneFireTalents,
	//rotationType: APLRotationType.TypeAuto,
	rotation: ArcaneFireAplPreset,
	settings: DefaultSettings,
});

export const FFBBuild = PresetUtils.makePresetBuild('FFB', {
	gear: P1ArcaneGear,
	talents: FFBTalents,
	//rotationType: APLRotationType.TypeAuto,
	rotation: FFBAplPreset,
	settings: DefaultSettings,
});

export const FireBuild = PresetUtils.makePresetBuild('Fire', {
	gear: P1ArcaneGear,
	talents: FireTalents,
	//rotationType: APLRotationType.TypeAuto,
	rotation: FireAplPreset,
	settings: DefaultSettings,
});

export const FrostSettings: PresetSettings = {
	name: 'Frost',
	playerOptions: {
		distanceFromTarget: 10,
	},
};

export const FrostBuild = PresetUtils.makePresetBuild('Frost', {
	gear: P1ArcaneGear,
	talents: FrostTalents,
	//rotationType: APLRotationType.TypeAuto,
	rotation: FrostAplPreset,
	settings: FrostSettings,
});
