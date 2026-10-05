"use client";

import { useEffect, useRef } from "react";
import Supercluster from "supercluster";
import type { Map as MapLibreMap, Marker, Popup } from "maplibre-gl";
import type { MapCity } from "@/lib/geo/cities";

type CityProps = { city: string; country: string; count: number };
type ClusterProps = { count: number };
type MapLibre = typeof import("maplibre-gl");

/**
 * Zoomed-out bubbles are supercluster groups.
 * `map` / `reduce` sum the learner counts, so a bubble shows people, not how many cities it swallowed.
 */
function buildIndex(cities: MapCity[]) {
  const index = new Supercluster<CityProps, ClusterProps>({
    radius: 56,
    maxZoom: 14,
    minPoints: 2,
    map: (props) => ({ count: props.count }),
    reduce: (accumulated, props) => {
      accumulated.count += props.count;
    },
  });
  index.load(
    cities.map((city) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [city.lng, city.lat] },
      properties: { city: city.city, country: city.country, count: city.count },
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

function learnerLabel(count: number) {
  return count === 1 ? "1 learner" : `${count} learners`;
}

function fitCities(map: MapLibreMap, cities: MapCity[]) {
  if (cities.length === 0) return;
  let west = 180;
  let south = 90;
  let east = -180;
  let north = -90;
  for (const point of cities) {
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
    { padding: 56, maxZoom: 4, duration: 0 },
  );
}

export function MapCanvas({ cities }: { cities: MapCity[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const libRef = useRef<MapLibre | null>(null);
  const indexRef = useRef<Supercluster<CityProps, ClusterProps> | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const popupRef = useRef<Popup | null>(null);
  const citiesRef = useRef(cities);
  const fittedRef = useRef(false);

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
        button.className = clustered ? "sf-map-pin is-cluster" : "sf-map-pin";
        button.textContent = String(count);

        if (clustered && "cluster_id" in props) {
          const clusterId = Number(props.cluster_id);
          button.setAttribute("aria-label", `Group of ${learnerLabel(count)}. Zoom in.`);
          button.addEventListener("click", () => {
            map.easeTo({ center: [lng, lat], zoom: index.getClusterExpansionZoom(clusterId) });
          });
        } else if ("city" in props && "country" in props) {
          const city = String(props.city);
          const country = String(props.country);
          button.setAttribute("aria-label", `${city}, ${country}, ${learnerLabel(count)}`);
          button.addEventListener("click", () => {
            popupRef.current?.remove();
            const body = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = country ? `${city}, ${country}` : city;
            const line = document.createElement("p");
            line.textContent = learnerLabel(count);
            body.append(title, line);
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
      indexRef.current = buildIndex(citiesRef.current);
      map.on("load", () => {
        if (!fittedRef.current && citiesRef.current.length > 0) {
          fitCities(map, citiesRef.current);
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
    citiesRef.current = cities;
    indexRef.current = buildIndex(cities);
    const map = mapRef.current;
    if (!map) return;
    if (!fittedRef.current && cities.length > 0 && map.loaded()) {
      fitCities(map, cities);
      fittedRef.current = true;
    }
    map.fire("moveend");
  }, [cities]);

  return <div ref={containerRef} className="sf-map-canvas" role="region" aria-label="World map of learner cities" />;
}
