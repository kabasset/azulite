// SPDX-FileCopyrightText: Copyright (C) 2026, Antoine Basset (CNES), Rollin Gimenez (CNES)
// SPDX-License-Identifier: Apache-2.0

import { Form } from "./form.js";
import { Map } from "./map.js";
import { Generator } from "./generator.js";

const aladinDiv = document.getElementById("aladin-lite-div");
const targetForm = document.getElementById("form");
const targetField = document.getElementById("target-field");
const radiusField = document.getElementById("radius-field");
const gotoButton = document.getElementById("goto-button");
const previewButton = document.getElementById("preview-button");
const openButton = document.getElementById("open-button");
const moreButton = document.getElementById("more-button");
const previewImg = document.getElementById("preview-img");

const surveyName = "CDS/P/Euclid/Q1/color-azulero";
const surveyUrl =
  "https://alasky.cds.unistra.fr/Euclid/Q1/CDS_P_Euclid_Q1_color-azulero";

let form = new Form(targetField, radiusField);
let map = new Map(aladinDiv, surveyUrl, form.getTarget(), form.getRadius());
let generator = new Generator(surveyName, previewImg);

let selectedRa;
let selectedDec;
let selectedRadius;

aladinDiv.addEventListener("map:select", ({ detail: { ra, dec, radius } }) => {
  form.setRadec(ra, dec);
  form.setRadius(radius);
  selectedRa = ra;
  selectedDec = dec;
  selectedRadius = radius;
});

targetForm.onsubmit = (e) => {
  e.preventDefault();
  const target = form.getTarget();
  const radius = form.getRadius();
  map.setTarget(target, radius);
  const radec = map.getRadec();
  selectedRa = radec.ra;
  selectedDec = radec.dec;
  selectedRadius = radius;
};

previewButton.onclick = () => {
  generator.preview(selectedRa, selectedDec, selectedRadius);
};

openButton.onclick = () => {
  generator.generate(selectedRa, selectedDec, selectedRadius);
};

moreButton.onclick = () => {
  generator.details(selectedRa, selectedDec, selectedRadius);
};
