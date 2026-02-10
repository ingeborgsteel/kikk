export const kartverketTopo = "https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png"
export const kartverketAttribution = '© <a href="https://www.kartverket.no/">Kartverket</a>'

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

export const mapboxSatellite = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
export const mapboxAttribution = '© Mapbox'