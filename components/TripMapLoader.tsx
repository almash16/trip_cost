"use client";

import dynamic from "next/dynamic";

const TripMap = dynamic(() => import("./TripMap"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      Loading map...
    </div>
  ),
});

export default TripMap;