package siml

import (
	"slices"
	"testing"

	"github.com/wowsims/forever/sim/core/proto"
)

// Where an action casts, completion offers the spells the spec lets a rotation cast, and the parser refuses the
// others with the castable spell of the name as the quick fix. A value position takes either.
func TestCastPositionsTakeCastableSpells(t *testing.T) {
	names := &Names{Classes: map[proto.Class]SpellNames{proto.Class_ClassHunter: {NamespaceSpell: {
		"strike":      {SpellID: 900001, Tag: 1, RegisteredBy: []string{"hunter"}},
		"strike_tag0": {SpellID: 900001, RegisteredBy: []string{"hunter"}, UncastableBy: []string{"hunter"}},
	}}}}
	for _, text := range []string{"priority:\n  cast |\n", "priority:\n  channel |\n", "priority:\n  multidot(|\n"} {
		if got := labelsOf(completionsIn(t, names, nil, hunterPath, plainPreface+text)); !slices.Contains(got, "strike") || slices.Contains(got, "strike_tag0") {
			t.Errorf("%q offers %v, want strike and not strike_tag0", text, got)
		}
	}
	if got := labelsOf(completionsIn(t, names, nil, hunterPath, plainPreface+"priority:\n  cast strike if spell(|\n")); !slices.Contains(got, "strike_tag0") {
		t.Errorf("spell( offers %v, want strike_tag0 too", got)
	}

	text := plainPreface + "priority:\n  cast strike_tag0 if spell(strike_tag0).is_ready\n"
	d := Analyze(hunterPath, []byte(text), names, langOpen)
	diags := d.Diagnostics()
	if got, want := diagRows(diags), []diagRow{{4, "not-castable", 1}}; !slices.Equal(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
	if got, want := diags[0].Message, "strike_tag0 is a spell no hunter build lets a rotation cast; did you mean strike?"; got != want {
		t.Errorf("message %q, want %q", got, want)
	}
	if fixes := d.QuickFixes(Range{diags[0].Start, diags[0].End}); len(fixes) == 0 || fixes[0].Title != "Change to strike" {
		t.Errorf("quick fixes %v, want Change to strike", fixes)
	}
}

// An unknown name where an action casts suggests only the spells the spec lets a rotation cast; a value position
// suggests any.
func TestCastPositionsSuggestCastableSpells(t *testing.T) {
	names := &Names{Classes: map[proto.Class]SpellNames{proto.Class_ClassHunter: {NamespaceSpell: {
		"strike":      {SpellID: 900001, Tag: 1, RegisteredBy: []string{"hunter"}},
		"strike_tag0": {SpellID: 900001, RegisteredBy: []string{"hunter"}, UncastableBy: []string{"hunter"}},
	}}}}
	text := plainPreface + "priority:\n  cast strike_tag1 if spell(strike_tag1).is_ready\n"
	var got []string
	for _, x := range Analyze(hunterPath, []byte(text), names, langOpen).Diagnostics() {
		got = append(got, x.Message)
	}
	if want := []string{"no spell is named strike_tag1", "no spell is named strike_tag1; did you mean strike_tag0?"}; !slices.Equal(got, want) {
		t.Errorf("got %q, want %q", got, want)
	}
}
