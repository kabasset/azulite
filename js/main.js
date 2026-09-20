// SPDX-FileCopyrightText: Copyright (C) 2026, Antoine Basset (CNES), Rollin Gimenez (CNES)
// SPDX-License-Identifier: Apache-2.0

// Selection variables
let selectedRa;
let selectedDec;
let selectedRadius;

// Control variables
const targetField = document.getElementById("targetField");
const defaultTarget = targetField.placeholder;
const radiusField = document.getElementById("radiusField");
const defaultRadius = radiusField.placeholder;
const radiusToFovFactor = 3;
const containerId = "aladin-lite-div";
const container = document.getElementById(containerId);

// Map variables
const survey_name = "CDS/P/Euclid/Q1/color-azulero";
const survey =
  "https://alasky.cds.unistra.fr/Euclid/Q1/CDS_P_Euclid_Q1_color-azulero";
const maxSize = 50000000;
let aladin = null;
let centerCatalog = null;
let radiusOverlay = null;
let previewOverlay = null;

// Setup map
A.init.then(() => {
  aladin = A.aladin("#" + containerId, {
    survey: survey,
    fov: parseAngle(defaultRadius) * radiusToFovFactor,
    target: defaultTarget,
    cooFrame: "ICRS",
    showReticle: true,
    showProjectionControl: false,
    showZoomControl: true,
    showFullscreenControl: true,
    showLayersControl: true,
    showGotoControl: true,
    showShareControl: false,
    showCooLocation: false,
    showContextMenu: false,
  });

  centerCatalog = A.catalog({
    shape: "circle",
    color: "#4ec9b0",
    sourceSize: 12,
  });
  aladin.addCatalog(centerCatalog);

  radiusOverlay = A.graphicOverlay({ lineWidth: 2 });
  previewOverlay = A.graphicOverlay({ lineWidth: 1 });
  aladin.addOverlay(radiusOverlay);
  aladin.addOverlay(previewOverlay);

  aladin.on("click", (e) => {
    if (!e.isDragging) clickRadec(e.ra, e.dec);
  });

  aladin.on("mouseMove", (e) => {
    if (!e.isDragging) moveRadec(e.ra, e.dec);
  });
});

container.addEventListener("pointerout", () => {
  previewOverlay.removeAll();
});

/**
 * Get pointed RA/Dec.
 */
function getRadec() {
  const radec = aladin.getRaDec();
  return { ra: radec[0], dec: radec[1] };
}

/**
 * Set center from FoV, radius from clicked RA/Dec.
 */
function clickRadec(ra, dec) {
  const center = getRadec();
  const radius = angularDistance(center.ra, center.dec, ra, dec);
  drawCenter(center.ra, center.dec);
  drawCircle(radiusOverlay, center.ra, center.dec, radius);
  previewOverlay.removeAll();
  document.dispatchEvent(
    new CustomEvent("sky:region", {
      detail: { ra: center.ra, dec: center.dec, radius },
    }),
  );
}

/**
 * Preview radius.
 */
function moveRadec(ra, dec) {
  const center = getRadec();
  const radius = angularDistance(center.ra, center.dec, ra, dec);
  drawCircle(previewOverlay, center.ra, center.dec, radius);
}

/**
 * Clear overlays.
 */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    center = null;
    radiusOverlay.removeAll();
    previewOverlay.removeAll();
    centerCatalog.clear();
  }
});

/**
 * Draw center on map.
 */
function drawCenter(ra, dec) {
  centerCatalog.clear();
  centerCatalog.addSources([A.source(ra, dec)]);
}

/**
 * Draw circle on given map overlay.
 */
function drawCircle(overlay, ra, dec, radius) {
  if (!aladin || !overlay) return;
  overlay.removeAll();
  overlay.add(A.circle(ra, dec, radius));
}

/**
 * Compute angular distance between two points.
 */
function angularDistance(ra1, dec1, ra2, dec2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const cos =
    Math.sin(toRad(dec1)) * Math.sin(toRad(dec2)) +
    Math.cos(toRad(dec1)) * Math.cos(toRad(dec2)) * Math.cos(toRad(ra1 - ra2));
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}

/**
 * Update target variables and FoV.
 */
function setTarget(target, radius) {
  if (!aladin) return;
  aladin.gotoObject(target, {
    error: () => {
      alert("Unknown target: " + target);
    },
    success: () => {
      aladin.setFoV(radius * radiusToFovFactor);
      const [ra, dec] = aladin.getRaDec();
      drawCenter(ra, dec);
      drawCircle(radiusOverlay, ra, dec, radius);
      selectedRa = ra;
      selectedDec = dec;
      selectedRadius = radius;
    },
  });
}

// Update selection variables and fields.
document.addEventListener("sky:region", ({ detail: { ra, dec, radius } }) => {
  selectedRa = ra;
  selectedDec = dec;
  selectedRadius = radius;
  targetField.value = ra.toFixed(6) + "° " + dec.toFixed(6) + "°";
  radiusField.value = radius.toFixed(6) + "°";
});

// Update FoV from fields.
document.getElementById("goto-button")?.addEventListener("click", (e) => {
  target = targetField.value;
  if (!target) target = defaultTarget;
  radius = radiusField.value;
  if (!radius) radius = defaultRadius;
  setTarget(target, parseAngle(radius));
});

/**
 * Parse angular field value.
 */
function parseAngle(value) {
  units = { "°": 1, d: 1, "'": 60, m: 60, '"': 3600, s: 3600 };
  for (u in units) {
    if (value.endsWith(u))
      return Number.parseFloat(value.slice(0, -1)) / units[u];
  }
  return Number.parseFloat(value);
}

// Preview image.
document.getElementById("preview-button")?.addEventListener("click", (e) => {
  img = document.getElementById("preview-img");
  img.setAttribute("src", "");
  extent = img.parentElement.clientWidth;
  img.setAttribute("src", makeUrl(extent));
});

// Open image in new tab.
document.getElementById("open-button")?.addEventListener("click", (e) => {
  url = makeUrl();
  if (url) {
    window.open(url, "_blank");
  }
});

/**
 * Open HiPS2FITS.
 */
document.getElementById("more-button")?.addEventListener("click", (e) => {
  window.open(makeHips2FitsUrl(), "_blank");
});

/**
 * Make image URL.
 */
function makeUrl(extent = null) {
  extent = extent ? extent : Math.ceil(selectedRadius * 36000); // MER resolution
  // TODO extent/resolution from field?
  if (extent * extent > maxSize) {
    if (confirm("Full-resolution image too large.\nScale down?")) {
      extent = Math.floor(Math.sqrt(maxSize));
    } else {
      return;
    }
  }
  params = {
    hips: survey_name,
    width: extent,
    height: extent,
    projection: "SIN",
    fov: selectedRadius * 2,
    ra: selectedRa,
    dec: selectedDec,
    coordsys: "icrs",
    rotation_angle: 0,
    format: "png",
  };
  return rest(
    "https://alasky.cds.unistra.fr/hips-image-services/hips2fits",
    params,
  );
}

/**
 * Make HiPS2FITS URL.
 */
function makeHips2FitsUrl() {
  params = {
    hips: survey,
    fov: selectedRadius * 2,
    ra: selectedRa,
    dec: selectedDec,
  };
  return rest(
    "https://alasky.cds.unistra.fr/hips-image-services/hips2fits",
    params,
    "#",
  );
}

/**
 * Make REST URL.
 */
function rest(endpoint, params, delim = "?") {
  var chunks = [];
  for (var p in params)
    chunks.push(encodeURIComponent(p) + "=" + encodeURIComponent(params[p]));
  return endpoint + delim + chunks.join("&");
}
