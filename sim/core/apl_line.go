package core

import (
	"fmt"
	"slices"

	"github.com/wowsims/forever/sim/core/proto"
)

// Gives every action of an APL rotation the path of its config line, counted from 1 with hidden lines
// included. Auto and Simple runs and the custom rotation of pets and targets get no lines; a rotation
// with no type runs as an APL and gets them.
func (rot *APLRotation) assignLines(config *proto.APLRotation) {
	if config.Type == proto.APLRotation_TypeAuto || config.Type == proto.APLRotation_TypeSimple {
		return
	}
	if len(rot.priorityList) == 1 {
		if _, ok := rot.priorityList[0].impl.(*APLActionCustomRotation); ok {
			return
		}
	}
	for i, action := range rot.prepullActions {
		rot.assignLine(action, fmt.Sprintf("prepull %d", rot.prepullIdxMap[i]+1))
	}
	for i, action := range rot.priorityList {
		rot.assignLine(action, fmt.Sprintf("priority %d", rot.priorityListIdxMap[i]+1))
	}
}

// A group's actions and a sequence's steps add their own segment; any other inner action runs for its
// parent's line. GetInnerActions lists every descendant, so the positional children go first.
func (rot *APLRotation) assignLine(action *APLAction, line string) {
	action.line = line
	switch impl := action.impl.(type) {
	case *APLActionGroupReference:
		if impl.group == nil {
			return
		}
		slot := slices.Index(rot.groups, impl.group)
		for i, groupAction := range impl.group.actions {
			rot.assignLine(groupAction, fmt.Sprintf("%s > group %d.%d", line, impl.group.configIdx+1, rot.groupListIdxMap[slot][i]+1))
		}
	case *APLActionSequence:
		for i, step := range impl.subactions {
			rot.assignLine(step, fmt.Sprintf("%s > step %d", line, impl.subactionIdx[i]+1))
		}
	case *APLActionStrictSequence:
		for i, step := range impl.subactions {
			rot.assignLine(step, fmt.Sprintf("%s > step %d", line, impl.subactionIdx[i]+1))
		}
	case *APLActionStrictMultidot:
		for _, target := range impl.actions {
			target.line = line
		}
	}
	for _, inner := range action.impl.GetInnerActions() {
		if inner.line == "" {
			rot.assignLine(inner, line)
		}
	}
}
