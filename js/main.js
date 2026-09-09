// SPDX-FileCopyrightText: Copyright (C) 2026, Antoine Basset (CNES), Rollin Gimenez (CNES)
// SPDX-License-Identifier: Apache-2.0

const containerId = "aladin-lite-div"
const container = document.getElementById(containerId);

let aladin = null;
let markerLayer = null;
let circleOverlay = null;
let previewOverlay = null;
let firstClick = null;
let dragging = false;

A.init.then(() => {
    aladin = A.aladin('#' + containerId, {
        survey: 'https://alasky.cds.unistra.fr/Euclid/Q1/CDS_P_Euclid_Q1_color-azulero',
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

    markerLayer = A.catalog({ shape: 'circle', color: '#4ec9b0', sourceSize: 12 });
    aladin.addCatalog(markerLayer);

    circleOverlay = A.graphicOverlay({ color: '#8066be', lineWidth: 2 });
    previewOverlay = A.graphicOverlay({ color: '#be666fff', lineWidth: 1 });
    aladin.addOverlay(circleOverlay);
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

    if (!firstClick) {
        // 1st clic → center
        firstClick = { ra, dec };
        placeMarker(ra, dec);
        circleOverlay.removeAll();
        previewOverlay.removeAll();
        document.dispatchEvent(new CustomEvent('sky:select', { detail: { ra, dec } }));
    } else {
        // 2nd clic → radius
        const radius = angularDistance(firstClick.ra, firstClick.dec, ra, dec);
        previewOverlay.removeAll();
        drawCircleOn(circleOverlay, firstClick.ra, firstClick.dec, radius);
        document.dispatchEvent(new CustomEvent('sky:region', {
            detail: { ra: firstClick.ra, dec: firstClick.dec, radius }
        }));
        firstClick = null;
    }
});

/**
 * Drag or show radius.
 */
container.addEventListener('pointermove', e => {
    dragging = true;

    if (!firstClick || !aladin.pix2world) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // pix2world returns [ra, dec] in degrees
    const skyCoords = aladin.pix2world(x, y);
    if (!skyCoords || skyCoords[0] == null) return;

    const [raMouse, decMouse] = skyCoords;
    const radius = angularDistance(firstClick.ra, firstClick.dec, raMouse, decMouse);

    previewOverlay.removeAll();
    if (radius > 0) {
        drawCircleOn(previewOverlay, firstClick.ra, firstClick.dec, radius);
    }
});

/**
 * Deselect.
 */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        firstClick = null;
        circleOverlay.removeAll();
        previewOverlay.removeAll();
        markerLayer.clear();
    }
});

// Helpers

function placeMarker(ra, dec) {
    markerLayer.clear();
    markerLayer.addSources([A.source(ra, dec)]);
}

function goTo(ra, dec) {
    if (!aladin) return;
    aladin.gotoRaDec(ra, dec);
    placeMarker(ra, dec);
    firstClick = null;
    circleOverlay?.removeAll();
    previewOverlay?.removeAll();
}

function drawCircleOn(overlay, ra, dec, radiusDeg, steps = 64) {
    const points = [];
    const decRad = dec * Math.PI / 180;
    for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const dRa = (radiusDeg * Math.cos(angle)) / Math.cos(decRad);
        const dDec = radiusDeg * Math.sin(angle);
        points.push([ra + dRa, dec + dDec]);
    }
    overlay.removeAll();
    overlay.add(A.polygon(points));
}

function drawCircle(ra, dec, radius) {
    if (!aladin || !circleOverlay) return;
    circleOverlay.removeAll();
    if (radius == null) return;
    drawCircleOn(circleOverlay, ra, dec, radius);
}

function angularDistance(ra1, dec1, ra2, dec2) {
    const toRad = d => d * Math.PI / 180;
    const cos =
        Math.sin(toRad(dec1)) * Math.sin(toRad(dec2)) +
        Math.cos(toRad(dec1)) * Math.cos(toRad(dec2)) * Math.cos(toRad(ra1 - ra2));
    return Math.acos(Math.min(1, Math.max(-1, cos))) * 180 / Math.PI;
}
