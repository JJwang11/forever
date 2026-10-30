import i18n from '@i18n/config';
import clsx, { type ClassValue } from 'clsx';
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';

type OwnProps = 'className' | 'value' | 'defaultValue' | 'onChange' | 'wrap' | 'onScroll' | 'onFocus' | 'onBlur' | 'onClick' | 'onKeyUp';

export interface CodeTextAreaProps extends Omit<ComponentPropsWithoutRef<'textarea'>, OwnProps> {
	value: string;
	onChange?: (value: string) => void;
	/** Sizes the frame; the text fills it. */
	className?: ClassValue;
	testId?: string;
}

const countLines = (text: string) => {
	let lines = 1;
	for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) lines++;
	return lines;
};

/**
 * A monospace text box for data files: line numbers beside the text, no wrapping, the cursor's line tinted and its
 * position in the bottom-right corner.
 */
export const CodeTextArea = forwardRef<HTMLTextAreaElement, CodeTextAreaProps>(({ value, onChange, className, testId, ...props }, ref) => {
	const frame = useRef<HTMLDivElement>(null);
	const input = useRef<HTMLTextAreaElement>(null);
	useImperativeHandle(ref, () => input.current!, []);

	// The cursor offset, which stays at the start until the box is first focused: setting a textarea's value moves its
	// selection to the end, so an export would open on its last line.
	const [cursor, setCursor] = useState(0);
	const [focused, setFocused] = useState(false);
	const touched = useRef(false);
	const readCursor = useCallback(() => {
		const element = input.current;
		if (!element || !touched.current) return;
		setCursor(element.selectionDirection === 'backward' ? element.selectionStart : element.selectionEnd);
	}, []);

	// The scroll offset and the scrollbar sizes go straight to CSS variables, so scrolling renders nothing.
	const place = useCallback(() => {
		const element = input.current;
		const style = frame.current?.style;
		if (!element || !style) return;
		style.setProperty('--ui-code-scroll-top', `${element.scrollTop}px`);
		style.setProperty('--ui-code-scrollbar-x', `${element.offsetHeight - element.clientHeight}px`);
		style.setProperty('--ui-code-scrollbar-y', `${element.offsetWidth - element.clientWidth}px`);
	}, []);

	// A value written from outside fires no input event, so the cursor and the scrollbars are read again after each one.
	useLayoutEffect(() => {
		readCursor();
		place();
	}, [value, readCursor, place]);

	useLayoutEffect(() => {
		const observer = new ResizeObserver(place);
		observer.observe(input.current!);
		return () => observer.disconnect();
	}, [place]);

	// Arrow keys and selections move the cursor with no input or click event; only `document` gets a `selectionchange`.
	useEffect(() => {
		if (!focused) return;
		document.addEventListener('selectionchange', readCursor);
		return () => document.removeEventListener('selectionchange', readCursor);
	}, [focused, readCursor]);

	const lineCount = useMemo(() => countLines(value), [value]);
	const { line, column } = useMemo(() => {
		const before = value.slice(0, cursor);
		return { line: countLines(before), column: cursor - before.lastIndexOf('\n') };
	}, [value, cursor]);
	const gutter = useMemo(() => {
		const numbers = Array.from({ length: lineCount }, (_, i) => i + 1);
		return { before: numbers.slice(0, line - 1).join('\n'), after: numbers.slice(line).join('\n') };
	}, [lineCount, line]);

	return (
		<div ref={frame} className={clsx('ui-code-text-area', className)} style={{ '--ui-code-line': line - 1 } as CSSProperties}>
			<div className="ui-code-text-area-line" />
			<div className="ui-code-text-area-gutter" aria-hidden>
				<div className="ui-code-text-area-numbers">
					{gutter.before && `${gutter.before}\n`}
					<span data-current="">{line}</span>
					{gutter.after && `\n${gutter.after}`}
				</div>
			</div>
			<textarea
				{...props}
				ref={input}
				value={value}
				wrap="off"
				data-testid={testId}
				className="ui-code-text-area-input"
				onChange={event => {
					onChange?.(event.currentTarget.value);
					readCursor();
				}}
				onFocus={() => {
					touched.current = true;
					setFocused(true);
					readCursor();
				}}
				onBlur={() => setFocused(false)}
				onClick={readCursor}
				onKeyUp={readCursor}
				onScroll={place}
			/>
			<div className="ui-code-text-area-position" aria-hidden>
				{i18n.t('common.code_text_area.position', { line, column, count: lineCount })}
			</div>
		</div>
	);
});
CodeTextArea.displayName = 'CodeTextArea';
