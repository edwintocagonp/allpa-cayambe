import * as THREE from "three";

export const ENV = {
  skyTop: new THREE.Color("#3a6aa8"),
  skyMid: new THREE.Color("#8db4da"),
  skyHorizon: new THREE.Color("#efd9bd"),
  sunGlow: new THREE.Color("#ffd8a6"),
  fog: new THREE.Color("#d9d2c4"),
  fogDensity: 0.000052,
  sunDir: new THREE.Vector3(-0.62, 0.5, 0.42).normalize(),
  sunColor: new THREE.Color("#ffe1ba"),
  sunIntensity: 3.2,
  hemiSky: new THREE.Color("#c4d6ec"),
  hemiGround: new THREE.Color("#7b6a52"),
  hemiIntensity: 1.05,
};
