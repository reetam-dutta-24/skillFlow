"use client";

import { useEffect, useRef } from "react";
import Supercluster from "supercluster";
import type { Map as MapLibreMap, Marker, Popup } from "maplibre-gl";
import type { MapCity } from "@/lib/geo/cities";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  count: number;
  title: string;
  detail: string;
};

type PointProps = MapPoint;
type ClusterProps = { count: number };
type MapLibre = typeof import("maplibre-gl");

/**
 * Zoomed-out bubbles are supercluster groups.
 * `map` / `reduce` sum `count`, so a learner bubble shows people and an event bubble shows events.
 */
function buildIndex(points: MapPoint[]) {
  const index = new Supercluster<PointProps, ClusterProps>({
    radius: 56,
    maxZoom: 14,
    minPoints: 2,
    map: (props) => ({ count: props.count }),
    reduce: (accumulated, props) => {
      accumulated.count += props.count;
    },
  });
  index.load(
    points.map((point) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [point.lng, point.lat] },
      properties: point,
    })),
  );
  return index;
}

function rasterStyle() {
  return {
    version: 8 as const,
    sources: {
      osm: {
        type: "raster" as const,
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
  };
}

function plural(count: number, noun: "learner" | "event") {
  const word = count === 1 ? noun : `${noun}s`;
  return `${count} ${word}`;
}

function fitPoints(map: MapLibreMap, points: MapPoint[], maxZoom: number) {
  if (points.length === 0) return;
  let west = 180;
  let south = 90;
  let east = -180;
  let north = -90;
  for (const point of points) {
    west = Math.min(west, point.lng);
    south = Math.min(south, point.lat);
    east = Math.max(east, point.lng);
    north = Math.max(north, point.lat);
  }
  map.fitBounds(
    [
      [west, south],
      [east, north],
    ],
    { padding: 56, maxZoom, duration: 0 },
  );
}

export function citiesToPoints(cities: MapCity[]): MapPoint[] {
  return cities.map((city) => ({
    id: `${city.city}|${city.country}`,
    lat: city.lat,
    lng: city.lng,
    count: city.count,
    title: city.country ? `${city.city}, ${city.country}` : city.city,
    detail: plural(city.count, "learner"),
  }));
}

export function MapCanvas({
  cities,
  points,
  selectedId = null,
  onSelect,
  noun = "learner",
  fitMaxZoom = 4,
  ariaLabel = "World map of learner cities",
}: {
  cities?: MapCity[];
  points?: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  noun?: "learner" | "event";
  fitMaxZoom?: number;
  ariaLabel?: string;
}) {
  const resolved = points ?? citiesToPoints(cities ?? []);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const libRef = useRef<MapLibre | null>(null);
  const indexRef = useRef<Supercluster<PointProps, ClusterProps> | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const popupRef = useRef<Popup | null>(null);
  const pointsRef = useRef(resolved);
  const signatureRef = useRef("");
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const nounRef = useRef(noun);
  const fittedRef = useRef(false);
  const fitZoomRef = useRef(fitMaxZoom);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    const paint = () => {
      const map = mapRef.current;
      const lib = libRef.current;
      const index = indexRef.current;
      if (!map || !lib || !index) return;
      const bounds = map.getBounds();
      const clusters = index.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        Math.round(map.getZoom()),
      );

      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];

      for (const feature of clusters) {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        if (!props) continue;
        const clustered = "cluster" in props && props.cluster === true;
        const count = typeof props.count === "number" ? props.count : 0;
        const button = document.createElement("button");
        button.type = "button";
        const showCount = nounRef.current === "learner" || clustered;
        button.className = clustered ? "sf-map-pin is-cluster" : "sf-map-pin";
        button.textContent = showCount ? String(count) : "";

        if (clustered && "cluster_id" in props) {
          const clusterId = Number(props.cluster_id);
          button.setAttribute("aria-label", `Group of ${plural(count, nounRef.current)}. Zoom in.`);
          button.addEventListener("click", () => {
            map.easeTo({ center: [lng, lat], zoom: index.getClusterExpansionZoom(clusterId) });
          });
        } else if ("id" in props && "title" in props) {
          const id = String(props.id);
          const title = String(props.title);
          const detail = String(props.detail ?? "");
          if (id === selectedRef.current) button.classList.add("is-selected");
          button.setAttribute("aria-label", detail ? `${title}. ${detail}` : title);
          button.addEventListener("click", () => {
            onSelectRef.current?.(id);
            popupRef.current?.remove();
            const body = document.createElement("div");
            const heading = document.createElement("strong");
            heading.textContent = title;
            body.append(heading);
            if (detail) {
              const line = document.createElement("p");
              line.textContent = detail;
              body.append(line);
            }
            popupRef.current = new lib.Popup({ offset: 18, closeButton: true, className: "sf-map-popup" })
              .setLngLat([lng, lat])
              .setDOMContent(body)
              .addTo(map);
          });
        }

        markersRef.current.push(new lib.Marker({ element: button, anchor: "center" }).setLngLat([lng, lat]).addTo(map));
      }
    };

    void import("maplibre-gl").then((lib) => {
      if (cancelled) return;
      libRef.current = lib;
      lib.setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
      const map = new lib.Map({
        container,
        style: rasterStyle(),
        center: [10, 20],
        zoom: 1.2,
        attributionControl: { compact: true },
      });
      map.addControl(new lib.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
      indexRef.current = buildIndex(pointsRef.current);
      map.on("load", () => {
        if (!fittedRef.current && pointsRef.current.length > 0) {
          fitPoints(map, pointsRef.current, fitZoomRef.current);
          fittedRef.current = true;
        }
        paint();
      });
      map.on("moveend", paint);

      const observer = new ResizeObserver(() => map.resize());
      observer.observe(container);
      map.on("remove", () => observer.disconnect());
    });

    return () => {
      cancelled = true;
      popupRef.current?.remove();
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      libRef.current = null;
    };
  }, []);

  useEffect(() => {
    const signature = resolved.map((point) => point.id).join("\n");
    if (signatureRef.current !== signature) {
      signatureRef.current = signature;
      fittedRef.current = false;
    }
    pointsRef.current = resolved;
    selectedRef.current = selectedId;
    onSelectRef.current = onSelect;
    nounRef.current = noun;
    fitZoomRef.current = fitMaxZoom;
    indexRef.current = buildIndex(resolved);
    const map = mapRef.current;
    if (!map) return;
    if (!fittedRef.current && resolved.length > 0 && map.loaded()) {
      fitPoints(map, resolved, fitMaxZoom);
      fittedRef.current = true;
    }
    map.fire("moveend");
  }, [resolved, selectedId, onSelect, noun, fitMaxZoom]);

  useEffect(() => {
    if (!selectedId) return;
    const point = resolved.find((item) => item.id === selectedId);
    const map = mapRef.current;
    if (!point || !map) return;
    map.easeTo({ center: [point.lng, point.lat], zoom: Math.max(map.getZoom(), 11) });
  }, [selectedId, resolved]);

  return <div ref={containerRef} className="sf-map-canvas" role="region" aria-label={ariaLabel} />;
}
