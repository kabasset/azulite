// SPDX-FileCopyrightText: Copyright (C) 2026, Antoine Basset (CNES), Rollin Gimenez (CNES)
// SPDX-License-Identifier: Apache-2.0

import { Model } from "./model.js";
import { Form } from "./form.js";
import { Map } from "./map.js";
import { Controller } from "./controller.js";

const targetField = document.getElementById("target-field");
const radiusField = document.getElementById("radius-field");
const gotoButton = document.getElementById("goto-button");
const aladinDiv = document.getElementById("aladin-lite-div");
const survey_name = "CDS/P/Euclid/Q1/color-azulero";
const survey =
  "https://alasky.cds.unistra.fr/Euclid/Q1/CDS_P_Euclid_Q1_color-azulero";

let form = new Form(targetField, radiusField);
let map = new Map(aladinDiv, survey, form.getTarget(), form.getRadius());

let selectedRa;
let selectedDec;
let selectedRadius;

document.addEventListener("map:select", ({ detail: { ra, dec, radius } }) => {
  form.setRadec(ra, dec);
  form.setRadius(radius);
  selectedRa = ra;
  selectedDec = dec;
  selectedRadius = radius;
});
