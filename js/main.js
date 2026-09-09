// SPDX-FileCopyrightText: Copyright (C) 2026, Antoine Basset (CNES), Rollin Gimenez (CNES)
// SPDX-License-Identifier: Apache-2.0

const containerId = "aladin-lite-div"
const container = document.getElementById(containerId);

const survey_name = "CDS/P/Euclid/Q1/color-azulero"
const survey = 'https://alasky.cds.unistra.fr/Euclid/Q1/CDS_P_Euclid_Q1_color-azulero';
let aladin = null;
let centerCatalog = null;
let radiusOverlay = null;
let previewOverlay = null;
let center = null;
let dragging = false;

A.init.then(() => {
    aladin = A.aladin('#' + containerId, {
        survey: survey,
        fov: 0.1,
        target: 'UGC11116',
        cooFrame: 'ICRSd',
        showReticle: false,
        showProjectionControl: false,
        showZoomControl: true,
        showFullscreenControl: true,
        showLayersControl: true,
        showGotoControl: true,
        showShareControl: false,
        showCooLocation: false,
        showContextMenu: false,
    });

    centerCatalog = A.catalog({ shape: 'circle', color: '#4ec9b0', sourceSize: 12 });
    aladin.addCatalog(centerCatalog);

    radiusOverlay = A.graphicOverlay({ color: '#8066be', lineWidth: 2 });
    previewOverlay = A.graphicOverlay({ color: '#be666fff', lineWidth: 1 });
    aladin.addOverlay(radiusOverlay);
    aladin.addOverlay(previewOverlay);
});

/**
 * Pointed RA/dec.
 */
function radec(event) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return aladin.pix2world(x, y);
}

/**
 * Reset dragging.
 */
container.addEventListener('pointerdown', e => { dragging = false; });

/**
 * Click if not dragging:
 * - First click sets center;
 * - Second click sets radius.
 */
container.addEventListener('pointerup', e => {
    if (dragging) return;

    const [ra, dec] = radec(e)

    if (!center) {
        // 1st clic → center
        center = { ra, dec };
        drawCenter(ra, dec);
        radiusOverlay.removeAll();
        previewOverlay.removeAll();
        document.dispatchEvent(new CustomEvent('sky:center', { detail: { ra, dec } }));
    } else {
        // 2nd clic → radius
        const radius = angularDistance(center.ra, center.dec, ra, dec);
        previewOverlay.removeAll();
        drawCircleOn(radiusOverlay, center.ra, center.dec, radius);
        document.dispatchEvent(new CustomEvent('sky:region', {
            detail: { ra: center.ra, dec: center.dec, radius }
        }));
        center = null;
    }
});

/**
 * Drag or show radius.
 */
container.addEventListener('pointermove', e => {
    dragging = true;

    if (!center || !aladin.pix2world) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // pix2world returns [ra, dec] in degrees
    const skyCoords = aladin.pix2world(x, y);
    if (!skyCoords || skyCoords[0] == null) return;

    const [raMouse, decMouse] = skyCoords;
    const radius = angularDistance(center.ra, center.dec, raMouse, decMouse);

    previewOverlay.removeAll();
    if (radius > 0) {
        drawCircleOn(previewOverlay, center.ra, center.dec, radius);
    }
});

/**
 * Deselect.
 */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        center = null;
        radiusOverlay.removeAll();
        previewOverlay.removeAll();
        centerCatalog.clear();
    }
});

// Helpers

function drawCenter(ra, dec) {
    centerCatalog.clear();
    centerCatalog.addSources([A.source(ra, dec)]);
}

function setCenter(ra, dec) {
    if (!aladin) return;
    aladin.gotoRaDec(ra, dec);
    drawCenter(ra, dec);
    center = null;
    radiusOverlay?.removeAll();
    previewOverlay?.removeAll();
}

function drawCircleOn(overlay, ra, dec, radius, steps = 64) {
    const points = [];
    const decRadians = dec * Math.PI / 180;
    for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const dRa = (radius * Math.cos(angle)) / Math.cos(decRadians);
        const dDec = radius * Math.sin(angle);
        points.push([ra + dRa, dec + dDec]);
    }
    overlay.removeAll();
    overlay.add(A.polygon(points));
}

function drawCircle(ra, dec, radius) {
    if (!aladin || !radiusOverlay) return;
    radiusOverlay.removeAll();
    if (radius == null) return;
    drawCircleOn(radiusOverlay, ra, dec, radius);
}

function angularDistance(ra1, dec1, ra2, dec2) {
    const toRad = d => d * Math.PI / 180;
    const cos =
        Math.sin(toRad(dec1)) * Math.sin(toRad(dec2)) +
        Math.cos(toRad(dec1)) * Math.cos(toRad(dec2)) * Math.cos(toRad(ra1 - ra2));
    return Math.acos(Math.min(1, Math.max(-1, cos))) * 180 / Math.PI;
}

// Fields

let selectedRa;
let selectedDec;
let selectedRadius;

document.addEventListener('sky:center', ({ detail: { ra, dec } }) => {
    selectedRa = ra;
    selectedDec = dec;
    document.getElementById('targetField').value = ra.toFixed(6) + "° " + dec.toFixed(6) + "°";
});


document.addEventListener('sky:region', ({ detail: { ra, dec, radius } }) => {
    selectedRa = ra;
    selectedDec = dec;
    selectedRadius = radius;
    document.getElementById('targetField').value = ra.toFixed(6) + "° " + dec.toFixed(6) + "°";
    document.getElementById('radiusField').value = radius.toFixed(6) + "°";
});

// Submit

document.getElementById("preview-button")?.addEventListener("click", (e) => {
    img = document.getElementById("preview-img");
    img.setAttribute("src", makeUrl(200)) // FIXME size from layout
})

document.getElementById("open-button")?.addEventListener("click", (e) => {
    window.open(makeUrl(), "_blank")
});

function makeUrl(extent = null) {
    extent = extent ? extent : Math.ceil(selectedRadius * 36000) // MER resolution // FIXME from field
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
    }
    return rest("https://alasky.cds.unistra.fr/hips-image-services/hips2fits", params)
}

function rest(endpoint, params) {
    var chunks = [];
    for (var p in params)
        chunks.push(encodeURIComponent(p) + "=" + encodeURIComponent(params[p]));
    return endpoint + "?" + chunks.join("&");
}
