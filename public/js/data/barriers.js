// The barrier catalog. Plain language first; every rule cites a source id from sources.js.
//
// strength tells users how firm the ask is, so letters never overclaim:
//   required  Federal rules require it at businesses open to the public. For older buildings
//             the duty applies when the fix is "readily achievable", which DOJ says is true
//             for most parking fixes.
//   built     Required when a place is built or remodeled. For older places it is still a
//             strong request backed by the duty to remove barriers when that is readily achievable.
//   upkeep    Businesses must keep accessible features clear and working.
//   request   Not always required, but a reasonable ask.
//   city      Usually the city's job (public sidewalks and street corners).

export const STRENGTHS = {
  required: {
    label: 'Required',
    help: 'Federal rules require this at businesses open to the public. For older buildings, the duty applies when the fix is "readily achievable" (easy and not too costly). The U.S. Department of Justice says most parking fixes are.',
  },
  built: {
    label: 'Required when built or remodeled',
    help: 'Required for new or remodeled places. For older places, it is still a strong request: businesses must remove barriers when that is easy and not too costly.',
  },
  upkeep: {
    label: 'Must be kept working',
    help: 'Businesses must keep accessible features clear and working. Short repairs are allowed.',
  },
  request: {
    label: 'A fair request',
    help: 'Not always required by law, but a reasonable thing to ask for. Many businesses say yes.',
  },
  city: {
    label: "The city's job",
    help: 'Public sidewalks and street corners are usually the city\'s responsibility. CurbCutter will help you report it to 311 or the city\'s ADA coordinator.',
  },
};

export const CATEGORIES = [
  { id: 'parking', title: 'Parking', hint: 'Spaces, signs, stripes, curb ramps', icon: 'parking' },
  { id: 'entry', title: 'Getting in', hint: 'Steps, ramps, doors, handles', icon: 'door' },
  { id: 'inside', title: 'Inside', hint: 'Aisles, counters, restrooms', icon: 'store' },
  { id: 'path', title: 'Sidewalks and corners', hint: 'Public sidewalks and curb ramps', icon: 'path' },
  { id: 'other', title: 'Something else', hint: 'Describe it in your own words', icon: 'plus' },
];

export const BARRIERS = [
  {
    id: 'parking_too_few',
    cat: 'parking',
    strength: 'required',
    usesCalc: true,
    title: 'Not enough accessible parking spaces',
    short: 'The lot has fewer accessible spaces than the rules call for.',
    rule: 'The 2010 ADA Standards set a minimum number of accessible spaces for each parking lot, based on its total number of spaces (Table 208.2). For example, a lot with 101 to 150 spaces needs at least 5. The U.S. Department of Justice says restriping is relatively inexpensive, so adding spaces is "readily achievable in most cases."',
    ruleShort: 'The 2010 ADA Standards (Table 208.2) set the minimum number of accessible spaces for each parking lot, based on its total number of spaces.',
    cites: ['ab-parking', 'doj-restriping', 'cfr-36-304'],
    fix: 'Add accessible parking spaces so this lot meets the minimum in the 2010 ADA Standards, placed closest to the accessible entrance.',
    photoTips: [
      'Stand back and photograph the whole lot so the number of spaces is clear.',
      'Photograph each accessible space you can find, with its sign.',
    ],
  },
  {
    id: 'parking_no_van',
    cat: 'parking',
    strength: 'required',
    usesCalc: true,
    title: 'No van-accessible space',
    short: 'None of the accessible spaces has room for a van with a ramp or lift.',
    rule: 'At least 1 of every 6 accessible spaces, and never fewer than 1, must be van-accessible (2010 ADA Standards 208.2.4). A van space is 11 feet wide with a 5-foot access aisle, or 8 feet wide with an 8-foot aisle (502.2). Its sign must say "Van Accessible" (502.6).',
    ruleShort: 'At least 1 of every 6 accessible spaces must be van-accessible, with an 8-foot aisle (or an 11-foot space) and a "Van Accessible" sign (2010 ADA Standards 208.2.4, 502.2, 502.6).',
    cites: ['ab-parking', 'doj-restriping'],
    fix: 'Make at least one accessible space van-accessible: an 8-foot-wide access aisle beside it (or an 11-foot-wide space) and a "Van Accessible" sign.',
    photoTips: [
      'Photograph the access aisles next to the accessible spaces.',
      'If you can, lay a tape measure across the aisle and include it in the photo.',
    ],
  },
  {
    id: 'parking_sign',
    cat: 'parking',
    strength: 'required',
    title: 'Missing, faded, or too-low signs',
    short: 'Accessible spaces don\'t have a clear, upright sign.',
    rule: 'Each accessible space needs an upright sign with the International Symbol of Accessibility. The bottom of the sign must be at least 60 inches (5 feet) above the ground (2010 ADA Standards 502.6). Lots with 4 or fewer total spaces are an exception (216.5). In Texas, if a space has no sign, police can give only a warning, not a ticket (Texas Transportation Code §681.011(f-2)).',
    ruleShort: 'Each accessible space needs an upright sign with the International Symbol of Accessibility at least 60 inches above the ground (2010 ADA Standards 502.6). In Texas, police can only give warnings at spaces without a sign (Transportation Code §681.011(f-2)).',
    cites: ['ab-parking', 'tx-681-011', 'tac-68-104'],
    fix: 'Install an upright sign with the International Symbol of Accessibility at each accessible space, at least 60 inches above the ground, with "Van Accessible" on van spaces.',
    photoTips: [
      'Photograph each space where the sign is missing, faded, or too low.',
      'If a sign is low, include something for scale, like the car next to it.',
    ],
  },
  {
    id: 'parking_aisle',
    cat: 'parking',
    strength: 'required',
    title: 'Missing or faded access aisle stripes',
    short: 'The striped area next to the space is worn away, missing, or used for parking.',
    rule: 'Each accessible space needs an access aisle at least 5 feet wide, marked so people won\'t park in it (2010 ADA Standards 502.3). Texas lots built or remodeled under a state rule adopted in 2020 must also have "NO PARKING" painted in the aisle in letters at least 12 inches tall (16 Tex. Admin. Code §68.104).',
    ruleShort: 'Each accessible space needs a marked access aisle at least 5 feet wide (2010 ADA Standards 502.3), and newer Texas lots must have "NO PARKING" painted in it (16 Tex. Admin. Code §68.104).',
    cites: ['ab-parking', 'tac-68-104'],
    fix: 'Repaint the accessible spaces and their access aisles so the aisles are clearly marked as no-parking areas.',
    photoTips: [
      'Photograph the aisle from one end so the faded or missing stripes show.',
      'If cars park in the aisle, photograph the aisle, not people or license plates.',
    ],
  },
  {
    id: 'parking_far',
    cat: 'parking',
    strength: 'built',
    title: 'Accessible spaces are far from the entrance',
    short: 'Regular spaces are closer to the door than the accessible ones.',
    rule: 'Accessible spaces must be on the shortest accessible route to an accessible entrance (2010 ADA Standards 208.3.1). The U.S. Department of Justice tells businesses that restripe to put accessible spaces closest to the accessible entrance, on the most level ground.',
    ruleShort: 'Accessible spaces must be on the shortest accessible route to an accessible entrance (2010 ADA Standards 208.3.1).',
    cites: ['ab-parking', 'doj-restriping'],
    fix: 'Move the accessible spaces to the level spots closest to the accessible entrance.',
    photoTips: [
      'Take one photo that shows both the accessible spaces and the entrance.',
      'Photograph the closer regular spaces too.',
    ],
  },
  {
    id: 'parking_route',
    cat: 'parking',
    strength: 'built',
    title: 'No curb ramp or safe path to the door',
    short: 'From the accessible space, a curb, step, or traffic lane is in the way.',
    rule: 'An accessible route with no steps or curbs must connect accessible parking to an accessible entrance (2010 ADA Standards 206.2.1, 502.3). The U.S. Department of Justice lists cutting curb ramps as an example of barrier removal businesses should do when it is readily achievable (28 CFR 36.304(b)(2)).',
    ruleShort: 'An accessible route without steps or curbs must connect accessible parking to an accessible entrance (2010 ADA Standards 206.2.1), and curb ramps are a U.S. Department of Justice example of barrier removal (28 CFR 36.304(b)(2)).',
    cites: ['ab-routes', 'ab-parking', 'cfr-36-304'],
    fix: 'Add a curb ramp or level path from the accessible spaces\' access aisles to the entrance.',
    photoTips: [
      'Photograph the curb or step between the space and the sidewalk.',
      'Show the path you would have to take instead.',
    ],
  },
  {
    id: 'parking_blocked',
    cat: 'parking',
    strength: 'upkeep',
    title: 'Spaces or aisles are often blocked',
    short: 'Carts, displays, trash cans, or vehicles block the spaces, aisles, or curb ramps.',
    rule: 'Businesses must keep accessible features clear and working. Short interruptions for repairs are allowed (28 CFR 36.211). In Texas, blocking an access aisle or curb ramp with a vehicle is an offense, and parking in an accessible space without a placard or plates carries a fine of $500 to $750 for a first offense (Texas Transportation Code §681.011).',
    ruleShort: 'Businesses must keep accessible features clear and usable (28 CFR 36.211). In Texas, blocking an access aisle or curb ramp with a vehicle is an offense (Transportation Code §681.011).',
    cites: ['cfr-36-211', 'tx-681-011'],
    fix: 'Keep the accessible spaces, access aisles, and curb ramps clear: move cart corrals, displays, and trash cans, and ask staff to report vehicles parked there without a placard.',
    photoTips: [
      'Photograph what is blocking the space or aisle.',
      'Avoid faces and license plates.',
      'Write down the date and time. A pattern is convincing.',
    ],
  },
  {
    id: 'parking_surface',
    cat: 'parking',
    strength: 'built',
    title: 'Space is sloped, cracked, or has potholes',
    short: 'The accessible space or aisle is too steep, broken, or uneven to use safely.',
    rule: 'Accessible spaces and aisles must be nearly level, no steeper than 1:48, with a firm, stable, slip-resistant surface (2010 ADA Standards 502.4, 302).',
    ruleShort: 'Accessible spaces and aisles must be nearly level (no steeper than 1:48) with a firm, stable surface (2010 ADA Standards 502.4).',
    cites: ['ab-parking', 'doj-restriping'],
    fix: 'Repair and level the surface of the accessible spaces and access aisles, or move the spaces to level ground near the entrance.',
    photoTips: ['Photograph cracks, potholes, or slopes up close and from farther away.'],
  },
  {
    id: 'entry_steps',
    cat: 'entry',
    strength: 'built',
    title: 'Steps at the entrance, but no ramp',
    short: 'The only way in has one or more steps.',
    rule: 'The U.S. Department of Justice lists installing ramps as an example of barrier removal businesses should do when it is readily achievable (28 CFR 36.304(b)(1)). New buildings must make at least 60% of public entrances accessible (2010 ADA Standards 206.4), and ramps can be no steeper than 1:12 (405.2).',
    ruleShort: 'Installing ramps is a U.S. Department of Justice example of barrier removal (28 CFR 36.304(b)(1)), and new buildings must make most public entrances accessible (2010 ADA Standards 206.4).',
    cites: ['cfr-36-304', 'ab-doors', 'ada-2010'],
    fix: 'Provide a ramp at this entrance, or another accessible entrance, with a sign showing where it is.',
    photoTips: [
      'Photograph the steps and the whole entrance.',
      'Show any other doors that might work instead.',
    ],
  },
  {
    id: 'entry_door_heavy',
    cat: 'entry',
    strength: 'request',
    title: 'Door is too heavy to open',
    short: 'The door takes a lot of force, or closes too fast to get through.',
    rule: 'Interior doors must open with no more than 5 pounds of force (2010 ADA Standards 404.2.9). Federal rules set no limit for exterior doors, so for an outside door this is a request. Adjusting the door closer or adding a push-button opener usually solves it.',
    ruleShort: 'Interior doors must open with 5 pounds of force or less (2010 ADA Standards 404.2.9). For exterior doors, an easier door is a reasonable request.',
    cites: ['ab-doors'],
    fix: 'Adjust the door closer so the door opens more easily and closes more slowly, or add a push-button automatic opener.',
    photoTips: ['Photograph the door and its closer (the arm at the top of the door).'],
  },
  {
    id: 'entry_door_narrow',
    cat: 'entry',
    strength: 'built',
    title: 'Doorway is too narrow',
    short: 'A wheelchair, walker, or scooter can\'t fit through.',
    rule: 'Doorways need at least 32 inches of clear width with the door open (2010 ADA Standards 404.2.3). The U.S. Department of Justice lists widening doors and installing offset hinges as barrier-removal examples (28 CFR 36.304(b)(8) and (9)).',
    ruleShort: 'Doorways need at least 32 inches of clear width (2010 ADA Standards 404.2.3), and widening doors or adding offset hinges are U.S. Department of Justice barrier-removal examples (28 CFR 36.304(b)).',
    cites: ['ab-doors', 'cfr-36-304'],
    fix: 'Widen the doorway or install offset hinges so it has at least 32 inches of clear width.',
    photoTips: ['If you can, measure the opening with the door open and include the tape measure in the photo.'],
  },
  {
    id: 'entry_hardware',
    cat: 'entry',
    strength: 'built',
    title: 'Door handle is hard to use',
    short: 'A round knob, or hardware that needs a tight grip or twisting.',
    rule: 'Door hardware must work with one hand, without tight grasping, pinching, or twisting the wrist (2010 ADA Standards 404.2.7). Installing accessible door hardware is a U.S. Department of Justice barrier-removal example (28 CFR 36.304(b)(11)).',
    ruleShort: 'Door hardware must work with one hand without tight grasping or twisting (2010 ADA Standards 404.2.7), and accessible hardware is a U.S. Department of Justice barrier-removal example (28 CFR 36.304(b)(11)).',
    cites: ['ab-doors', 'cfr-36-304'],
    fix: 'Replace round knobs with lever handles or push/pull hardware.',
    photoTips: ['Photograph the handle up close.'],
  },
  {
    id: 'entry_threshold',
    cat: 'entry',
    strength: 'built',
    title: 'High threshold or lip at the door',
    short: 'A raised strip at the doorway is hard to roll or step over.',
    rule: 'Door thresholds can be no higher than 1/2 inch in new construction, or 3/4 inch in existing buildings when beveled (2010 ADA Standards 404.2.5). Changes in level over 1/2 inch need a ramp (403.4).',
    ruleShort: 'Thresholds can be no higher than 1/2 inch (3/4 inch in existing buildings, beveled) under the 2010 ADA Standards (404.2.5).',
    cites: ['ab-doors', 'ab-routes'],
    fix: 'Install a small threshold ramp, or replace the threshold so the lip is 1/2 inch or less and beveled.',
    photoTips: ['Photograph the threshold from the side so its height shows.'],
  },
  {
    id: 'inside_aisles',
    cat: 'inside',
    strength: 'upkeep',
    title: 'Aisles or paths are blocked or too narrow',
    short: 'Displays, boxes, or racks leave too little room to get through.',
    rule: 'Accessible routes must be at least 36 inches wide (2010 ADA Standards 403.5.1), and businesses must keep them clear (28 CFR 36.211). Rearranging displays and racks is a U.S. Department of Justice barrier-removal example (28 CFR 36.304(b)(4)).',
    ruleShort: 'Accessible routes must be at least 36 inches wide (2010 ADA Standards 403.5.1) and kept clear (28 CFR 36.211).',
    cites: ['ab-routes', 'cfr-36-211', 'cfr-36-304'],
    fix: 'Keep at least 36 inches of clear width in aisles and paths by moving displays, boxes, and racks, and check it regularly.',
    photoTips: ['Photograph the narrow spot from where you would travel through it.'],
  },
  {
    id: 'inside_counter',
    cat: 'inside',
    strength: 'built',
    title: 'Counter is too high',
    short: 'The checkout or service counter is too tall to use while seated.',
    rule: 'Sales and service counters need a section at least 36 inches long and no higher than 36 inches above the floor (2010 ADA Standards 904.4).',
    ruleShort: 'Sales and service counters need a section at least 36 inches long and no higher than 36 inches (2010 ADA Standards 904.4).',
    cites: ['ada-2010'],
    fix: 'Provide a lowered counter section, at least 36 inches long and no higher than 36 inches, and keep it clear for customers.',
    photoTips: ['Photograph the counter from the height of a seated person.'],
  },
  {
    id: 'inside_restroom',
    cat: 'inside',
    strength: 'built',
    title: 'Restroom isn\'t usable',
    short: 'No grab bars, not enough room to turn, or things out of reach.',
    rule: 'The U.S. Department of Justice lists these as barrier-removal examples: installing grab bars, rearranging toilet partitions for more room, insulating pipes under sinks, adding a raised toilet seat, installing a full-length mirror, and moving the paper towel dispenser (28 CFR 36.304(b)(12) through (17)). New and remodeled restrooms must meet detailed requirements (2010 ADA Standards 603 and 604).',
    ruleShort: 'Grab bars, more room to move, insulated sink pipes, and reachable dispensers are U.S. Department of Justice barrier-removal examples (28 CFR 36.304(b)(12)-(17)).',
    cites: ['cfr-36-304', 'ada-2010'],
    fix: 'Make the restroom usable: add grab bars, make room to turn a wheelchair, insulate the pipes under the sink, and lower the mirror and dispensers.',
    photoTips: ['Only photograph an empty restroom.', 'Show the toilet area and the sink.'],
  },
  {
    id: 'inside_broken',
    cat: 'inside',
    strength: 'upkeep',
    title: 'Accessible feature is broken',
    short: 'An elevator, lift, automatic door, or ramp is out of order or blocked.',
    rule: 'Businesses must keep accessible features in working order. Short interruptions for repairs are allowed, but ongoing outages are not (28 CFR 36.211).',
    ruleShort: 'Businesses must keep accessible features in working order; only short interruptions for repairs are allowed (28 CFR 36.211).',
    cites: ['cfr-36-211'],
    fix: 'Repair the broken feature and check it regularly so it keeps working.',
    photoTips: ['Photograph the broken feature and any "out of order" sign.'],
  },
  {
    id: 'path_city',
    cat: 'path',
    strength: 'city',
    audience: 'city',
    title: 'Public sidewalk or curb ramp problem',
    short: 'A city sidewalk or street corner is broken, blocked, or missing a curb ramp.',
    rule: 'Public sidewalks and street corners are usually the city\'s responsibility. When a city builds or changes streets and sidewalks, it must add curb ramps (28 CFR 35.151(i)). Report problems to 311 or the city\'s ADA coordinator.',
    ruleShort: 'When cities build or alter streets and sidewalks, they must provide curb ramps (28 CFR 35.151(i)).',
    cites: ['cfr-35-151'],
    fix: 'Repair the sidewalk or add a curb ramp so people using wheelchairs, walkers, and strollers can get through.',
    photoTips: ['Photograph the spot and a nearby street sign or landmark so the city can find it.'],
  },
  {
    id: 'other',
    cat: 'other',
    strength: 'request',
    needsNotes: true,
    title: 'Something else',
    short: 'Describe the barrier in your own words.',
    rule: 'Businesses open to the public must remove physical barriers when that is readily achievable, meaning easy to do without much difficulty or expense (28 CFR 36.304).',
    ruleShort: 'Businesses open to the public must remove barriers when it is readily achievable, meaning easy to do without much difficulty or expense (28 CFR 36.304).',
    cites: ['cfr-36-304'],
    fix: '',
    photoTips: ['Photograph the barrier and the area around it.'],
  },
];

const BY_ID = new Map(BARRIERS.map((b) => [b.id, b]));

export function barrier(id) {
  return BY_ID.get(id);
}

export function barriersIn(cat) {
  return BARRIERS.filter((b) => b.cat === cat);
}

export function isParking(id) {
  return BY_ID.get(id)?.cat === 'parking';
}

export function needsCalc(ids) {
  return ids.some((id) => BY_ID.get(id)?.usesCalc);
}

export function isCityOnly(ids) {
  return ids.length > 0 && ids.every((id) => BY_ID.get(id)?.audience === 'city');
}
