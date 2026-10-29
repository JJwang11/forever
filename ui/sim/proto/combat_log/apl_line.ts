export type AplLineSegment =
	| { readonly kind: 'prepull' | 'priority' | 'step'; readonly index: number }
	| { readonly kind: 'group'; readonly group: number; readonly index: number };

// The path from a rotation's top-level list down to the action that launched a cast, with 0-based indexes.
export type AplLinePath = ReadonlyArray<AplLineSegment>;

const INDEX = /^[1-9]\d*$/;

function parseSegment(text: string): AplLineSegment | null {
	const parts = text.split(' ');
	if (parts.length !== 2) return null;
	const [kind, position] = parts;
	if (kind === 'prepull' || kind === 'priority' || kind === 'step') {
		return INDEX.test(position) ? { kind, index: parseInt(position, 10) - 1 } : null;
	}
	if (kind === 'group') {
		const [group, index, ...rest] = position.split('.');
		if (rest.length || !INDEX.test(group) || !INDEX.test(index ?? '')) return null;
		return { kind, group: parseInt(group, 10) - 1, index: parseInt(index, 10) - 1 };
	}
	return null;
}

/** The text after "APL: " on a Casting line: segments joined by " > ", positions counted from 1. Null when any segment is malformed. */
export function parseAplLine(text: string): AplLinePath | null {
	const path: Array<AplLineSegment> = [];
	for (const part of text.split(' > ')) {
		const segment = parseSegment(part.trim());
		if (!segment) return null;
		path.push(segment);
	}
	return path;
}

export function aplLineKey(path: AplLinePath): string {
	return path.map(segment => (segment.kind === 'group' ? `group ${segment.group}.${segment.index}` : `${segment.kind} ${segment.index}`)).join(' > ');
}
