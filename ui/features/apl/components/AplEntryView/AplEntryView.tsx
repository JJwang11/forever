import { AplListItem, type HideableAction } from '@features/apl/components/AplListItem';
import { doAtConfig } from '@features/apl/components/PrePullList/do_at';
import { ValuePicker } from '@features/apl/components/ValuePicker';
import { AplProvider } from '@features/apl/context/AplContext';
import type { ResolvedAplEntry } from '@features/apl/model/apl_entry';
import type { InputConfig } from '@features/inputs/input';
import { APLListItem, APLPrepullAction } from '@generated/proto/apl';
import { usePlayer } from '@sim/context/SimHostContext';
import type { Player } from '@sim/player/player';
import { shallowArrayEquals, type StoreSubscribe } from '@sim/state/subscriptions';
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';

const never: StoreSubscribe = () => () => {};
const neverChanges = () => never;
const ignore = () => {};

/**
 * One APL entry as the editor draws it, at full contrast, that nothing can change. The pickers write to a clone of
 * the entry, and some of their paths still call `touchRotation` or write `valueVariables`; `inert`, with the
 * tooltip's `pointer-events-none`, keeps every picker shut so the rotation it came from stays as it ran.
 * The height is capped at three picker rows and starts at the marked step of a sequence, so the step that fired
 * shows; only an entry cut off below fades out at the bottom.
 */
const AplEntryViewImpl = ({ entry }: { entry: ResolvedAplEntry }) => {
	const player = usePlayer();
	const root = useRef<HTMLDivElement>(null);
	const [clipped, setClipped] = useState(false);
	useLayoutEffect(() => {
		const element = root.current;
		if (!element) return;
		const measure = () => {
			const marked = element.querySelector<HTMLElement>('[data-marked]');
			element.scrollTop = marked ? marked.getBoundingClientRect().top - element.getBoundingClientRect().top + element.scrollTop : 0;
			setClipped(element.scrollHeight - element.scrollTop > element.clientHeight + 1);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	const prepull = entry.kind === 'prepull';
	const { item, doAt } = useMemo(() => {
		const clone = prepull ? APLPrepullAction.clone(entry.item as APLPrepullAction) : APLListItem.clone(entry.item as APLListItem);
		const item: InputConfig<Player<any>, HideableAction> = { getValue: () => clone, setValue: ignore };
		const doAt = prepull ? <ValuePicker player={player} config={doAtConfig(() => (clone as APLPrepullAction).doAtValue, ignore)} /> : undefined;
		return { item, doAt };
	}, [entry.item, prepull, player]);

	return (
		<div
			ref={root}
			inert
			data-clipped={clipped ? '' : undefined}
			className="max-h-24 overflow-hidden data-clipped:mask-linear-180 data-clipped:mask-linear-from-16 data-clipped:mask-linear-to-24"
			data-testid="apl-entry-view">
			<AplProvider changeSource={neverChanges} isPrepull={prepull} isGroup={entry.kind === 'group'} markedSteps={entry.stepIndexes}>
				<AplListItem player={player} config={item} leading={doAt} />
			</AplProvider>
		</div>
	);
};

// An entry resolved again for the same cast is a new object around the same row of the run's rotation.
export const AplEntryView = memo(
	AplEntryViewImpl,
	(prev, next) => prev.entry.item === next.entry.item && shallowArrayEquals(prev.entry.stepIndexes, next.entry.stepIndexes),
);
