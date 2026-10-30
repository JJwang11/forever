import type { ResolvedIcon } from '@ui-kit/Field/types';
import { IconSwatch } from '@ui-kit/IconSwatch';
import clsx from 'clsx';
import type { MouseEventHandler } from 'react';

export interface ImprovedAnchorProps {
	icon: ResolvedIcon;
	testId: string;
	active: boolean;
	disabled?: boolean;
	/** Which bottom corner of the icon the badge sits in: the two improved badges share the box and must not stack. */
	corner: 'left' | 'right';
	onActivate: () => void;
	onContextMenu: MouseEventHandler;
	onMouseDown: MouseEventHandler;
}

/** The corner and lit state of an improved badge, shared by the clickable anchor and the display-only badge on a multi icon trigger. */
export const improvedBadgeClass = (corner: 'left' | 'right', active: boolean) =>
	clsx('absolute bottom-0 size-4 min-w-4', corner === 'left' ? 'left-px' : 'right-0', !active && 'border-gray-600 grayscale');

export const ImprovedAnchor = ({ icon, testId, active, disabled, corner, ...events }: ImprovedAnchorProps) => (
	<IconSwatch icon={icon} href={icon.href} active={active} disabled={disabled} testId={testId} className={improvedBadgeClass(corner, active)} {...events} />
);
