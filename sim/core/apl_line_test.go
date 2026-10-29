package core

import (
	"testing"
	"time"

	"github.com/wowsims/forever/sim/core/proto"
)

// Every action of an APL rotation names the line it was built from by the config's own positions: hidden
// rows count, a group segment names the group's place in the config rather than the sim's copy of it, and
// a step keeps its place when an earlier step fails to build. Auto and custom rotations name no line.
func TestAPLLinesFollowConfigPositions(t *testing.T) {
	const dotID, unknownID = 910105, 910106
	spellID := func(id int32) *proto.ActionID { return ActionID{SpellID: id}.ToProto() }
	cast := func(id int32) *proto.APLAction {
		return &proto.APLAction{Action: &proto.APLAction_CastSpell{CastSpell: &proto.APLActionCastSpell{SpellId: spellID(id)}}}
	}
	item := func(action *proto.APLAction) *proto.APLListItem { return &proto.APLListItem{Action: action} }
	groupRef := item(&proto.APLAction{Action: &proto.APLAction_GroupReference{GroupReference: &proto.APLActionGroupReference{GroupName: "b"}}})
	config := func(rotationType proto.APLRotation_Type) *proto.APLRotation {
		return &proto.APLRotation{
			Type:           rotationType,
			PrepullActions: []*proto.APLPrepullAction{{Action: cast(dotID), DoAtValue: constValue("-1s")}},
			PriorityList: []*proto.APLListItem{
				{Action: cast(dotID), Hide: true},
				item(cast(dotID)),
				groupRef,
				groupRef,
				item(&proto.APLAction{Action: &proto.APLAction_Schedule{Schedule: &proto.APLActionSchedule{Schedule: "0s", InnerAction: cast(dotID)}}}),
				item(&proto.APLAction{Action: &proto.APLAction_StrictMultidot{StrictMultidot: &proto.APLActionStrictMultidot{SpellId: spellID(dotID), MaxDots: 2}}}),
			},
			Groups: []*proto.APLGroup{
				{Name: "a", Actions: []*proto.APLListItem{item(cast(dotID))}},
				{Name: "b", Actions: []*proto.APLListItem{
					item(cast(dotID)),
					item(&proto.APLAction{Action: &proto.APLAction_Sequence{Sequence: &proto.APLActionSequence{
						Actions: []*proto.APLAction{cast(unknownID), cast(dotID), cast(dotID)},
					}}}),
				}},
			},
		}
	}

	request := fakeRageSimRequest()
	request.Encounter.Targets = append(request.Encounter.Targets, request.Encounter.Targets[0])
	sim := setupFakeRageSimFrom(request)
	fw := sim.Raid.Parties[0].Players[0].(*FakeRageWarrior)
	sim.Environment.State = Constructed
	fw.RegisterSpell(SpellConfig{
		ActionID: ActionID{SpellID: dotID},
		Flags:    SpellFlagAPL,
		Cast:     CastConfig{DefaultCast: Cast{GCD: GCDDefault}},
		Dot:      DotConfig{Aura: Aura{Label: "Test Dot"}, NumberOfTicks: 5, TickLength: 3 * time.Second},
	})

	want := func(action *APLAction, line string) {
		t.Helper()
		if action.line != line {
			t.Errorf("%s has line %q, want %q", action.impl, action.line, line)
		}
	}
	sequenceOf := func(ref *APLAction) *APLActionSequence {
		return ref.impl.(*APLActionGroupReference).group.actions[1].impl.(*APLActionSequence)
	}

	rot := fw.newAPLRotation(config(proto.APLRotation_TypeAPL))
	want(rot.priorityList[0], "priority 2")
	steps := sequenceOf(rot.priorityList[1]).subactions
	if len(steps) != 2 {
		t.Fatalf("sequence kept %d steps, want 2", len(steps))
	}
	want(steps[0], "priority 3 > group 2.2 > step 2")
	want(steps[1], "priority 3 > group 2.2 > step 3")
	want(rot.priorityList[2].impl.(*APLActionGroupReference).group.actions[1], "priority 4 > group 2.2")
	schedule := rot.priorityList[3]
	want(schedule, "priority 5")
	want(schedule.impl.(*APLActionSchedule).innerAction, "priority 5")
	multidot := rot.priorityList[4].impl.(*APLActionStrictMultidot)
	if len(multidot.actions) != 2 {
		t.Fatalf("strict multidot has %d actions, want 2", len(multidot.actions))
	}
	for _, action := range multidot.actions {
		want(action, "priority 6")
	}
	want(rot.prepullActions[0], "prepull 1")

	want(fw.newCustomRotation().priorityList[0], "")

	auto := fw.newAPLRotation(config(proto.APLRotation_TypeAuto))
	actions := append(auto.allAPLActions(), auto.allPrepullActions()...)
	actions = append(actions, auto.priorityList[4].impl.(*APLActionStrictMultidot).actions...)
	for _, action := range actions {
		want(action, "")
	}
}
