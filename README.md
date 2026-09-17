# House State

Build your house's state tree in Home Assistant. Every state, parent, scene,
overlay and automation role is configurable. The integration owns scene
application and publishes native selects for dashboards, voice and automations.
English and Norwegian Bokmål settings are included.

## Install

Requires Home Assistant **2026.2 or later**. Add
`https://github.com/mvheimburg/house-state` as a HACS custom repository with
category **Integration**, install and restart Home Assistant. Alternatively,
copy `custom_components/house_state` into your HA configuration's
`custom_components` directory. Add **House State** under Settings → Devices &
services. One entry represents one house; multiple houses are independent.

The optional [House State card](https://github.com/mvheimburg/lovelace-house-state)
provides a visual tree editor and a compact view of the active path. The
integration also works without that card, including with Bubble select cards.

## Build your tree

The editable starter template is Home → Day → None/TV/Eating, Home → Night,
Away, and Vacation. These names and IDs carry no built-in behavior. Add roots,
children and deeper levels; move or rename nodes; assign a scene at any level.
Use the card's settings, the integration options flow's JSON fields, or the
`house_state.set_config` action.

Selecting a node follows its `default_child` recursively. Without a default,
the selected parent can remain active itself. Scene resolution walks from the
active node toward its root, using the first configured scene. A configured
overlay scene runs afterwards and works in any state.

`occupied` means someone is home. A node can set true, false, or null to inherit
from its nearest ancestor; without an explicit ancestor it is false. Automation
roles refer to node IDs: arrival/night must resolve occupied, and
departure/vacation must resolve unoccupied. Set any role to null to disable it.
Defaults are an arrival role on `home`, departure on `away`, vacation on
`vacation`, and night on `night`.

Configuration edits **do not apply scenes**. Use **Apply scene now** afterwards
if needed. Removing the active node selects the initial state and follows its
defaults; removing the active overlay selects `none`. Node renames preserve the
active ID and timestamp. Native branch selects are added/removed automatically.

## Entities

For an entry named House, defaults are:

| Entity | Purpose |
|---|---|
| `sensor.house_state` | Hub, whose state is the active node ID |
| `select.house_state` | Root state IDs |
| `select.house_home`, `select.house_day` | Direct children of each configured parent |
| `select.house_overlay` | `none` plus configured overlay IDs, and `auto` where rules exist |
| `binary_sensor.house_occupied` | Inherited occupancy |

Branch selects are unavailable while their parent is not on the active path.
Every node with children gets a select. Entity IDs derive from configured names
when first created; Home Assistant retains them after renaming. Select options
use stable IDs; the card displays the configurable names.

The hub attributes are `state`, `active_path` (root to leaf IDs), `state_tree`,
`overlays`, `overlay`, `overlay_choice`, `overlay_rule`, `overlay_hold_until`,
`scene_stale`, `occupied`, `last_scene`, `last_changed_by`, `since`,
`previous_state`, `application_pending`, `scene_warnings`, `config`,
`auto_return_enabled`, `night_schedule`, and `available_overlays`.

## Actions

All actions target the hub sensor; normal HA entity/device/area targeting is
supported. Use the sensor ID for an unambiguous single-house target.

```yaml
action: house_state.set
target:
  entity_id: sensor.house_state
data:
  state: tv
  overlay: christmas
  reason: user
```

| Action | Fields |
|---|---|
| `house_state.set` | `state` and/or `overlay`, optional `reason`, `force` (false) |
| `house_state.arrive` | optional `reason`; no-op when already occupied |
| `house_state.depart` | `vacation` (false), optional `reason` |
| `house_state.apply_scene` | `force` (true) |
| `house_state.set_config` | Any configuration fields below |

Reasons are `user`, `door`, `gate`, `presence`, `schedule`, `service` (default).
Explicit arrive/depart actions reject a disabled role. Automated triggers ignore
disabled roles. A single set call selects the entire path and applies one base
scene, then the overlay; it never fires all intermediate scenes.

Dedupe compares the resolved base/overlay pair. Selecting a different node
whose scenes are identical updates state but does not call scenes again.
Changing an overlay reapplies the base and then the new overlay. Turning an
overlay off does not reverse its actions: put the desired reset behavior in the
base scene. `force: true` resynchronizes devices.

## Configuration schema

`set_config` accepts any subset. Arrays and objects replace the entire field;
update tree, roles and initial state together when removing referenced nodes.
Other options are preserved. Everything is validated before saving.

```yaml
action: house_state.set_config
target:
  entity_id: sensor.house_state
data:
  state_tree:
    - {id: here, name: At home, parent: null, scene: "", default_child: relax, occupied: true}
    - {id: relax, name: Relaxing, parent: here, scene: "", default_child: null, occupied: null}
    - {id: sleep, name: Sleeping, parent: here, scene: "", default_child: null, occupied: null}
    - {id: out, name: Out, parent: null, scene: "", default_child: null, occupied: false}
  initial_state: here
  roles: {arrival: here, departure: out, vacation: null, night: sleep}
  overlays:
    - {id: guests, name: Guests, scene: ""}
    - {id: christmas, name: Christmas, scene: "", dates: {type: fixed, from: "12-01", to: "12-26"}}
    - {id: birthday, name: Birthday, calendar: calendar.family, priority: 1}
  door_entities: [lock.front_door]
  gate_entities: [cover.garage]
  person_entities: [person.alex]
  auto_return: true
  auto_away: false
  auto_away_grace: 300
  night_schedule: {type: fixed, time: "22:00:00"}
  legacy_mirror: {}
```

IDs match `[a-z][a-z0-9_]*` with at most 64 characters. Names are nonempty and
at most 100 characters. Parents/default children/roles must exist; a default
child must be directly below its parent. Cycles, duplicates and unknown fields
are rejected. At least one state is required. Overlay IDs `none` and `auto` are
reserved.
Every nonempty scene must be an existing scene entity. Missing entities inside
scenes produce warnings in setup/options and in `scene_warnings`; they do not
prevent saving the scene. Options flows expose structured JSON; the card offers
a visual editor for these same fields.

Defaults: auto-return true, auto-away false, 300-second grace, empty trigger
entity lists, schedule off, no legacy mirrors. Schedules accept `{type: off}`, a
fixed local HA time `{type: fixed, time: "22:00:00"}`, or
`{type: sun, event: sunset, offset: -1800}`. Sun event can be sunrise or sunset;
offset is signed seconds, within ±86400. HA location/timezone determines times.

Door return requires locked/unlocking → unlocked. Gate return requires a known
closed → opening/open transition. Person arrival selects the arrival role.
Auto-away waits until all configured persons have known non-home states for the
full grace period; unknown, unavailable or missing persons cancel that timer.
The night schedule selects its role only while occupied and outside that role's
subtree. Grace timers and listeners are canceled on unload/options changes; a
new grace period starts after reload if everyone is still away.

## Date-driven overlays

An overlay is a **mode** that consumers read, plus an **optional scene**. Leave
`scene` empty and the overlay is a pure label: it changes what a doorbell plays
or a dashboard theme shows, and house-state touches no devices at all.

An overlay with a `calendar` or a `dates` rule turns itself on:

```yaml
overlays:
  - {id: birthday, name: Birthday, scene: "", calendar: calendar.family_birthdays}
  - {id: christmas, name: Christmas, scene: "", calendar: calendar.seasons, match: "^jul"}
  - {id: halloween, name: Halloween, scene: "", dates: {type: fixed, from: "10-25", to: "11-01"}}
  - {id: easter, name: Easter, scene: "", dates: {type: easter, from: -7, to: 1}}
  - {id: advent, name: Advent, scene: "", dates: {type: nth_weekday, weekday: sun, nth: -4, anchor: "12-25", days: 28}}
```

`calendar` is any calendar entity — the Holiday integration, a Local Calendar,
Google, CalDAV. The overlay is active while an event is running on it; `match`
is a case-insensitive regular expression tested against event summaries, which
matters because holiday summaries are generated rather than chosen, and are
translated with Home Assistant's language. An overlay takes a calendar or
dates, never both.

`dates` types, all evaluated against local dates:

| Type | Fields | Window |
|---|---|---|
| `fixed` | `from`, `to` as `MM-DD` | inclusive; wraps New Year when `to` precedes `from` |
| `easter` | `from`, `to` as day offsets (±180) | around computed Easter Sunday |
| `nth_weekday` | `weekday`, `nth` (±1–5), one of `month` or `anchor`, `days` (1) | `days` long from the computed day |

Easter is the reason date rules exist at all: it moves 25 days and no calendar
recurrence expresses it. `nth_weekday` with an `anchor` counts weekdays strictly
before (negative `nth`) or after (positive) that date, which is what Advent
actually is — the fourth Sunday before 25 December, not a fixed Sunday of
December.

`when_occupied: true|false` and `when_state: [id, ...]` restrict a rule; a state
ID matches anywhere on the active path, so naming a parent covers its subtree.
Overlapping rules resolve by `priority` (higher wins, default 0) and then by
configuration order, so a birthday can beat a four-week Christmas.

### Rules set the mode; people and events apply the scene

A rule-driven change is **quiet**: it publishes the overlay immediately and
fires `overlay_changed`, but does not call any scene. The deferred scene lands
on the next application that was going to happen anyway — someone comes home,
the night schedule fires, a state is selected, or **Apply scene now** is used.
So the mode flips at midnight on 1 December while the tree comes on when
somebody walks in. `scene_stale` is true during that window.

A change you make by hand is eager and applies scenes at once. To make an
overlay scene land at a specific hour, write an automation on `overlay` — that
is a consumer's decision, not the hub's.

### The overlay select has three kinds of option

`auto` follows the rules and is offered only when at least one overlay defines
one. `none` means *not today* and outranks every rule. Any overlay ID is an
explicit choice.

A hand-picked choice holds until the start of the next local day, published as
`overlay_hold_until`, and survives a restart, so a 22:00 reboot does not
reinstate Christmas. A rule window opening during a hold does not take over.
Selecting `auto` hands the axis back immediately. With no rules configured there
is nothing to hand back to, and a choice never expires.

`overlay` is the overlay in force, `overlay_choice` is what is selected on the
axis, and `overlay_rule` is what the rules would pick right now.

Rules are re-evaluated at startup, at local midnight, when a configured calendar
entity changes, on configuration reload, and as part of every state transition,
so `when_state` and `when_occupied` resolve together with the state change
rather than costing a second scene application. A calendar that cannot be read
keeps the previous answer and logs a warning instead of flapping an overlay off.

## Persistence and events

Desired state, overlay, timestamp and a pending marker are saved before scenes
run. A failed scene leaves the desired selection visible and pending; retry
using Apply scene now, a state request, or the next HA restart. A replay can
repeat a scene that succeeded before a crash; exactly-once device effects are
not guaranteed. Configuration reloads do not replay scenes. A config change that
invalidates the desired scene pair clears pending and dedupe history, leaving
manual application to you; name changes retain genuine failed-scene pending.

The `house_state_event` bus event includes `entity_id` and `type`: `changed`
(state, active_path, overlay, previous, reason), `arrived`/`departed` (occupied
boundary, reason), `overlay_changed`, `rejected` (field/value/because), and
`scene_applied` (scene, resolved_from node ID, overlay_scene).

## Migration from helpers and scene automations

1. Install the integration and map your existing scenes onto the starter tree,
   or create your own tree. Create a missing come-home scene or leave it empty.
2. Fix stale entities inside scenes (for example old lock or garage IDs); review
   the setup warnings.
3. Repoint dashboards to the new native selects or install the companion card.
4. Disable previous automations/AppDaemon apps that call the same scenes on
   helper changes, including any old Leave home automation, to avoid duplicates.
5. Update automations to read `active_path`, `occupied`, `overlay` or the active
   state ID. There are no fixed presence/day/night attributes in a custom tree.
6. For a temporary single-helper mirror, configure
   `legacy_mirror: {state: input_select.house_state, overlay: input_select.party_modes}`.
   A helper must offer the leaf ID or its exact display name; unmatched options
   warn without interrupting state. Separate legacy presence/day-night helpers
   require template sensors or migration automations based on `active_path`.
7. Decide how old holiday switches/doorbell modes relate to your overlay, then
   remove unused helpers after verifying all consumers have migrated. Season and
   holiday automations usually become overlay rules; rename any overlay with the
   ID `auto`, which is now reserved.

Installation never edits production scenes, helpers or other configuration.

## Development and release

Python 3.13, `pip install -r requirements_test.txt`, then:

```sh
python -m pytest -q
ruff check custom_components tests
```

Tests run against real Home Assistant 2026.2.3. CI checks tests, Ruff, manifest
version parity, hassfest and HACS. Version `0.2.0` is synchronized in
`pyproject.toml` and the manifest. Pushing a version bump to main runs CI and
then creates `v<version>` plus a `house_state.zip` GitHub release. No release is
created by local tests or commits.
