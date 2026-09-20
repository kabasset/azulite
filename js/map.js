// SPDX-FileCopyrightText: Copyright (C) 2026, Antoine Basset (CNES), Rollin Gimenez (CNES)
// SPDX-License-Identifier: Apache-2.0

const radiusToFovFactor = 3;

/**
 * Aladin sky map.
 */
export class Map {
  constructor(container, survey, target, radius) {
    A.init.then(() => {
      this.aladin = A.aladin("#" + container.id, {
        survey: survey,
        fov: radius * radiusToFovFactor,
        target: target,
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

      this.centerCatalog = A.catalog({
        shape: "circle",
        color: "#4ec9b0",
        sourceSize: 12,
      });

      this.radiusOverlay = A.graphicOverlay({ lineWidth: 2 });
      this.previewOverlay = A.graphicOverlay({ lineWidth: 1 });

      this.aladin.addCatalog(this.centerCatalog);
      this.aladin.addOverlay(this.radiusOverlay);
      this.aladin.addOverlay(this.previewOverlay);

      this.aladin.on("click", (e) => {
        if (!e.isDragging) this.clickRadec(e);
      });

      this.aladin.on("mouseMove", (e) => {
        if (!e.isDragging) this.moveRadec(e);
      });
    });
  }

  /**
   * Get pointed RA/Dec.
   */
  getRadec() {
    const radec = this.aladin.getRaDec();
    return { ra: radec[0], dec: radec[1] };
  }

  /**
   * Goto target and set FoV.
   */
  setTarget(target, radius) {
    this.aladin.gotoObject(target, {
      error: () => {},
      success: () => {
        this.aladin.setFoV(radius * radiusToFovFactor);
        const radec = this.getRadec();
        this.drawCenter(radec);
        this.drawCircle(this.radiusOverlay, radec, radius);
      },
    });
  }

  /**
   * Set center from FoV, radius from clicked RA/Dec.
   */
  clickRadec(radec) {
    const center = this.getRadec();
    const radius = angularDistance(center, radec);
    this.drawCenter(center);
    this.drawCircle(this.radiusOverlay, center, radius);
    this.previewOverlay.removeAll();

    document.dispatchEvent(
      new CustomEvent("map:select", {
        detail: { ra: center.ra, dec: center.dec, radius },
      }),
    );
  }

  /**
   * Preview radius.
   */
  moveRadec(radec) {
    const center = this.getRadec();
    const radius = angularDistance(center, radec);
    this.drawCircle(this.previewOverlay, center, radius);
  }

  /**
   * Draw center on map.
   */
  drawCenter(radec) {
    this.centerCatalog.clear();
    this.centerCatalog.addSources([A.source(radec.ra, radec.dec)]);
  }

  /**
   * Draw circle on given map overlay.
   */
  drawCircle(overlay, radec, radius) {
    overlay.removeAll();
    overlay.add(A.circle(radec.ra, radec.dec, radius));
  }
}

/**
 * Compute angular distance between two points.
 */
function angularDistance(p, q) {
  const toRad = (d) => (d * Math.PI) / 180;
  const cos =
    Math.sin(toRad(p.dec)) * Math.sin(toRad(q.dec)) +
    Math.cos(toRad(p.dec)) *
      Math.cos(toRad(q.dec)) *
      Math.cos(toRad(p.ra - q.ra));
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}
