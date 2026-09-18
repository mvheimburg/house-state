"""Structured, draft-based House State settings."""

from copy import deepcopy

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import selector

from .config import _NODE, _overlay_rule, scene_warnings, validate_config
from .const import DEFAULTS, MAX_DURATION, RESERVED_OVERLAYS, ROLE_KEYS
from .rules import WEEKDAYS


def select(options, *, key=None, multiple=False):
    return selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=options,
            multiple=multiple,
            **({"translation_key": key} if key else {}),
            mode=selector.SelectSelectorMode.DROPDOWN,
        )
    )


def entity(domain, *, multiple=False):
    return selector.EntitySelector(selector.EntitySelectorConfig(domain=domain, multiple=multiple))


def number(low, high, unit=None):
    return selector.NumberSelector(
        selector.NumberSelectorConfig(
            min=low,
            max=high,
            step=1,
            mode=selector.NumberSelectorMode.BOX,
            **({"unit_of_measurement": unit} if unit else {}),
        )
    )


def optional_entity(key, value):
    return vol.Optional(key, description={"suggested_value": value} if value else {})


def field(key, default):
    return vol.Optional(key, default=default)


class HouseOptionsFlow(config_entries.OptionsFlow):
    """Keep all changes isolated until Save and warning acknowledgement."""

    def __init__(self):
        self._draft = None
        self._state_id = None
        self._overlay_id = None
        self._overlay = None
        self._rule_kind = "manual"
        self._pending = None

    def form(self, step, fields, errors=None, placeholders=None):
        fields[field("back", False)] = selector.BooleanSelector()
        return self.async_show_form(
            step_id=step,
            data_schema=vol.Schema(fields),
            errors=errors or {},
            description_placeholders=placeholders or {},
        )

    def choices(self, *, empty=False, exclude=(), items=None):
        rows = self._draft["state_tree"] if items is None else items
        return ([{"value": "", "label": "—"}] if empty else []) + [
            {"value": item["id"], "label": f"{item['name']} ({item['id']})"}
            for item in rows
            if item["id"] not in exclude
        ]

    def descendants(self, state_id):
        if state_id is None:
            return set()
        excluded = {state_id}
        while True:
            found = {
                node["id"] for node in self._draft["state_tree"] if node.get("parent") in excluded
            }
            if found <= excluded:
                return excluded
            excluded |= found

    async def async_step_init(self, user_input=None):
        if self._draft is None:
            self._draft = deepcopy(DEFAULTS) | deepcopy(dict(self.config_entry.options))
        return self.async_show_menu(
            step_id="init",
            menu_options=[
                "states",
                "general",
                "overlays",
                "presence",
                "visits",
                "night",
                "legacy",
                "save",
                "discard",
            ],
        )

    async def async_step_discard(self, user_input=None):
        return self.async_abort(reason="discarded")

    async def async_step_states(self, user_input=None):
        return self.async_show_menu(
            step_id="states",
            menu_options=[
                "state_add",
                "state_edit",
                "state_remove",
                "init",
            ],
        )

    async def async_step_state_add(self, user_input=None):
        self._state_id = None
        return await self.state_form("state_add", user_input)

    async def async_step_state_edit(self, user_input=None):
        if user_input is not None:
            if user_input.get("back"):
                return await self.async_step_states()
            self._state_id = user_input["state"]
            return await self.async_step_state_details()
        return self.form(
            "state_edit",
            {field("state", self._draft["state_tree"][0]["id"]): select(self.choices())},
        )

    async def async_step_state_details(self, user_input=None):
        return await self.state_form("state_details", user_input)

    async def state_form(self, step, user_input):
        rows = self._draft["state_tree"]
        node = next((n for n in rows if n["id"] == self._state_id), {})
        errors = {}
        values = {
            "id": node.get("id", ""),
            "name": node.get("name", ""),
            "parent": node.get("parent") or "",
            "scene": node.get("scene", ""),
            "default_child": node.get("default_child") or "",
            "occupied": {None: "inherit", True: "occupied", False: "unoccupied"}[
                node.get("occupied")
            ],
        }
        if user_input is not None:
            if user_input.get("back"):
                return await self.async_step_states()
            values |= user_input
            values["scene"] = user_input.get("scene", "")
            proposed = deepcopy(node) | {
                "id": self._state_id or values["id"],
                "name": values["name"],
                "parent": values["parent"] or None,
                "scene": values["scene"],
                "default_child": values["default_child"] or None,
                "occupied": {"inherit": None, "occupied": True, "unoccupied": False}[
                    values["occupied"]
                ],
            }
            try:
                # Preserve unknown stored fields so final validation can expose them.
                _NODE(
                    {
                        key: value
                        for key, value in proposed.items()
                        if key in {"id", "name", "parent", "scene", "default_child", "occupied"}
                    }
                )
                if not self._state_id and any(n["id"] == proposed["id"] for n in rows):
                    raise vol.Invalid("duplicate")
                if proposed["parent"] in self.descendants(proposed["id"]):
                    raise vol.Invalid("cycle")
                if proposed["parent"] and proposed["parent"] not in {n["id"] for n in rows}:
                    raise vol.Invalid("parent")
                if proposed["default_child"] and not any(
                    n["id"] == proposed["default_child"] and n.get("parent") == proposed["id"]
                    for n in rows
                ):
                    raise vol.Invalid("default")
            except vol.Invalid:
                errors["base"] = "invalid_state"
            else:
                for other in rows:
                    if (
                        other.get("default_child") == proposed["id"]
                        and other["id"] != proposed["parent"]
                    ):
                        other["default_child"] = None
                if node:
                    rows[rows.index(node)] = proposed
                else:
                    rows.append(proposed)
                return await self.async_step_states()
        fields = {}
        if not self._state_id:
            fields[field("id", values["id"])] = selector.TextSelector()
        fields[field("name", values["name"])] = selector.TextSelector()
        fields[field("parent", values["parent"])] = select(
            self.choices(empty=True, exclude=self.descendants(self._state_id))
        )
        fields[field("default_child", values["default_child"])] = select(
            self.choices(
                empty=True,
                items=[n for n in rows if self._state_id and n.get("parent") == self._state_id],
            )
        )
        fields[optional_entity("scene", values["scene"])] = entity("scene")
        fields[field("occupied", values["occupied"])] = select(
            ["inherit", "occupied", "unoccupied"], key="occupancy"
        )
        return self.form(step, fields, errors)

    async def async_step_state_remove(self, user_input=None):
        if user_input is not None:
            if user_input.get("back"):
                return await self.async_step_states()
            self._state_id = user_input["state"]
            return await self.async_step_state_delete()
        return self.form(
            "state_remove",
            {field("state", self._draft["state_tree"][0]["id"]): select(self.choices())},
        )

    async def async_step_state_delete(self, user_input=None):
        rows = self._draft["state_tree"]
        node = next(n for n in rows if n["id"] == self._state_id)
        errors = {}
        if user_input is not None:
            if user_input.get("back") or not user_input.get("confirm"):
                return await self.async_step_states()
            if len(rows) == 1:
                errors["base"] = "last_state"
            elif any(
                o.get("when_state") and set(o["when_state"]) == {node["id"]}
                for o in self._draft["overlays"]
            ):
                errors["base"] = "state_gates_overlay"
            else:
                rows.remove(node)
                for other in rows:
                    if other.get("parent") == node["id"]:
                        other["parent"] = node.get("parent")
                    if other.get("default_child") == node["id"]:
                        other["default_child"] = None
                for role, target in self._draft["roles"].items():
                    if target == node["id"]:
                        self._draft["roles"][role] = None
                for overlay in self._draft["overlays"]:
                    if node["id"] in overlay.get("when_state", []):
                        overlay["when_state"] = [
                            s for s in overlay["when_state"] if s != node["id"]
                        ]
                if self._draft["initial_state"] == node["id"]:
                    self._draft["initial_state"] = user_input["replacement"]
                return await self.async_step_states()
        fields = {field("confirm", False): selector.BooleanSelector()}
        if self._draft["initial_state"] == node["id"] and len(rows) > 1:
            choices = self.choices(exclude={node["id"]})
            fields[field("replacement", choices[0]["value"])] = select(choices)
        return self.form("state_delete", fields, errors, {"name": node["name"]})

    async def async_step_general(self, user_input=None):
        if user_input is not None:
            if not user_input.get("back"):
                self._draft["initial_state"] = user_input["initial_state"]
                self._draft["roles"] |= {role: user_input.get(role) or None for role in ROLE_KEYS}
            return await self.async_step_init()
        fields = {field("initial_state", self._draft["initial_state"]): select(self.choices())}
        for role in ROLE_KEYS:
            fields[field(role, self._draft["roles"].get(role) or "")] = select(
                self.choices(empty=True)
            )
        return self.form("general", fields)

    async def async_step_presence(self, user_input=None):
        if user_input is not None:
            if not user_input.get("back"):
                self._draft |= {key: value for key, value in user_input.items() if key != "back"}
            return await self.async_step_init()
        fields = {}
        for key, domain in (
            ("door_entities", "lock"),
            ("gate_entities", "cover"),
            ("person_entities", "person"),
        ):
            fields[field(key, self._draft[key])] = entity(domain, multiple=True)
        for key in ("auto_return", "auto_away"):
            fields[field(key, self._draft[key])] = selector.BooleanSelector()
        fields[field("auto_away_grace", self._draft["auto_away_grace"])] = number(
            0, max(86400, self._draft["auto_away_grace"]), "s"
        )
        return self.form("presence", fields)

    async def async_step_visits(self, user_input=None):
        # Stored in seconds; minutes are what a household thinks in.
        minutes = ("visit_duration", "visit_max_duration")
        if user_input is not None:
            if not user_input.get("back"):
                for key in minutes:
                    self._draft[key] = int(user_input[key]) * 60
                self._draft["visit_exit_grace"] = int(user_input["visit_exit_grace"])
                self._draft["visit_reapply_scene"] = user_input["visit_reapply_scene"]
                self._draft["visit_lock_entities"] = user_input["visit_lock_entities"]
            return await self.async_step_init()
        fields = {
            field(key, self._draft[key] // 60): number(1, MAX_DURATION // 60, "min")
            for key in minutes
        }
        fields[field("visit_exit_grace", self._draft["visit_exit_grace"])] = number(0, 3600, "s")
        fields[field("visit_reapply_scene", self._draft["visit_reapply_scene"])] = (
            selector.BooleanSelector()
        )
        fields[field("visit_lock_entities", self._draft["visit_lock_entities"])] = entity(
            "lock", multiple=True
        )
        return self.form("visits", fields)

    async def async_step_legacy(self, user_input=None):
        if user_input is not None:
            if not user_input.get("back"):
                for key in ("state", "overlay"):
                    if user_input.get(key):
                        self._draft["legacy_mirror"][key] = user_input[key]
                    else:
                        self._draft["legacy_mirror"].pop(key, None)
            return await self.async_step_init()
        return self.form(
            "legacy",
            {
                optional_entity(key, self._draft["legacy_mirror"].get(key, "")): entity(
                    "input_select"
                )
                for key in ("state", "overlay")
            },
        )

    def unknown_schedule_fields(self):
        return {
            key: value
            for key, value in self._draft["night_schedule"].items()
            if key not in {"type", "time", "event", "offset"}
        }

    async def async_step_night(self, user_input=None):
        if user_input is not None:
            if user_input.get("back"):
                return await self.async_step_init()
            self._night_kind = user_input["type"]
            if self._night_kind == "off":
                self._draft["night_schedule"] = self.unknown_schedule_fields() | {"type": "off"}
                return await self.async_step_init()
            return await self.async_step_night_details()
        return self.form(
            "night",
            {
                field("type", self._draft["night_schedule"].get("type", "off")): select(
                    ["off", "fixed", "sun"], key="night_type"
                )
            },
        )

    async def async_step_night_details(self, user_input=None):
        schedule = self._draft["night_schedule"]
        values = schedule if schedule.get("type") == self._night_kind else {}
        if user_input is not None:
            if user_input.get("back"):
                return await self.async_step_night()
            proposed = (
                self.unknown_schedule_fields()
                | deepcopy(values)
                | {key: value for key, value in user_input.items() if key != "back"}
                | {"type": self._night_kind}
            )
            if self._night_kind == "fixed":
                proposed["time"] = cv.time(proposed["time"]).isoformat()
            self._draft["night_schedule"] = proposed
            return await self.async_step_init()
        fields = {}
        if self._night_kind == "fixed":
            fields[field("time", values.get("time", "22:00:00"))] = selector.TimeSelector()
        else:
            fields[field("event", values.get("event", "sunset"))] = select(
                ["sunset", "sunrise"], key="sun_event"
            )
            fields[field("offset", values.get("offset", 0))] = number(-86400, 86400, "s")
        return self.form("night_details", fields)

    async def async_step_save(self, user_input=None):
        errors = {}
        detail = ""
        if user_input is not None:
            if user_input.get("back"):
                return await self.async_step_init()
            try:
                self._pending = validate_config(self.hass, self._draft)
            except ServiceValidationError as err:
                errors["base"] = "invalid_config"
                detail = str(err)
            else:
                if scene_warnings(self.hass, self._pending):
                    return await self.async_step_warnings()
                return self.async_create_entry(title="", data=self._pending)
        return self.form("save", {}, errors, {"error": detail})

    async def async_step_warnings(self, user_input=None):
        if user_input is not None:
            if user_input.get("back"):
                return await self.async_step_init()
            # Revalidate on acknowledgement: scenes may have changed in the meantime.
            try:
                self._pending = validate_config(self.hass, self._draft)
            except ServiceValidationError as err:
                return self.form("save", {}, {"base": "invalid_config"}, {"error": str(err)})
            return self.async_create_entry(title="", data=self._pending)
        return self.form(
            "warnings",
            {},
            placeholders={"warnings": "\n".join(scene_warnings(self.hass, self._pending))},
        )

    async def async_step_overlays(self, user_input=None):
        return self.async_show_menu(
            step_id="overlays",
            menu_options=["overlay_add", "overlay_edit", "overlay_remove", "init"],
        )

    async def async_step_overlay_add(self, user_input=None):
        self._overlay_id = None
        return await self.overlay_form("overlay_add", user_input)

    async def async_step_overlay_edit(self, user_input=None):
        if user_input is not None:
            if user_input.get("back"):
                return await self.async_step_overlays()
            if not user_input.get("overlay"):
                return self.form(
                    "overlay_edit",
                    {vol.Optional("overlay"): select(self.choices(items=self._draft["overlays"]))},
                    {"base": "select_overlay"},
                )
            self._overlay_id = user_input["overlay"]
            return await self.async_step_overlay_details()
        return self.form(
            "overlay_edit",
            {vol.Optional("overlay"): select(self.choices(items=self._draft["overlays"]))},
        )

    async def async_step_overlay_details(self, user_input=None):
        return await self.overlay_form("overlay_details", user_input)

    async def overlay_form(self, step, user_input):
        rows = self._draft["overlays"]
        current = next((item for item in rows if item["id"] == self._overlay_id), {})
        values = {
            "id": current.get("id", ""),
            "name": current.get("name", ""),
            "scene": current.get("scene", ""),
            "priority": current.get("priority", 0),
            "when_occupied": {None: "any", True: "occupied", False: "unoccupied"}[
                current.get("when_occupied")
            ],
            "when_state": current.get("when_state", []),
            "rule": "calendar"
            if "calendar" in current
            else current.get("dates", {}).get("type", "manual"),
        }
        errors = {}
        if user_input is not None:
            if user_input.get("back"):
                return await self.async_step_overlays()
            values |= user_input
            values["scene"] = user_input.get("scene", "")
            proposed = deepcopy(current) | {
                "id": self._overlay_id or values["id"],
                "name": values["name"],
                "scene": values["scene"],
                "priority": int(values["priority"]),
                "when_occupied": {"any": None, "occupied": True, "unoccupied": False}[
                    values["when_occupied"]
                ],
                "when_state": values["when_state"],
            }
            try:
                # Node schema shares the stable ID/name constraints.
                _NODE({"id": proposed["id"], "name": proposed["name"]})
                if proposed["id"] in RESERVED_OVERLAYS or (
                    not self._overlay_id and any(o["id"] == proposed["id"] for o in rows)
                ):
                    raise vol.Invalid("duplicate")
            except vol.Invalid:
                errors["base"] = "invalid_overlay"
            else:
                self._overlay = proposed
                self._rule_kind = values["rule"]
                if self._rule_kind == "manual":
                    for key in ("calendar", "match", "dates"):
                        self._overlay.pop(key, None)
                    return await self.store_overlay()
                return await self.async_step_overlay_rule()
        fields = {}
        if not self._overlay_id:
            fields[field("id", values["id"])] = selector.TextSelector()
        fields[field("name", values["name"])] = selector.TextSelector()
        fields[optional_entity("scene", values["scene"])] = entity("scene")
        fields[field("priority", values["priority"])] = number(-100, 100)
        fields[field("when_occupied", values["when_occupied"])] = select(
            ["any", "occupied", "unoccupied"], key="occupancy"
        )
        fields[field("when_state", values["when_state"])] = select(self.choices(), multiple=True)
        fields[field("rule", values["rule"])] = select(
            ["manual", "calendar", "fixed", "easter", "nth_weekday"], key="rule_type"
        )
        return self.form(step, fields, errors)

    async def store_overlay(self):
        rows = self._draft["overlays"]
        if self._overlay_id:
            index = next(i for i, item in enumerate(rows) if item["id"] == self._overlay_id)
            rows[index] = self._overlay
        else:
            rows.append(self._overlay)
        return await self.async_step_overlays()

    async def async_step_overlay_rule(self, user_input=None):
        kind = self._rule_kind
        dates = self._overlay.get("dates", {})
        values = dates if dates.get("type") == kind else {}
        errors = {}
        if user_input is not None:
            if user_input.get("back"):
                return await self.async_step_overlays()
            proposed = deepcopy(self._overlay)
            if kind == "calendar":
                proposed.pop("dates", None)
                proposed["calendar"] = user_input.get("calendar", "")
                proposed["match"] = user_input.get("match", "")
            else:
                proposed.pop("calendar", None)
                proposed.pop("match", None)
                rule = {"type": kind} | {
                    key: value
                    for key, value in dates.items()
                    if key
                    not in {"type", "from", "to", "weekday", "nth", "month", "anchor", "days"}
                }
                if kind in {"fixed", "easter"}:
                    rule |= {"from": user_input["from"], "to": user_input["to"]}
                else:
                    rule |= {key: user_input[key] for key in ("weekday", "nth", "days")}
                    anchor = user_input["anchor_kind"]
                    rule[anchor] = user_input[anchor]
                proposed["dates"] = rule
            try:
                _overlay_rule(proposed, {n["id"]: n for n in self._draft["state_tree"]})
            except (vol.Invalid, KeyError, TypeError, ValueError):
                errors["base"] = "invalid_rule"
                values = user_input
            else:
                self._overlay = proposed
                return await self.store_overlay()
        fields = {}
        if kind == "calendar":
            fields[
                optional_entity(
                    "calendar",
                    (user_input or {}).get("calendar", self._overlay.get("calendar", "")),
                )
            ] = entity("calendar")
            fields[
                field("match", (user_input or {}).get("match", self._overlay.get("match", "")))
            ] = selector.TextSelector()
        elif kind == "fixed":
            for key in ("from", "to"):
                fields[field(key, values.get(key, "12-25"))] = selector.TextSelector()
        elif kind == "easter":
            for key in ("from", "to"):
                fields[field(key, values.get(key, 0))] = number(-180, 180)
        else:
            fields[field("weekday", values.get("weekday", "sun"))] = select(
                list(WEEKDAYS), key="weekday"
            )
            fields[field("nth", values.get("nth", 1))] = number(-5, 5)
            fields[
                field(
                    "anchor_kind",
                    values.get("anchor_kind", "anchor" if "anchor" in values else "month"),
                )
            ] = select(["month", "anchor"], key="anchor_kind")
            fields[field("month", values.get("month", 1))] = number(1, 12)
            fields[field("anchor", values.get("anchor", "12-25"))] = selector.TextSelector()
            fields[field("days", values.get("days", 1))] = number(1, 366)
        return self.form("overlay_rule", fields, errors, {"name": self._overlay["name"]})

    async def async_step_overlay_remove(self, user_input=None):
        errors = {}
        if user_input is not None:
            if user_input.get("back"):
                return await self.async_step_overlays()
            if user_input.get("overlay"):
                self._overlay_id = user_input["overlay"]
                return await self.async_step_overlay_delete()
            errors["base"] = "select_overlay"
        return self.form(
            "overlay_remove",
            {vol.Optional("overlay"): select(self.choices(items=self._draft["overlays"]))},
            errors,
        )

    async def async_step_overlay_delete(self, user_input=None):
        item = next(o for o in self._draft["overlays"] if o["id"] == self._overlay_id)
        if user_input is not None:
            if user_input.get("confirm") and not user_input.get("back"):
                self._draft["overlays"].remove(item)
            return await self.async_step_overlays()
        return self.form(
            "overlay_delete",
            {field("confirm", False): selector.BooleanSelector()},
            placeholders={"name": item["name"]},
        )
