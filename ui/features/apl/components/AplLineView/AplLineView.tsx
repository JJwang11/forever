import { AplListItem, type HideableAction } from '@features/apl/components/AplListItem';
import { ValuePicker } from '@features/apl/components/ValuePicker';
import { AplProvider } from '@features/apl/context/AplContext';
import type { ResolvedAplLine } from '@features/apl/model/apl_line';
import type { InputConfig } from '@features/inputs/input';
import { APLListItem, APLPrepullAction } from '@generated/proto/apl';
import i18n from '@i18n/config';
import { usePlayer } from '@sim/context/SimHostContext';
import type { Player } from '@sim/player/player';
import type { StoreSubscribe } from '@sim/state/subscriptions';
import { memo, useMemo } from 'react';

const never: StoreSubscribe = () => () => {};
const neverChanges = () => never;
const ignore = () => {};

/**
 * One APL line as the editor draws it, at full contrast, that nothing can change. The pickers write to a clone of
 * the line, and some of their paths still call `touchRotation` or write `valueVariables`; `inert`, with the
 * tooltip's `pointer-events-none`, keeps every picker shut so the rotation it came from stays as it ran.
 * The height is capped, and a line cut off by the cap fades out at the bottom.
 */
const AplLineViewImpl = ({ line }: { line: ResolvedAplLine }) => {
	const player = usePlayer();
	const { item, doAt } = useMemo(() => {
		const clone = line.prepull ? APLPrepullAction.clone(line.item as APLPrepullAction) : APLListItem.clone(line.item as APLListItem);
		const item: InputConfig<Player<any>, HideableAction> = { getValue: () => clone, setValue: ignore };
		const doAt = line.prepull ? (
			<ValuePicker
				player={player}
				config={{
					label: i18n.t('rotation_tab.apl.prepull_actions.do_at.label'),
					labelTooltip: i18n.t('rotation_tab.apl.prepull_actions.do_at.tooltip'),
					extraClassNames: ['w-auto'],
					layout: 'inline',
					getValue: () => (clone as APLPrepullAction).doAtValue,
					setValue: ignore,
				}}
			/>
		) : undefined;
		return { item, doAt };
	}, [line.item, line.prepull, player]);

	return (
		<div inert className="max-h-60 overflow-hidden mask-linear-180 mask-linear-from-52 mask-linear-to-60" data-testid="apl-line-view">
			<AplProvider changeSource={neverChanges} isPrepull={line.prepull} isGroup={line.pane === 'apl-action-groups'} markedSteps={line.steps}>
				<AplListItem player={player} config={item} leading={doAt} />
			</AplProvider>
		</div>
	);
};

const sameSteps = (a: ReadonlyArray<number>, b: ReadonlyArray<number>) => a.length === b.length && a.every((step, i) => step === b[i]);

// A line resolved again for the same cast is a new object around the same row of the run's rotation.
export const AplLineView = memo(AplLineViewImpl, (prev, next) => prev.line.item === next.line.item && sameSteps(prev.line.steps, next.line.steps));
