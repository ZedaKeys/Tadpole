/**
 * areaMap.ts — Comprehensive mapping from BG3 internal level names to friendly area slugs.
 *
 * The Lua mod captures entity.ServerCharacter.Level values like 'WLD_Main_A', 'GOB_A_Camp'.
 * This module maps those internal names to the area slugs used in areas.ts and provides
 * resolution functions with prefix-based fallback for unknown sub-levels.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AreaInfo {
  slug: string;
  name: string;
  act: number;
  region: string;
}

// ---------------------------------------------------------------------------
// 1. LEVEL_TO_AREA — Exact level-name → area info mapping
// ---------------------------------------------------------------------------

export const LEVEL_TO_AREA: Record<string, AreaInfo> = {
  // ===== Prologue =====
  'TUT_Nautiloid':       { slug: 'nautiloid',              name: 'Nautiloid',               act: 0, region: 'Prologue' },
  'TUT_Nautiloid_A':     { slug: 'nautiloid',              name: 'Nautiloid',               act: 0, region: 'Prologue' },
  'TUT_Nautiloid_B':     { slug: 'nautiloid',              name: 'Nautiloid',               act: 0, region: 'Prologue' },
  'WLD_Prologue':        { slug: 'ravaged-beach',          name: 'Ravaged Beach',           act: 1, region: 'Wilderness' },
  'WLD_Prologue_A':      { slug: 'ravaged-beach',          name: 'Ravaged Beach',           act: 1, region: 'Wilderness' },

  // ===== Act 1 — Wilderness / Overworld =====
  'WLD_Main_A':          { slug: 'ravaged-beach',          name: 'Ravaged Beach',           act: 1, region: 'Wilderness' },
  'WLD_Main_A_Overworld':{ slug: 'ravaged-beach',          name: 'Ravaged Beach',           act: 1, region: 'Wilderness' },

  // ===== Act 1 — Forest / Emerald Grove / Wilderness surface =====
  'FOR_Main':            { slug: 'emerald-grove',          name: 'Emerald Grove',           act: 1, region: 'Wilderness' },
  'FOR_Grove':           { slug: 'emerald-grove',          name: 'Emerald Grove',           act: 1, region: 'Wilderness' },
  'FOR_Grove_A':         { slug: 'emerald-grove',          name: 'Emerald Grove',           act: 1, region: 'Wilderness' },
  'FOR_Grove_B':         { slug: 'druid-grove',            name: 'Druid Grove',             act: 1, region: 'Wilderness' },
  'FOR_Hollow':          { slug: 'emerald-grove',          name: 'Emerald Grove',           act: 1, region: 'Wilderness' },
  'FOR_Camp':            { slug: 'emerald-grove',          name: 'Emerald Grove',           act: 1, region: 'Wilderness' },
  'FOR_RoadsideCliffs':  { slug: 'ravaged-beach',          name: 'Ravaged Beach',           act: 1, region: 'Wilderness' },
  'FOR_OwlbearCave':     { slug: 'emerald-grove',          name: 'Emerald Grove',           act: 1, region: 'Wilderness' },
  'FOR_Wetlands':        { slug: 'blighted-village',       name: 'Blighted Village',        act: 1, region: 'Wilderness' },
  'FOR_SunlitWetlands':  { slug: 'blighted-village',       name: 'Blighted Village',        act: 1, region: 'Wilderness' },
  'FOR_TealAK':          { slug: 'emerald-grove',          name: 'Emerald Grove',           act: 1, region: 'Wilderness' },

  // ===== Act 1 — Blighted Village =====
  'FOR_BlightedVillage': { slug: 'blighted-village',       name: 'Blighted Village',        act: 1, region: 'Wilderness' },
  'FOR_Village':         { slug: 'blighted-village',       name: 'Blighted Village',        act: 1, region: 'Wilderness' },
  'FOR_RisenRoad':       { slug: 'blighted-village',       name: 'Blighted Village',        act: 1, region: 'Wilderness' },

  // ===== Act 1 — Goblin Camp =====
  'GOB_A_Camp':          { slug: 'goblin-camp',            name: 'Goblin Camp',             act: 1, region: 'Wilderness' },
  'GOB_Camp':            { slug: 'goblin-camp',            name: 'Goblin Camp',             act: 1, region: 'Wilderness' },
  'GOB_GoblinCamp':      { slug: 'goblin-camp',            name: 'Goblin Camp',             act: 1, region: 'Wilderness' },
  'GOB_ShatteredSanctum':{ slug: 'goblin-camp',            name: 'Goblin Camp',             act: 1, region: 'Wilderness' },
  'GOB_Sanctum':         { slug: 'goblin-camp',            name: 'Goblin Camp',             act: 1, region: 'Wilderness' },
  'GOB_DefiledTemple':   { slug: 'goblin-camp',            name: 'Goblin Camp',             act: 1, region: 'Wilderness' },
  'GOB_WorgPens':        { slug: 'goblin-camp',            name: 'Goblin Camp',             act: 1, region: 'Wilderness' },
  'GOB_PriestessGut':    { slug: 'goblin-camp',            name: 'Goblin Camp',             act: 1, region: 'Wilderness' },
  'GOB_DrorRagzlin':     { slug: 'goblin-camp',            name: 'Goblin Camp',             act: 1, region: 'Wilderness' },
  'GOB_Minthara':        { slug: 'goblin-camp',            name: 'Goblin Camp',             act: 1, region: 'Wilderness' },

  // ===== Act 1 — Underdark =====
  'UND_Main':            { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_A':               { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_B':               { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_MushroomCave':    { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_Myconid':         { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_MyconidColony':   { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_ArcaneTower':     { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_Duergar':         { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_SeluniteOutpost': { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_Beach':           { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_Spectator':       { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_DecrepitVillage': { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_Bibberbang':      { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_GrymforgeDock':   { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_Storehouse':      { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_Ebonlake':        { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },
  'UND_FesteringCove':   { slug: 'underdark',              name: 'Underdark',               act: 1, region: 'Underdark' },

  // ===== Act 1 — Grymforge =====
  'GRY_Main':            { slug: 'grymforge',              name: 'Grymforge',               act: 1, region: 'Underdark' },
  'GRY_A':               { slug: 'grymforge',              name: 'Grymforge',               act: 1, region: 'Underdark' },
  'GRY_Grymforge':       { slug: 'grymforge',              name: 'Grymforge',               act: 1, region: 'Underdark' },
  'GRY_Forge':           { slug: 'grymforge',              name: 'Grymforge',               act: 1, region: 'Underdark' },
  'GRY_Adamantine':      { slug: 'grymforge',              name: 'Grymforge',               act: 1, region: 'Underdark' },
  'GRY_Dock':            { slug: 'grymforge',              name: 'Grymforge',               act: 1, region: 'Underdark' },
  'GRY_AbandonedRefuge': { slug: 'grymforge',              name: 'Grymforge',               act: 1, region: 'Underdark' },

  // ===== Act 1 — Mountain Pass =====
  'MON_Main':            { slug: 'mountain-pass',          name: 'Mountain Pass',           act: 1, region: 'Wilderness' },
  'MON_A':               { slug: 'mountain-pass',          name: 'Mountain Pass',           act: 1, region: 'Wilderness' },
  'MON_MountainPass':    { slug: 'mountain-pass',          name: 'Mountain Pass',           act: 1, region: 'Wilderness' },
  'MON_Rosymorn':        { slug: 'mountain-pass',          name: 'Mountain Pass',           act: 1, region: 'Wilderness' },
  'MON_Creche':          { slug: 'mountain-pass',          name: 'Mountain Pass',           act: 1, region: 'Wilderness' },
  'MON_Githyanki':       { slug: 'mountain-pass',          name: 'Mountain Pass',           act: 1, region: 'Wilderness' },
  'MON_Trail':           { slug: 'mountain-pass',          name: 'Mountain Pass',           act: 1, region: 'Wilderness' },
  'MON_WaukeensRest':    { slug: 'mountain-pass',          name: 'Mountain Pass',           act: 1, region: 'Wilderness' },

  // ===== Act 1 — Camp =====
  'GLO_QuestCamp':       { slug: 'camp',                   name: 'Camp',                    act: 1, region: 'Camp' },
  'GLO_Camp':            { slug: 'camp',                   name: 'Camp',                    act: 1, region: 'Camp' },
  'GLO_Camp_Main':       { slug: 'camp',                   name: 'Camp',                    act: 1, region: 'Camp' },
  'CAM_Main':            { slug: 'camp',                   name: 'Camp',                    act: 1, region: 'Camp' },
  'CAM_Camp':            { slug: 'camp',                   name: 'Camp',                    act: 1, region: 'Camp' },
  'CAM_Halsin':          { slug: 'camp',                   name: 'Camp',                    act: 1, region: 'Camp' },

  // ===== Act 2 — World =====
  'WLD_Main_B':          { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'WLD_Main_B_Overworld':{ slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },

  // ===== Act 2 — Shadow-Cursed Lands =====
  'SCL_Main':            { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'SCL_A':               { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'SCL_B':               { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'SCL_Reithwin':        { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'SCL_ReithwinTown':    { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'SCL_RuinedBattlefield': { slug: 'shadow-cursed-lands',  name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'SCL_ShadowCrossing':  { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'SCL_GauntletOfShar':  { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'SCL_GrandMausoleum':  { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'SCL_HouseOfHealing':  { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'SCL_NecroticLab':     { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },
  'SCL_Oubliette':       { slug: 'shadow-cursed-lands',    name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' },

  // ===== Act 2 — Moonrise Towers =====
  'MOO_Main':            { slug: 'moonrise-towers',        name: 'Moonrise Towers',         act: 2, region: 'Shadow-Cursed' },
  'MOO_A':               { slug: 'moonrise-towers',        name: 'Moonrise Towers',         act: 2, region: 'Shadow-Cursed' },
  'MOO_MoonriseTowers':  { slug: 'moonrise-towers',        name: 'Moonrise Towers',         act: 2, region: 'Shadow-Cursed' },
  'MOO_Prison':          { slug: 'moonrise-towers',        name: 'Moonrise Towers',         act: 2, region: 'Shadow-Cursed' },
  'MOO_MindFlayerColony':{ slug: 'moonrise-towers',        name: 'Moonrise Towers',         act: 2, region: 'Shadow-Cursed' },
  'MOO_Rooftop':         { slug: 'moonrise-towers',        name: 'Moonrise Towers',         act: 2, region: 'Shadow-Cursed' },
  'MOO_Throne':          { slug: 'moonrise-towers',        name: 'Moonrise Towers',         act: 2, region: 'Shadow-Cursed' },

  // ===== Act 2 — Last Light Inn =====
  'LLI_Main':            { slug: 'last-light-inn',         name: 'Last Light Inn',          act: 2, region: 'Shadow-Cursed' },
  'LLI_A':               { slug: 'last-light-inn',         name: 'Last Light Inn',          act: 2, region: 'Shadow-Cursed' },
  'LLI_LastLightInn':    { slug: 'last-light-inn',         name: 'Last Light Inn',          act: 2, region: 'Shadow-Cursed' },
  'LLI_HarperOutpost':   { slug: 'last-light-inn',         name: 'Last Light Inn',          act: 2, region: 'Shadow-Cursed' },

  // ===== Act 3 — World =====
  'WLD_Main_C':          { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'WLD_Main_C_Overworld':{ slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },

  // ===== Act 3 — Rivington =====
  'RIW_Main':            { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'RIW_A':               { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'RIW_Rivington':       { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'RIW_OpenHandTemple':  { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'RIW_Circus':          { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'RIW_SteelWatch':      { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'RIW_SharessCaress':   { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'RIW_Arfur':           { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'RIW_RefugeeCamp':     { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'RIW_SouthSpan':       { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'RIW_GurCamp':         { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },

  // ===== Act 3 — Wyrm's Crossing (bridge area between Rivington and city) =====
  'RIW_WyrmsCrossing':   { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },
  'RIW_Bridge':          { slug: 'rivington',              name: 'Rivington',               act: 3, region: 'Baldurs Gate' },

  // ===== Act 3 — Lower City =====
  'LOW_Main':            { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_A':               { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_B':               { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_LowerCity':       { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_ElfsongTavern':   { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_SorcerousSundries': { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_Sewers':          { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_BhaalTemple':     { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_FlamingFist':     { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_Cemetery':        { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_Guildhall':       { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_CountingHouse':   { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_SteelWatch':      { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_BlushingMermaid': { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_FlymmCargo':      { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'LOW_BasiliskGate':    { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },

  // ===== Act 3 — Upper City =====
  'UPP_Main':            { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },
  'UPP_A':               { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },
  'UPP_UpperCity':       { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },
  'UPP_HighHall':        { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },
  'UPP_Ravengard':       { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },
  'UPP_Gortash':         { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },
  'UPP_Stormshore':      { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },
  'UPP_RamazithTower':   { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },

  // ===== Act 3 — Wyrm's Rock =====
  'WYR_Main':            { slug: 'wyrms-rock-fortress',    name: "Wyrm's Rock Fortress",    act: 3, region: 'Baldurs Gate' },
  'WYR_A':               { slug: 'wyrms-rock-fortress',    name: "Wyrm's Rock Fortress",    act: 3, region: 'Baldurs Gate' },
  'WYR_WyrmsRock':       { slug: 'wyrms-rock-fortress',    name: "Wyrm's Rock Fortress",    act: 3, region: 'Baldurs Gate' },
  'WYR_Prison':          { slug: 'wyrms-rock-fortress',    name: "Wyrm's Rock Fortress",    act: 3, region: 'Baldurs Gate' },
  'WYR_Throne':          { slug: 'wyrms-rock-fortress',    name: "Wyrm's Rock Fortress",    act: 3, region: 'Baldurs Gate' },
  'WYR_Wyrmway':         { slug: 'wyrms-rock-fortress',    name: "Wyrm's Rock Fortress",    act: 3, region: 'Baldurs Gate' },
  'WYR_DragonSanctum':   { slug: 'wyrms-rock-fortress',    name: "Wyrm's Rock Fortress",    act: 3, region: 'Baldurs Gate' },
  'WYR_Coronation':      { slug: 'wyrms-rock-fortress',    name: "Wyrm's Rock Fortress",    act: 3, region: 'Baldurs Gate' },

  // ===== Act 3 — Szarr Palace =====
  'SZA_Main':            { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },
  'SZA_A':               { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },
  'SZA_SzarrPalace':     { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },
  'SZA_Dungeon':         { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },
  'SZA_Cazador':         { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' },

  // ===== Act 3 — Undercity =====
  'UNC_Main':            { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'UNC_A':               { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'UNC_Undercity':       { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'UNC_UndercityRuins':  { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'UNC_Sewers':          { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'UNC_BhaalTemple':     { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'UNC_MurderTribunal':  { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'UNC_MorphicPool':     { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'UNC_Guildhall':       { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },
  'UNC_AbandonedCistern':{ slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' },

  // ===== Special / Other =====
  'GEN_CharacterCreation':{ slug: 'nautiloid',             name: 'Nautiloid',               act: 0, region: 'Prologue' },
};

// ---------------------------------------------------------------------------
// Prefix fallback map — if the exact level name isn't found but it starts
// with a known prefix, we map it to the parent area.
// ---------------------------------------------------------------------------

const PREFIX_FALLBACKS: Array<{ prefix: string; info: AreaInfo }> = [
  // Prologue
  { prefix: 'TUT_',    info: { slug: 'nautiloid',         name: 'Nautiloid',               act: 0, region: 'Prologue' } },

  // Act 1 — Wilderness
  { prefix: 'FOR_',    info: { slug: 'emerald-grove',     name: 'Emerald Grove',           act: 1, region: 'Wilderness' } },
  { prefix: 'GOB_',    info: { slug: 'goblin-camp',       name: 'Goblin Camp',             act: 1, region: 'Wilderness' } },
  { prefix: 'UND_',    info: { slug: 'underdark',         name: 'Underdark',               act: 1, region: 'Underdark' } },
  { prefix: 'GRY_',    info: { slug: 'grymforge',         name: 'Grymforge',               act: 1, region: 'Underdark' } },
  { prefix: 'MON_',    info: { slug: 'mountain-pass',     name: 'Mountain Pass',           act: 1, region: 'Wilderness' } },
  { prefix: 'GLO_',    info: { slug: 'camp',              name: 'Camp',                    act: 1, region: 'Camp' } },
  { prefix: 'CAM_',    info: { slug: 'camp',              name: 'Camp',                    act: 1, region: 'Camp' } },

  // Act 2 — Shadow-Cursed Lands
  { prefix: 'SCL_',    info: { slug: 'shadow-cursed-lands', name: 'Shadow-Cursed Lands',   act: 2, region: 'Shadow-Cursed' } },
  { prefix: 'MOO_',    info: { slug: 'moonrise-towers',   name: 'Moonrise Towers',         act: 2, region: 'Shadow-Cursed' } },
  { prefix: 'LLI_',    info: { slug: 'last-light-inn',    name: 'Last Light Inn',          act: 2, region: 'Shadow-Cursed' } },

  // Act 3 — Baldur's Gate
  { prefix: 'RIW_',    info: { slug: 'rivington',         name: 'Rivington',               act: 3, region: 'Baldurs Gate' } },
  { prefix: 'LOW_',    info: { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' } },
  { prefix: 'UPP_',    info: { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' } },
  { prefix: 'WYR_',    info: { slug: 'wyrms-rock-fortress', name: "Wyrm's Rock Fortress",  act: 3, region: 'Baldurs Gate' } },
  { prefix: 'SZA_',    info: { slug: 'baldurs-gate-upper-city', name: "Baldur's Gate Upper City", act: 3, region: 'Baldurs Gate' } },
  { prefix: 'UNC_',    info: { slug: 'baldurs-gate-lower-city', name: "Baldur's Gate Lower City", act: 3, region: 'Baldurs Gate' } },
];

// ---------------------------------------------------------------------------
// 2. resolveAreaName — returns AreaInfo or null if completely unknown
// ---------------------------------------------------------------------------

export function resolveAreaName(levelName: string): AreaInfo | null {
  if (!levelName) return null;

  // 1. Exact match
  const exact = LEVEL_TO_AREA[levelName];
  if (exact) return exact;

  // 2. Prefix fallback — find the longest matching prefix
  let bestMatch: AreaInfo | null = null;
  let bestLen = 0;
  for (const { prefix, info } of PREFIX_FALLBACKS) {
    if (levelName.startsWith(prefix) && prefix.length > bestLen) {
      bestMatch = info;
      bestLen = prefix.length;
    }
  }
  if (bestMatch) return bestMatch;

  // 3. World-level fallback
  if (levelName.startsWith('WLD_Main_A')) return { slug: 'ravaged-beach',       name: 'Ravaged Beach',           act: 1, region: 'Wilderness' };
  if (levelName.startsWith('WLD_Main_B')) return { slug: 'shadow-cursed-lands', name: 'Shadow-Cursed Lands',     act: 2, region: 'Shadow-Cursed' };
  if (levelName.startsWith('WLD_Main_C')) return { slug: 'rivington',           name: 'Rivington',               act: 3, region: 'Baldurs Gate' };
  if (levelName.startsWith('WLD_Prologue')) return { slug: 'ravaged-beach',     name: 'Ravaged Beach',           act: 1, region: 'Wilderness' };

  return null;
}

// ---------------------------------------------------------------------------
// 3. resolveAreaSlug — returns slug or raw levelName as fallback
// ---------------------------------------------------------------------------

export function resolveAreaSlug(levelName: string): string {
  const info = resolveAreaName(levelName);
  return info ? info.slug : levelName;
}

// ---------------------------------------------------------------------------
// 4. AREA_CONNECTIONS — connection graph between major areas (from wiki data)
// ---------------------------------------------------------------------------

export const AREA_CONNECTIONS: Record<string, string[]> = {
  // Prologue
  'nautiloid':               ['ravaged-beach'],

  // Act 1 — Wilderness
  'ravaged-beach':           ['emerald-grove', 'nautiloid'],
  'emerald-grove':           ['ravaged-beach', 'blighted-village', 'druid-grove'],
  'druid-grove':             ['emerald-grove'],
  'blighted-village':        ['emerald-grove', 'goblin-camp', 'mountain-pass'],
  'goblin-camp':             ['blighted-village', 'underdark'],
  'underdark':               ['goblin-camp', 'grymforge', 'shadow-cursed-lands'],
  'grymforge':               ['underdark', 'shadow-cursed-lands'],
  'mountain-pass':           ['blighted-village', 'shadow-cursed-lands'],

  // Act 2 — Shadow-Cursed
  'shadow-cursed-lands':     ['underdark', 'grymforge', 'mountain-pass', 'last-light-inn', 'moonrise-towers', 'rivington'],
  'last-light-inn':          ['shadow-cursed-lands'],
  'moonrise-towers':         ['shadow-cursed-lands'],

  // Act 3 — Baldur's Gate
  'rivington':               ['shadow-cursed-lands', 'wyrms-rock-fortress'],
  'wyrms-rock-fortress':     ['rivington', 'baldurs-gate-lower-city'],
  'baldurs-gate-lower-city': ['wyrms-rock-fortress', 'baldurs-gate-upper-city'],
  'baldurs-gate-upper-city': ['baldurs-gate-lower-city'],

  // Camp (interstitial, connects everywhere)
  'camp':                    [],
};

// ---------------------------------------------------------------------------
// 5. AREA_REGIONS — region groupings
// ---------------------------------------------------------------------------

export const AREA_REGIONS: Record<string, {
  label: string;
  act: number;
  areas: string[];
}> = {
  'Prologue': {
    label: 'Prologue',
    act: 0,
    areas: ['nautiloid'],
  },
  'Wilderness': {
    label: 'Wilderness (Act 1)',
    act: 1,
    areas: [
      'ravaged-beach',
      'emerald-grove',
      'druid-grove',
      'blighted-village',
      'goblin-camp',
      'mountain-pass',
    ],
  },
  'Underdark': {
    label: 'Underdark (Act 1)',
    act: 1,
    areas: ['underdark', 'grymforge'],
  },
  'Shadow-Cursed': {
    label: 'Shadow-Cursed Lands (Act 2)',
    act: 2,
    areas: ['shadow-cursed-lands', 'last-light-inn', 'moonrise-towers'],
  },
  'Baldurs Gate': {
    label: "Baldur's Gate (Act 3)",
    act: 3,
    areas: [
      'rivington',
      'wyrms-rock-fortress',
      'baldurs-gate-lower-city',
      'baldurs-gate-upper-city',
    ],
  },
  'Camp': {
    label: 'Camp',
    act: 1,
    areas: ['camp'],
  },
};

// ---------------------------------------------------------------------------
// Utility: get all areas for a given act
// ---------------------------------------------------------------------------

export function getAreasForAct(act: number): AreaInfo[] {
  const seen = new Set<string>();
  const results: AreaInfo[] = [];
  for (const info of Object.values(LEVEL_TO_AREA)) {
    if (info.act === act && !seen.has(info.slug)) {
      seen.add(info.slug);
      results.push(info);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Utility: get all unique area slugs
// ---------------------------------------------------------------------------

export function getAllAreaSlugs(): string[] {
  const slugs = new Set<string>();
  for (const info of Object.values(LEVEL_TO_AREA)) {
    slugs.add(info.slug);
  }
  return Array.from(slugs);
}
