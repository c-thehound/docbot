const intent = 'symptoms';
const expressions = [
    "sick",
    // all supported body parts
    "ankle",
    "arch",
    "arm",
    "armpit",
    "beard",
    "breast",
    "calf",
    "cheek",
    "chest",
    "chin",
    "earlobe",
    "elbow",
    "eyebrow",
    "eyelash",
    "eyelid",
    "face",
    "finger",
    "forearm",
    "forehead",
    "gum",
    "heel",
    "hip",
    "index finger",
    "jaw",
    "knee",
    "knuckle",
    "leg",
    "lip",
    "mouth",
    "mustache",
    "nail",
    "neck",
    "nostril",
    "palm",
    "penis",
    "pinkie",
    "pupil",
    "scalp",
    "shin",
    "shoulder",
    "sideburns",
    "thigh",
    "throat",
    "thumb",
    "tongue",
    "tooth",
    "vagina",
    "waist",
    "wrist",
    "feel",
    // medical related terms
];
/**
 * We are creating a big classification database so extract all info that we have on all conditions
 * and feed to expressions
 * TODO: Include database data here too
 * TODO: Include APIMedic data here too
*/

module.exports = {
    expressions,
    intent
}