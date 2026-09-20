// SPDX-FileCopyrightText: Copyright (C) 2026, Antoine Basset (CNES), Rollin Gimenez (CNES)
// SPDX-License-Identifier: Apache-2.0

/**
 * Control pane form.
 */
export class Form {
  constructor(targetField, radiusField) {
    this.targetField = targetField;
    this.radiusField = radiusField;
  }

  getTarget() {
    return this.targetField.value || this.targetField.placeholder;
  }

  setTarget(target) {
    this.targetField.value = target;
  }

  setRadec(ra, dec) {
    this.setTarget(dumpAngle(ra) + " " + dumpAngle(dec));
  }

  getRadius() {
    return parseAngle(this.radiusField.value || this.radiusField.placeholder);
  }

  setRadius(angle) {
    this.radiusField.value = dumpAngle(angle);
  }
}

function parseAngle(text) {
  const units = { "°": 1, d: 1, "'": 60, m: 60, '"': 3600, s: 3600 };
  for (const u in units) {
    if (text.endsWith(u)) {
      return Number.parseFloat(text.slice(0, -1)) / units[u];
    }
  }
  return Number.parseFloat(text);
}

function dumpAngle(deg, digits = 6) {
  return deg.toFixed(digits) + "°";
}
