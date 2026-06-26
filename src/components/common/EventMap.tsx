"use client";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export function EventMap({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  return <LeafletMap lat={lat} lng={lng} label={label} />;
}
