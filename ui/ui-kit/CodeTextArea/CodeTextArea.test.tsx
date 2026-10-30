import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CodeTextArea } from './CodeTextArea';

// The tests load no locale, so the position reads as its key unless the values are written in here.
vi.mock('@i18n/config', () => ({
	default: { t: (_key: string, { line, column, count }: Record<string, number>) => `Ln ${line}, Col ${column} · ${count} lines` },
}));

const TEXT = '{\n  "player": {\n    "name": "Player"\n  }\n}';

const position = (line: number, column: number, count: number) => `Ln ${line}, Col ${column} · ${count} lines`;

const Editable = ({ initial = TEXT, onChange }: { initial?: string; onChange?: (value: string) => void }) => {
	const [value, setValue] = useState(initial);
	return (
		<CodeTextArea
			value={value}
			testId="code"
			onChange={next => {
				setValue(next);
				onChange?.(next);
			}}
		/>
	);
};

const textarea = () => screen.getByTestId<HTMLTextAreaElement>('code');
const currentNumber = (container: HTMLElement) => container.querySelector('[data-current]')!.textContent;

const moveCursor = (start: number, end = start) =>
	act(() => {
		textarea().setSelectionRange(start, end);
		document.dispatchEvent(new Event('selectionchange'));
	});

describe('CodeTextArea', () => {
	it('forwards ref and testId to the textarea and turns wrapping off', () => {
		const ref = createRef<HTMLTextAreaElement>();
		render(<CodeTextArea ref={ref} value={TEXT} testId="code" spellCheck={false} readOnly />);
		expect(ref.current).toBe(textarea());
		expect(textarea().getAttribute('wrap')).toBe('off');
		expect(textarea().getAttribute('spellcheck')).toBe('false');
		expect(textarea().value).toBe(TEXT);
	});

	it('numbers every line, and shows the start until it is first focused', () => {
		const { container } = render(<Editable />);
		expect(screen.getByText(position(1, 1, 5))).toBeTruthy();
		expect(currentNumber(container)).toBe('1');
		expect(container.querySelector('[aria-hidden]')!.textContent).toBe('1\n2\n3\n4\n5');
	});

	it('hands typed text to onChange and follows the cursor through it', () => {
		const onChange = vi.fn();
		const { container } = render(<Editable onChange={onChange} />);
		act(() => textarea().focus());
		textarea().setSelectionRange(TEXT.length, TEXT.length);
		fireEvent.change(textarea(), { target: { value: `${TEXT}\nab` } });
		expect(onChange).toHaveBeenCalledWith(`${TEXT}\nab`);
		expect(screen.getByText(position(6, 3, 6))).toBeTruthy();
		expect(currentNumber(container)).toBe('6');
	});

	it('follows a click', () => {
		render(<Editable />);
		act(() => textarea().focus());
		textarea().setSelectionRange(5, 5);
		fireEvent.click(textarea());
		expect(screen.getByText(position(2, 4, 5))).toBeTruthy();
	});

	it('follows arrow keys and selections while focused, at the end the selection moves', () => {
		const { container } = render(<Editable />);
		act(() => textarea().focus());
		moveCursor(TEXT.indexOf('"name"'));
		expect(screen.getByText(position(3, 5, 5))).toBeTruthy();
		expect(currentNumber(container)).toBe('3');

		act(() => {
			textarea().setSelectionRange(2, TEXT.indexOf('}'), 'backward');
			document.dispatchEvent(new Event('selectionchange'));
		});
		expect(screen.getByText(position(2, 1, 5))).toBeTruthy();
	});

	it('stops listening for selection changes once blurred', () => {
		render(<Editable />);
		act(() => textarea().focus());
		moveCursor(5);
		act(() => textarea().blur());
		moveCursor(TEXT.length);
		expect(screen.getByText(position(2, 4, 5))).toBeTruthy();
	});

	it('counts the lines of a value set from outside', () => {
		const { rerender, container } = render(<CodeTextArea value="one" testId="code" />);
		expect(screen.getByText(position(1, 1, 1))).toBeTruthy();
		rerender(<CodeTextArea value={'one\ntwo\nthree'} testId="code" />);
		expect(screen.getByText(position(1, 1, 3))).toBeTruthy();
		expect(container.querySelector('[aria-hidden]')!.textContent).toBe('1\n2\n3');
	});
});
