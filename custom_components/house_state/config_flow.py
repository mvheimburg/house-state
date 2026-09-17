"""Config and options flows with actionable scene-member warnings."""

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import selector

from .config import scene_warnings, validate_config
from .const import DEFAULTS, DOMAIN


def schema(values, user=False):
    fields = {}
    if user:
        fields[vol.Required("name", default="House")] = str
    for key, domain in (
        ("door_entities", "lock"),
        ("gate_entities", "cover"),
        ("person_entities", "person"),
    ):
        fields[vol.Optional(key, default=values[key])] = selector.EntitySelector(
            selector.EntitySelectorConfig(domain=domain, multiple=True)
        )
    for key in ("auto_return", "auto_away"):
        fields[vol.Optional(key, default=values[key])] = selector.BooleanSelector()
    fields[vol.Optional("auto_away_grace", default=values["auto_away_grace"])] = (
        selector.NumberSelector(
            selector.NumberSelectorConfig(
                min=0,
                max=86400,
                step=1,
                mode=selector.NumberSelectorMode.BOX,
                unit_of_measurement="s",
            )
        )
    )
    for key in ("scene_map", "night_schedule", "legacy_mirror"):
        fields[vol.Optional(key, default=values[key])] = selector.ObjectSelector()
    return vol.Schema(fields)


class FlowMixin:
    """Validation shared by onboarding and settings."""

    _pending = None
    _title = "House"

    async def form(self, step, user_input, values):
        errors = {}
        if user_input is not None:
            data = dict(user_input)
            self._title = data.pop("name", "House")
            try:
                self._pending = validate_config(self.hass, values | data)
            except ServiceValidationError:
                errors["base"] = "invalid_config"
            else:
                warnings = scene_warnings(self.hass, self._pending)
                if warnings:
                    return self.async_show_form(
                        step_id="warnings",
                        data_schema=vol.Schema({}),
                        description_placeholders={"warnings": "\n".join(warnings)},
                    )
                return self.finish()
        return self.async_show_form(
            step_id=step, data_schema=schema(values, step == "user"), errors=errors
        )

    async def async_step_warnings(self, user_input=None):
        if user_input is not None:
            return self.finish()
        return self.async_show_form(
            step_id="warnings",
            data_schema=vol.Schema({}),
            description_placeholders={
                "warnings": "\n".join(scene_warnings(self.hass, self._pending))
            },
        )


class HouseStateConfigFlow(FlowMixin, config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        return await self.form("user", user_input, DEFAULTS)

    def finish(self):
        return self.async_create_entry(title=self._title, data={}, options=self._pending)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return HouseOptionsFlow()


class HouseOptionsFlow(FlowMixin, config_entries.OptionsFlow):
    async def async_step_init(self, user_input=None):
        return await self.form("init", user_input, DEFAULTS | dict(self.config_entry.options))

    def finish(self):
        return self.async_create_entry(title="", data=self._pending)
