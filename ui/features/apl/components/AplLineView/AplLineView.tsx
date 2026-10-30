import { AplListItem, type HideableAction } from '@features/apl/components/AplListItem';
import { doAtConfig } from '@features/apl/components/PrePullList/do_at';
import { ValuePicker } from '@features/apl/components/ValuePicker';
import { AplProvider } from '@features/apl/context/AplContext';
import type { ResolvedAplLine } from '@features/apl/model/apl_line';
import type { InputConfig } from '@features/inputs/input';
import { APLListItem, APLPrepullAction } from '@generated/proto/apl';
import { usePlayer } from '@sim/context/SimHostContext';
import type { Player } from '@sim/player/player';
import { shallowArrayEquals, type StoreSubscribe } from '@sim/state/subscriptions';
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
	const prepull = line.kind === 'prepull';
	const { item, doAt } = useMemo(() => {
		const clone = prepull ? APLPrepullAction.clone(line.item as APLPrepullAction) : APLListItem.clone(line.item as APLListItem);
		const item: InputConfig<Player<any>, HideableAction> = { getValue: () => clone, setValue: ignore };
		const doAt = prepull ? <ValuePicker player={player} config={doAtConfig(() => (clone as APLPrepullAction).doAtValue, ignore)} /> : undefined;
		return { item, doAt };
	}, [line.item, prepull, player]);

	return (
		<div inert className="max-h-60 overflow-hidden mask-linear-180 mask-linear-from-52 mask-linear-to-60" data-testid="apl-line-view">
			<AplProvider changeSource={neverChanges} isPrepull={prepull} isGroup={line.kind === 'group'} markedSteps={line.steps}>
				<AplListItem player={player} config={item} leading={doAt} />
			</AplProvider>
		</div>
	);
};

// A line resolved again for the same cast is a new object around the same row of the run's rotation.
export const AplLineView = memo(AplLineViewImpl, (prev, next) => prev.line.item === next.line.item && shallowArrayEquals(prev.line.steps, next.line.steps));
