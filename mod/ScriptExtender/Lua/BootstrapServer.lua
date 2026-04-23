-- TadpoleCompanion v0.22.0
-- BG3 ScriptExtender mod for Tadpole companion app
-- BG3SE v30/v31 — comprehensive state capture with error suppression

local Tadpole = {
  lastStateJson = "",
  elapsed = 0,
  recentEvents = {},
  prevState = nil,
  version = "0.22.0",
  sessionStats = {
    damageDealt = 0,
    damageTaken = 0,
    healingDone = 0,
    spellsCast = 0,
    kills = 0,
    criticalHits = 0,
    savingThrows = 0,
    turnsTaken = 0,
  },
}

local MAX_EVENTS = 50

-- Frame counter (e.Time.Delta is userdata in BG3SE, not a number)
local _tickCounter = 0
local function getTime()
  _tickCounter = _tickCounter + 1
  return _tickCounter
end

-- Error suppression — log each unique error ONCE, then silence
local _suppressedErrors = {}
local function suppressError(msg)
  msg = tostring(msg)
  _suppressedErrors[msg] = (_suppressedErrors[msg] or 0) + 1
  if _suppressedErrors[msg] <= 1 then
    pcall(function() Ext.Utils.PrintWarning("[Tadpole] " .. msg) end)
  end
end

local function tryCall(fn)
  if type(fn) ~= "function" then return nil end
  local ok, result = pcall(fn)
  if not ok then suppressError(result); return nil end
  return result
end

-- Safe entity getter
local function safeGetEntity(guid)
  return tryCall(function() return Ext.Entity.Get(guid) end)
end

-- Resource UUID -> Name lookup (engine-internal UUIDs, NOT stat references)
local RESOURCE_NAMES = {
  ["734cbcfb-8922-4b6d-8330-b2a7e4c14b6a"] = "Action",
  ["420c8df5-45c2-4253-93c2-7ec44e127930"] = "BonusAction",
  ["45ff0f48-b210-4024-972f-b64a44dc6985"] = "Reaction",
  ["d136c5d9-0ff0-43da-acce-a74a07f8d6bf"] = "SpellSlot",
  ["d6b2369d-84f0-4ca4-a3a7-62d2d192a185"] = "SorceryPoints",
  ["46886ba5-6505-4875-a747-ac14118e1e08"] = "ChannelDivinity",
}

-- Known BG3 passives for Osi.HasPassive scanning
local KNOWN_PASSIVES = {
  "Darkvision", "FeyAncestry", "Backstab", "Rage", "SneakAttack",
  "Alert", "ArmorMaster", "Athlete", "Actor", "ChargeBound",
  "Cleave", "DefensiveDuelist", "DrowMagic", "ElementalAdept",
  "GreatWeaponMaster", "HeavyArmorMaster", "KeenMind", "Lucky",
  "MageSlayer", "Mobile", "ModeratelyArmored", "MountedCombatant",
  "Observant", "PolearmMaster", "Resilient", "RitualCaster",
  "SavageAttacker", "Sentinel", "Sharpshooter", "ShieldMaster",
  "Skilled", "Skulker", "SpellSniper", "TavernBrawler",
  "Tough", "WarCaster", "WeaponMaster",
  "HellishResistance", "HellishRebuke", "SuperiorDarkvision",
  "SunlightSensitivity", "Brave", "DwarvenResilience", "GnomeCunning",
  "HalflingLucky", "RelentlessEndurance", "SavageAttacks", "Trance",
  "FightingStyle", "SecondWind", "ActionSurge", "ExtraAttack",
  "Indomitable", "ArcaneRecovery", "Metamagic",
  "DivineSmite", "LayOnHands", "ChannelOath",
  "Evasion", "UncannyDodge", "WildShape", "NaturalRecovery",
  "UnarmoredDefense", "MartialArts", "Ki", "FlurryOfBlows",
  "SorcerousRestoration", "FontOfMagic",
  "HighElfCantrip", "DraconicResilience",
}

-- Spell name resolver cache
local _spellNameCache = {}
local function resolveSpellName(spellId)
  if not spellId or spellId == "" then return nil end
  if _spellNameCache[spellId] then return _spellNameCache[spellId] end
  local name = tryCall(function()
    local stat = Ext.Stats.Get(spellId)
    if stat then
      local n = stat.DisplayName
      if n and type(n) == "string" and n ~= "" then return n end
      if n and type(n) == "table" and type(n.Get) == "function" then
        local resolved = n:Get()
        if resolved and resolved ~= "" then return resolved end
      end
      if stat.Name and stat.Name ~= "" then return stat.Name end
    end
    return nil
  end)
  if name then
    _spellNameCache[spellId] = name
    return name
  end
  return nil
end

-- ============================================================
-- Area Level Name → Friendly Name Mapping
-- Maps internal BG3 level names (from ServerCharacter.Level)
-- to human-readable area names, slugs, and act numbers.
-- ============================================================
local AREA_MAP = {
  -- Prologue
  ["TUT_Nautiloid"]          = { name = "The Nautiloid",      slug = "nautiloid",          act = 0 },
  ["TUT_MindFlayerShip"]     = { name = "The Nautiloid",      slug = "nautiloid",          act = 0 },
  ["WLD_Prologue"]           = { name = "Prologue",           slug = "nautiloid",          act = 0 },

  -- Act 1 — Wilderness overworld
  ["WLD_Main_A"]             = { name = "Wilderness",         slug = "wilderness",         act = 1 },
  ["FOR_Wilderness"]         = { name = "Wilderness",         slug = "wilderness",         act = 1 },
  ["FOR_Main_A"]             = { name = "Wilderness",         slug = "wilderness",         act = 1 },

  -- Act 1 — Ravaged Beach
  ["FOR_Beach"]              = { name = "Ravaged Beach",      slug = "ravaged-beach",      act = 1 },
  ["FOR_RavagedBeach"]       = { name = "Ravaged Beach",      slug = "ravaged-beach",      act = 1 },

  -- Act 1 — Emerald Grove
  ["FOR_Grove"]              = { name = "Emerald Grove",      slug = "emerald-grove",      act = 1 },
  ["FOR_EmeraldGrove"]       = { name = "Emerald Grove",      slug = "emerald-grove",      act = 1 },
  ["FOR_DruidGrove"]         = { name = "Emerald Grove",      slug = "emerald-grove",      act = 1 },

  -- Act 1 — Druid Grove (interior)
  ["GOR_Hollow"]             = { name = "The Hollow",         slug = "druid-grove",        act = 1 },
  ["GOR_SacredPool"]         = { name = "Sacred Pool",        slug = "druid-grove",        act = 1 },
  ["GOR_InnerSanctum"]       = { name = "Inner Sanctum",      slug = "druid-grove",        act = 1 },

  -- Act 1 — Forest
  ["FOR_Forest"]             = { name = "Forest",             slug = "forest",             act = 1 },
  ["FOR_OwlbearCave"]        = { name = "Owlbear Nest",       slug = "forest",             act = 1 },

  -- Act 1 — Blighted Village
  ["FOR_Village"]            = { name = "Blighted Village",   slug = "blighted-village",   act = 1 },
  ["FOR_BlightedVillage"]    = { name = "Blighted Village",   slug = "blighted-village",   act = 1 },
  ["FOR_ApothecaryCellar"]   = { name = "Apothecary's Cellar",slug = "blighted-village",   act = 1 },

  -- Act 1 — Sunlit Wetlands
  ["FOR_SunlitWetlands"]     = { name = "Sunlit Wetlands",    slug = "sunlit-wetlands",    act = 1 },
  ["FOR_HagsHollow"]         = { name = "Sunlit Wetlands",    slug = "sunlit-wetlands",    act = 1 },

  -- Act 1 — Risen Road
  ["FOR_RisenRoad"]          = { name = "The Risen Road",     slug = "risen-road",         act = 1 },
  ["WAU_WaukeensRest"]       = { name = "Waukeen's Rest",     slug = "waukeens-rest",      act = 1 },

  -- Act 1 — Goblin Camp
  ["GOB_GoblinCamp"]         = { name = "Goblin Camp",        slug = "goblin-camp",        act = 1 },
  ["GOB_A_Camp"]             = { name = "Goblin Camp",        slug = "goblin-camp",        act = 1 },
  ["FOR_GoblinCamp"]         = { name = "Goblin Camp",        slug = "goblin-camp",        act = 1 },
  ["GOB_ShatteredSanctum"]   = { name = "Shattered Sanctum",  slug = "goblin-camp",        act = 1 },
  ["GOB_DefiledTemple"]      = { name = "Defiled Temple",     slug = "goblin-camp",        act = 1 },
  ["GOB_WorgPens"]           = { name = "Worg Pens",          slug = "goblin-camp",        act = 1 },

  -- Act 1 — Underdark
  ["UND_Underdark"]          = { name = "Underdark",          slug = "underdark",          act = 1 },
  ["UND_ChurgUnderdark_Tutorial"] = { name = "Underdark",     slug = "underdark",          act = 1 },
  ["UND_MushroomForest"]     = { name = "Myconid Colony",     slug = "underdark",          act = 1 },
  ["UND_SeluniteOutpost"]    = { name = "Selûnite Outpost",   slug = "underdark",          act = 1 },
  ["UND_ArcaneTower"]        = { name = "Arcane Tower",       slug = "underdark",          act = 1 },
  ["UND_DecrepitVillage"]    = { name = "Decrepit Village",   slug = "underdark",          act = 1 },
  ["UND_Beach"]              = { name = "Underdark Beach",    slug = "underdark",          act = 1 },
  ["UND_Storehouse"]         = { name = "Underdark Storehouse",slug = "underdark",          act = 1 },
  ["UND_DreadHollow"]        = { name = "Dread Hollow",       slug = "underdark",          act = 1 },
  ["UND_FesteringCove"]      = { name = "The Festering Cove", slug = "underdark",          act = 1 },
  ["UND_EbonlakeGrotto"]     = { name = "Ebonlake Grotto",   slug = "underdark",          act = 1 },

  -- Act 1 — Grymforge
  ["GRY_Grymforge"]          = { name = "Grymforge",          slug = "grymforge",          act = 1 },
  ["GRY_Foundry"]            = { name = "Grymforge Foundry",  slug = "grymforge",          act = 1 },
  ["GRY_AdamantineForge"]    = { name = "Adamantine Forge",   slug = "grymforge",          act = 1 },
  ["GRY_AbandonedRefuge"]    = { name = "Abandoned Refuge",   slug = "grymforge",          act = 1 },

  -- Act 1 — Mountain Pass
  ["MON_MountainPass"]       = { name = "Mountain Pass",      slug = "mountain-pass",      act = 1 },
  ["MON_RosymornMonastery"]  = { name = "Rosymorn Monastery", slug = "mountain-pass",      act = 1 },
  ["MON_Creche"]             = { name = "Crèche Y'llek",      slug = "mountain-pass",      act = 1 },
  ["MON_RosymornTrail"]      = { name = "Rosymorn Trail",     slug = "mountain-pass",      act = 1 },
  ["CRE_Creche"]             = { name = "Crèche Y'llek",      slug = "mountain-pass",      act = 1 },

  -- Act 1 — Overgrown Ruins / Dank Crypt
  ["FOR_OvergrownRuins"]     = { name = "Overgrown Ruins",    slug = "overgrown-ruins",    act = 1 },
  ["FOR_DankCrypt"]          = { name = "Dank Crypt",         slug = "overgrown-ruins",    act = 1 },

  -- Act 1 — Riverside Teahouse (Hag's lair)
  ["FOR_RiversideTeahouse"]  = { name = "Riverside Teahouse", slug = "sunlit-wetlands",    act = 1 },
  ["FOR_HagLair"]            = { name = "Auntie Ethel's Lair",slug = "sunlit-wetlands",    act = 1 },

  -- Camp levels (shared across acts)
  ["GLO_QuestCamp"]          = { name = "Camp",               slug = "camp",               act = 0 },
  ["GLO_Camp"]               = { name = "Camp",               slug = "camp",               act = 0 },
  ["GLO_Camp_Hub"]           = { name = "Camp",               slug = "camp",               act = 0 },

  -- Act 2 — Shadow-Cursed Lands
  ["WLD_Main_B"]             = { name = "Shadow-Cursed Lands",slug = "shadow-cursed-lands",act = 2 },
  ["SCL_ShadowCursed"]       = { name = "Shadow-Cursed Lands",slug = "shadow-cursed-lands",act = 2 },
  ["SCL_Main"]               = { name = "Shadow-Cursed Lands",slug = "shadow-cursed-lands",act = 2 },
  ["SCL_Reithwin"]           = { name = "Reithwin Town",      slug = "shadow-cursed-lands",act = 2 },
  ["SCL_ReithwinTown"]       = { name = "Reithwin Town",      slug = "shadow-cursed-lands",act = 2 },
  ["SCL_SharranSanctuary"]   = { name = "Sharran Sanctuary",  slug = "shadow-cursed-lands",act = 2 },
  ["SCL_RuinedBattlefield"]  = { name = "Ruined Battlefield", slug = "shadow-cursed-lands",act = 2 },
  ["SCL_GauntletOfShar"]     = { name = "Gauntlet of Shar",   slug = "shadow-cursed-lands",act = 2 },
  ["SCL_Shadowfell"]         = { name = "Shadowfell",         slug = "shadow-cursed-lands",act = 2 },

  -- Act 2 — Last Light Inn
  ["LLI_LastLight"]          = { name = "Last Light Inn",     slug = "last-light-inn",     act = 2 },
  ["SCL_LastLightInn"]       = { name = "Last Light Inn",     slug = "last-light-inn",     act = 2 },

  -- Act 2 — Moonrise Towers
  ["MOO_Moonrise"]           = { name = "Moonrise Towers",    slug = "moonrise-towers",    act = 2 },
  ["MOO_MoonriseTowers"]     = { name = "Moonrise Towers",    slug = "moonrise-towers",    act = 2 },
  ["MOO_Prison"]             = { name = "Moonrise Prison",    slug = "moonrise-towers",    act = 2 },
  ["MOO_MindFlayerColony"]   = { name = "Mind Flayer Colony", slug = "moonrise-towers",    act = 2 },
  ["MOO_Rooftop"]            = { name = "Moonrise Rooftop",   slug = "moonrise-towers",    act = 2 },
  ["MOO_Oubliette"]          = { name = "Oubliette",          slug = "moonrise-towers",    act = 2 },

  -- Act 2 — House of Healing
  ["SCL_HouseOfHealing"]     = { name = "House of Healing",   slug = "shadow-cursed-lands",act = 2 },

  -- Act 2 — Reithwin locations
  ["SCL_GrandMausoleum"]     = { name = "Grand Mausoleum",    slug = "shadow-cursed-lands",act = 2 },
  ["SCL_MasonsGuild"]        = { name = "Mason's Guild",      slug = "shadow-cursed-lands",act = 2 },
  ["SCL_Tollhouse"]          = { name = "Reithwin Tollhouse", slug = "shadow-cursed-lands",act = 2 },
  ["SCL_WaningMoon"]         = { name = "The Waning Moon",    slug = "shadow-cursed-lands",act = 2 },

  -- Act 3 — World
  ["WLD_Main_C"]             = { name = "Baldur's Gate",      slug = "baldurs-gate",       act = 3 },

  -- Act 3 — Rivington
  ["RIW_Rivington"]          = { name = "Rivington",          slug = "rivington",          act = 3 },
  ["RIW_Circus"]             = { name = "Circus of the Last Days", slug = "rivington",     act = 3 },
  ["RIW_OpenHandTemple"]     = { name = "Open Hand Temple",   slug = "rivington",          act = 3 },

  -- Act 3 — Wyrm's Crossing
  ["WYC_WyrmsCrossing"]      = { name = "Wyrm's Crossing",    slug = "wyrms-crossing",     act = 3 },

  -- Act 3 — Wyrm's Rock
  ["WYR_WyrmsRock"]          = { name = "Wyrm's Rock Fortress",slug = "wyrms-rock-fortress",act = 3 },
  ["WYR_Prison"]             = { name = "Wyrm's Rock Prison", slug = "wyrms-rock-fortress",act = 3 },
  ["WYR_Wyrmway"]            = { name = "The Wyrmway",        slug = "wyrms-rock-fortress",act = 3 },

  -- Act 3 — Lower City
  ["LOW_LowerCity"]          = { name = "Lower City",          slug = "baldurs-gate-lower-city", act = 3 },
  ["LOW_Sewers"]             = { name = "Lower City Sewers",   slug = "baldurs-gate-lower-city", act = 3 },
  ["LOW_Guildhall"]          = { name = "Guildhall",           slug = "baldurs-gate-lower-city", act = 3 },
  ["LOW_ElfsongTavern"]      = { name = "Elfsong Tavern",      slug = "baldurs-gate-lower-city", act = 3 },
  ["LOW_SorcerousSundries"]  = { name = "Sorcerous Sundries",  slug = "baldurs-gate-lower-city", act = 3 },
  ["LOW_BasiliskGate"]       = { name = "Basilisk Gate",       slug = "baldurs-gate-lower-city", act = 3 },
  ["LOW_CountingHouse"]      = { name = "The Counting House",  slug = "baldurs-gate-lower-city", act = 3 },
  ["LOW_Graveyard"]          = { name = "Graveyard",           slug = "baldurs-gate-lower-city", act = 3 },
  ["LOW_SteelWatch"]         = { name = "Steel Watch Foundry", slug = "baldurs-gate-lower-city", act = 3 },

  -- Act 3 — Undercity
  ["UNC_Undercity"]          = { name = "Undercity",           slug = "undercity",          act = 3 },
  ["UNC_UndercityRuins"]     = { name = "Undercity Ruins",     slug = "undercity",          act = 3 },
  ["UNC_BhaalTemple"]        = { name = "Bhaal Temple",        slug = "undercity",          act = 3 },
  ["UNC_MorphicPool"]        = { name = "Morphic Pool",        slug = "undercity",          act = 3 },

  -- Act 3 — Upper City
  ["UPP_UpperCity"]          = { name = "Upper City",          slug = "baldurs-gate-upper-city", act = 3 },
  ["UPP_HighHall"]           = { name = "High Hall",           slug = "baldurs-gate-upper-city", act = 3 },

  -- Act 3 — Szarr Palace
  ["SZA_SzarrPalace"]        = { name = "Szarr Palace",        slug = "baldurs-gate-upper-city", act = 3 },
  ["SZA_CazadorDungeon"]     = { name = "Cazador's Dungeon",   slug = "baldurs-gate-upper-city", act = 3 },

  -- Other / special
  ["GEN_CharacterCreation"]  = { name = "Character Creation",  slug = "character-creation", act = 0 },
  ["WLD_DevilCamp"]          = { name = "Camp",                 slug = "camp",               act = 0 },
}

-- Prefix fallback: if no exact match, try prefix to map to a parent area
local AREA_PREFIX_MAP = {
  ["TUT_"]   = { name = "Prologue",       slug = "nautiloid",          act = 0 },
  ["FOR_"]   = { name = "Wilderness",      slug = "wilderness",         act = 1 },
  ["GOB_"]   = { name = "Goblin Camp",     slug = "goblin-camp",        act = 1 },
  ["UND_"]   = { name = "Underdark",       slug = "underdark",          act = 1 },
  ["GRY_"]   = { name = "Grymforge",       slug = "grymforge",          act = 1 },
  ["MON_"]   = { name = "Mountain Pass",   slug = "mountain-pass",      act = 1 },
  ["CRE_"]   = { name = "Crèche Y'llek",   slug = "mountain-pass",      act = 1 },
  ["SCL_"]   = { name = "Shadow-Cursed Lands", slug = "shadow-cursed-lands", act = 2 },
  ["LLI_"]   = { name = "Last Light Inn",  slug = "last-light-inn",     act = 2 },
  ["MOO_"]   = { name = "Moonrise Towers", slug = "moonrise-towers",    act = 2 },
  ["RIW_"]   = { name = "Rivington",       slug = "rivington",          act = 3 },
  ["WYC_"]   = { name = "Wyrm's Crossing", slug = "wyrms-crossing",     act = 3 },
  ["WYR_"]   = { name = "Wyrm's Rock",     slug = "wyrms-rock-fortress",act = 3 },
  ["LOW_"]   = { name = "Lower City",      slug = "baldurs-gate-lower-city", act = 3 },
  ["UNC_"]   = { name = "Undercity",        slug = "undercity",          act = 3 },
  ["UPP_"]   = { name = "Upper City",      slug = "baldurs-gate-upper-city", act = 3 },
  ["SZA_"]   = { name = "Szarr Palace",    slug = "baldurs-gate-upper-city", act = 3 },
  ["GLO_"]   = { name = "Camp",            slug = "camp",               act = 0 },
  ["WLD_"]   = { name = "World",           slug = "wilderness",         act = 1 },
  ["WAU_"]   = { name = "Waukeen's Rest",  slug = "waukeens-rest",      act = 1 },
  ["GOR_"]   = { name = "Grove Interior",  slug = "druid-grove",        act = 1 },
  ["GEN_"]   = { name = "Game System",     slug = "camp",               act = 0 },
  ["CAM_"]   = { name = "Camp",            slug = "camp",               act = 0 },
}

--- Resolve internal level name to friendly area info
--- @param levelName string Internal BG3 level name (e.g. "GOB_A_Camp")
--- @return table|nil { name, slug, act }
local function resolveAreaName(levelName)
  if not levelName or levelName == "" then return nil end
  -- Exact match
  if AREA_MAP[levelName] then return AREA_MAP[levelName] end
  -- Prefix fallback (longest prefix match)
  for prefix, info in pairs(AREA_PREFIX_MAP) do
    if levelName:sub(1, #prefix) == prefix then
      return info
    end
  end
  return nil
end

-- Helper: get all party member GUIDs (host + companions)
-- Tries multiple methods because DB_Players can be nil in some BG3SE versions
local function getPartyMembers()
  local members = {}
  local seen = {}

  -- Method 1: DB_Players (the "proper" way)
  tryCall(function()
    local _, playerRows = Osi.DB_Players:Get(nil)
    if playerRows then
      for _, row in ipairs(playerRows) do
        if row[1] and not seen[row[1]] then
          table.insert(members, row[1])
          seen[row[1]] = true
        end
      end
    end
  end)

  -- Method 2: If DB_Players failed, try iterating character list
  if #members == 0 then
    tryCall(function()
      local hostGuid = Osi.GetHostCharacter()
      if hostGuid then
        table.insert(members, hostGuid)
        seen[hostGuid] = true
      end
      -- Try Osi.DB_AvailableCharacters or similar fallbacks
      local _, availRows = Osi.DB_AvailableCharacters:Get(nil, nil)
      if availRows then
        for _, row in ipairs(availRows) do
          if row[1] and not seen[row[1]] then
            table.insert(members, row[1])
            seen[row[1]] = true
          end
        end
      end
    end)
  end

  -- Method 3: Last resort, just use host
  if #members == 0 then
    tryCall(function()
      local hostGuid = Osi.GetHostCharacter()
      if hostGuid then
        table.insert(members, hostGuid)
      end
    end)
  end

  return members
end

-- Helper: check if guid is host or party member
local function isHostOrParty(guid)
  if not guid or guid == "" then return false end
  local hostGuid = tryCall(function() return Osi.GetHostCharacter() end)
  if hostGuid and guid == hostGuid then return true end
  local members = getPartyMembers()
  for _, m in ipairs(members) do
    if m == guid then return true end
  end
  return false
end

---------------------------------------------------------------------------
-- Get character name (multiple fallback strategies)
---------------------------------------------------------------------------
local function getName(entity)
  -- Strategy 1: CustomName (player-chosen name)
  local name = tryCall(function()
    if entity.CustomName and entity.CustomName.Name then
      local n = entity.CustomName.Name
      local s = tostring(n)
      if s ~= "" and s ~= "nil" then return s end
    end
    return nil
  end)
  if name then return name end

  -- Strategy 2: DisplayName.Name as TranslatedString with :Get()
  name = tryCall(function()
    if entity.DisplayName and entity.DisplayName.Name then
      local n = entity.DisplayName.Name
      if type(n) == "table" and type(n.Get) == "function" then
        local s = tostring(n:Get())
        if s ~= "" and s ~= "nil" then return s end
      end
      local s = tostring(n)
      if s ~= "" and s ~= "nil" then return s end
    end
    return nil
  end)
  if name then return name end

  -- Strategy 3: DisplayName.Name.Key
  name = tryCall(function()
    if entity.DisplayName and entity.DisplayName.Name and entity.DisplayName.Name.Key then
      local s = tostring(entity.DisplayName.Name.Key)
      if s ~= "" and s ~= "nil" then return s end
    end
    return nil
  end)
  if name then return name end

  return "Unknown"
end

---------------------------------------------------------------------------
-- Get position via entity.Transform.Transform.Translate[1/2/3]
-- Osi.GetTransform is NIL in BG3SE v30
---------------------------------------------------------------------------
local function getPosition(entity)
  local x, y, z = 0, 0, 0
  tryCall(function()
    local translate = entity.Transform.Transform.Translate
    x = tonumber(translate[1]) or 0
    y = tonumber(translate[2]) or 0
    z = tonumber(translate[3]) or 0
  end)
  return { x = x, y = y, z = z }
end

---------------------------------------------------------------------------
-- Get character level (try EocLevel first, then Stats)
---------------------------------------------------------------------------
local function getLevel(entity)
  local level = 0
  -- EocLevel.Level = effective character level
  tryCall(function()
    if entity.EocLevel then
      level = tonumber(entity.EocLevel.Level) or 0
    end
  end)
  if level > 0 then return level end
  -- Fallback: Stats.Level
  tryCall(function()
    if entity.Stats then
      level = tonumber(entity.Stats.Level) or 0
    end
  end)
  if level > 0 then return level end
  return 1
end

---------------------------------------------------------------------------
-- Build full character data
---------------------------------------------------------------------------
local function getPartyMemberData(guid, hostGuid)
  local entity = safeGetEntity(guid)
  if not entity then return nil end

  local name = getName(entity)
  local position = getPosition(entity)
  local level = getLevel(entity)

  -- HP
  local hp, maxHp, tempHp = 0, 1, 0
  tryCall(function()
    if entity.Health then
      hp = tonumber(entity.Health.Hp) or 0
      maxHp = tonumber(entity.Health.MaxHp) or 1
      tempHp = tonumber(entity.Health.TemporaryHp) or 0
    end
  end)

  -- Is invulnerable
  local isInvulnerable = false
  tryCall(function()
    if entity.Health then
      isInvulnerable = entity.Health.IsInvulnerable or false
    end
  end)

  -- Initiative (ServerBaseStats.Initiative, NOT Stats._InitiativeBonus)
  local initiative = 0
  tryCall(function()
    if entity.ServerBaseStats then
      initiative = tonumber(entity.ServerBaseStats.Initiative) or 0
    end
  end)
  if initiative == 0 then
    tryCall(function()
      if entity.Stats then
        initiative = tonumber(entity.Stats.InitiativeBonus) or 0
      end
    end)
  end

  -- Armor class
  local armorClass = 10
  tryCall(function()
    if entity.Resistances then
      armorClass = tonumber(entity.Resistances.AC) or 10
    end
  end)

  -- Proficiency bonus
  local proficiencyBonus = 0
  tryCall(function()
    if entity.Stats then
      proficiencyBonus = tonumber(entity.Stats.ProficiencyBonus) or 0
    end
  end)

  -- Action resources (spell slots + all class resources)
  -- LegacyMap<Guid, Array<ActionResourceEntry>> — use pairs(), NOT ipairs()
  local spellSlots = {}
  local actionResources = {}
  tryCall(function()
    if entity.ActionResources and entity.ActionResources.Resources then
      for uuid, entries in pairs(entity.ActionResources.Resources) do
        local resName = RESOURCE_NAMES[tostring(uuid)] or tostring(uuid):sub(1, 8)
        local resData = { name = resName, slots = {} }
        for i = 1, #entries do
          local entry = entries[i]
          local slotInfo = {
            amount = tonumber(entry.Amount) or 0,
            maxAmount = tonumber(entry.MaxAmount) or 0,
            level = tonumber(entry.Level) or 0,
          }
          table.insert(resData.slots, slotInfo)
          if resName == "SpellSlot" then
            local slotLevel = "level" .. tostring(entry.Level or 1)
            spellSlots[slotLevel] = {
              current = tonumber(entry.Amount) or 0,
              max = tonumber(entry.MaxAmount) or 0,
            }
          end
        end
        table.insert(actionResources, resData)
      end
    end
  end)

  -- Active conditions (statuses)
  -- StatusContainer.Statuses = LegacyMap — use pairs(), value IS the name string
  local conditions = {}
  tryCall(function()
    if entity.StatusContainer and entity.StatusContainer.Statuses then
      for _, statusName in pairs(entity.StatusContainer.Statuses) do
        if type(statusName) == "string" and statusName ~= "" then
          table.insert(conditions, statusName)
        end
      end
    end
  end)

  -- Concentration with spell name resolver
  local concentration = nil
  tryCall(function()
    if entity.Concentration then
      concentration = {}
      if entity.Concentration.SpellId then
        concentration.spellId = tostring(entity.Concentration.SpellId)
        local sName = resolveSpellName(concentration.spellId)
        if sName then
          concentration.spellName = sName
        end
      end
      if entity.Concentration.Caster then
        concentration.caster = tostring(entity.Concentration.Caster)
      end
    end
  end)

  -- Spellbook capture (SpellBook.Spells + SpellBookPrepares.PreparedSpells)
  local spellbook = nil
  tryCall(function()
    local known = {}
    local prepared = {}

    -- Known spells from SpellBook.Spells
    tryCall(function()
      if entity.SpellBook and entity.SpellBook.Spells then
        for _, spellEntry in pairs(entity.SpellBook.Spells) do
          local spellId = nil
          tryCall(function()
            if type(spellEntry) == "table" then
              spellId = tostring(spellEntry.SpellId or spellEntry.Spell or "")
            elseif type(spellEntry) == "string" then
              spellId = spellEntry
            else
              spellId = tostring(spellEntry)
            end
          end)
          if spellId and spellId ~= "" and spellId ~= "nil" then
            table.insert(known, spellId)
          end
        end
      end
    end)

    -- Prepared spells from SpellBookPrepares.PreparedSpells
    tryCall(function()
      if entity.SpellBookPrepares and entity.SpellBookPrepares.PreparedSpells then
        for _, spellEntry in pairs(entity.SpellBookPrepares.PreparedSpells) do
          local spellId = nil
          tryCall(function()
            if type(spellEntry) == "table" then
              spellId = tostring(spellEntry.SpellId or spellEntry.Spell or "")
            elseif type(spellEntry) == "string" then
              spellId = spellEntry
            else
              spellId = tostring(spellEntry)
            end
          end)
          if spellId and spellId ~= "" and spellId ~= "nil" then
            table.insert(prepared, spellId)
          end
        end
      end
    end)

    if #known > 0 or #prepared > 0 then
      spellbook = { known = known, prepared = prepared }
    end
  end)

  -- Equipment capture
  local equipment = nil
  tryCall(function()
    if entity.Equipment then
      equipment = {}
      -- Try iterating with pairs() (LegacyMap or similar)
      tryCall(function()
        for slotName, itemHandle in pairs(entity.Equipment) do
          tryCall(function()
            local slotStr = tostring(slotName)
            local itemId = ""
            local itemName = ""

            -- Try getting item entity
            tryCall(function()
              local itemEntity = Ext.Entity.Get(itemHandle)
              if itemEntity then
                -- Try template/stable UUID
                tryCall(function()
                  if itemEntity.ServerItem and itemEntity.ServerItem.Template then
                    itemId = tostring(itemEntity.ServerItem.Template)
                  end
                end)
                if itemId == "" then
                  tryCall(function()
                    if itemEntity.Template then
                      itemId = tostring(itemEntity.Template)
                    end
                  end)
                end
                -- Try name
                itemName = getName(itemEntity)
              end
            end)

            -- Fallback: try itemHandle as direct string
            if itemId == "" then
              tryCall(function() itemId = tostring(itemHandle) end)
            end

            if slotStr ~= "" then
              equipment[slotStr] = {
                id = itemId,
                name = itemName ~= "Unknown" and itemName or "",
              }
            end
          end)
        end
      end)

      -- If pairs() returned nothing, try slot-based access
      if equipment and next(equipment) == nil then
        local EQUIPMENT_SLOTS = {
          "Helmet", "Armor", "Gloves", "Boots", "Amulet",
          "Ring1", "Ring2", "Weapon", "Offhand", "Cloak",
          "Underwear", "MusicalInstrument", "Helmet2",
        }
        for _, slotName in ipairs(EQUIPMENT_SLOTS) do
          tryCall(function()
            local itemHandle = entity.Equipment[slotName]
            if itemHandle then
              local itemId = ""
              local itemName = ""
              tryCall(function()
                local itemEntity = Ext.Entity.Get(itemHandle)
                if itemEntity then
                  tryCall(function()
                    if itemEntity.ServerItem and itemEntity.ServerItem.Template then
                      itemId = tostring(itemEntity.ServerItem.Template)
                    end
                  end)
                  if itemId == "" then
                    tryCall(function()
                      if itemEntity.Template then
                        itemId = tostring(itemEntity.Template)
                      end
                    end)
                  end
                  itemName = getName(itemEntity)
                end
              end)
              if itemId == "" then
                tryCall(function() itemId = tostring(itemHandle) end)
              end
              equipment[slotName] = {
                id = itemId,
                name = itemName ~= "Unknown" and itemName or "",
              }
            end
          end)
        end
      end

      -- If still empty, nil it out
      if equipment and next(equipment) == nil then
        equipment = nil
      end
    end
  end)

  -- Party member approval detection
  local approval = nil
  if hostGuid and guid ~= hostGuid then
    tryCall(function()
      local approvalVal = Osi.GetApproval(guid, hostGuid)
      if approvalVal then
        approval = tonumber(approvalVal)
      end
    end)
    -- Fallback: try entity relationship components
    if approval == nil then
      tryCall(function()
        if entity.RelationshipFactory then
          tryCall(function()
            local rel = entity.RelationshipFactory
            if type(rel) == "table" or type(rel) == "userdata" then
              -- Try common field names
              tryCall(function() approval = tonumber(rel.Approval or rel.approval or rel.Score or rel.score) end)
            end
          end)
        end
      end)
      if approval == nil then
        tryCall(function()
          if entity.Relationship then
            tryCall(function()
              local rel = entity.Relationship
              if type(rel) == "table" or type(rel) == "userdata" then
                tryCall(function() approval = tonumber(rel.Approval or rel.approval or rel.Score or rel.score) end)
              end
            end)
          end
        end)
      end
    end
  end

  -- Experience detail (NO underscores on property names!)
  local experience = nil
  tryCall(function()
    if entity.Experience then
      experience = {
        currentLevelXp = tonumber(entity.Experience.CurrentLevelExperience) or 0,
        nextLevelXp = tonumber(entity.Experience.NextLevelExperience) or 0,
        totalXp = tonumber(entity.Experience.TotalExperience) or 0,
      }
    end
  end)

  -- Encumbrance (divide internal units by 10000 for display)
  local encumbrance = nil
  tryCall(function()
    local weight = 0
    tryCall(function() weight = tonumber(entity.InventoryWeight.Weight) or 0 end)
    local state = 0
    tryCall(function() state = tonumber(entity.EncumbranceState.State) or 0 end)
    local maxNormal, maxEnc, maxHeavy = 0, 0, 0
    tryCall(function()
      maxNormal = tonumber(entity.EncumbranceStats.UnencumberedWeight) or 0
      maxEnc = tonumber(entity.EncumbranceStats.EncumberedWeight) or 0
      maxHeavy = tonumber(entity.EncumbranceStats.HeavilyEncumberedWeight) or 0
    end)
    encumbrance = {
      weight = math.floor(weight / 10000),
      state = state,
      maxWeight = math.floor(maxNormal / 10000),
      encumberedWeight = math.floor(maxEnc / 10000),
      heavilyEncumberedWeight = math.floor(maxHeavy / 10000),
    }
  end)

  -- Vision (NO underscores!)
  local vision = nil
  tryCall(function()
    if entity.Sight then
      vision = {
        darkvisionRange = tonumber(entity.Sight.DarkvisionRange) or 0,
        sightRange = tonumber(entity.Sight.Sight) or 0,
        fov = tonumber(entity.Sight.FOV) or 0,
      }
    end
  end)

  -- Movement speed
  local movementSpeed = 0
  tryCall(function()
    if entity.Movement then
      movementSpeed = tonumber(entity.Movement.Speed) or 0
    end
  end)

  -- Death saves
  local deathSaves = nil
  tryCall(function()
    if entity.DeathState then
      deathSaves = {
        successes = tonumber(entity.DeathState.Successes) or 0,
        failures = tonumber(entity.DeathState.Failures) or 0,
        isDead = entity.DeathState.IsDead or false,
      }
    end
  end)

  -- Combat detail (NO underscores!)
  local combatDetail = nil
  tryCall(function()
    if entity.CombatParticipant then
      combatDetail = {
        initiativeRoll = tonumber(entity.CombatParticipant.InitiativeRoll) or 0,
        combatGroupId = tostring(entity.CombatParticipant.CombatGroupId or ""),
      }
    end
  end)

  -- Character flags from ServerCharacter
  local characterFlags = {}
  tryCall(function()
    if entity.ServerCharacter then
      local sc = entity.ServerCharacter
      if sc.FightMode then characterFlags.fightMode = true end
      if sc.Floating then characterFlags.floating = true end
      if sc.Invisible then characterFlags.invisible = true end
      if sc.OffStage then characterFlags.offStage = true end
      if sc.StoryNPC then characterFlags.storyNPC = true end
      if sc.IsPet then characterFlags.isPet = true end
      if sc.CannotDie then characterFlags.cannotDie = true end
      if sc.Dead then characterFlags.dead = true end
      if sc.Invulnerable then characterFlags.invulnerable = true end
      if sc.CannotMove then characterFlags.cannotMove = true end
      if sc.CannotRun then characterFlags.cannotRun = true end
      if sc.IsPlayer then characterFlags.isPlayer = true end
      if sc.SpotSneakers then characterFlags.spotSneakers = true end
    end
  end)

  -- Tadpole state
  local hasTadpole = false
  local tadpoleState = nil
  tryCall(function() if entity.Tadpoled then hasTadpole = true end end)
  tryCall(function()
    if entity.TadpoleTreeState then
      tadpoleState = { state = tonumber(entity.TadpoleTreeState.State) or 0 }
    end
  end)

  -- Race/Background/Origin (UUIDs)
  local race = ""
  local background = ""
  local origin = ""
  tryCall(function() if entity.Race then race = tostring(entity.Race.Race or "") end end)
  tryCall(function() if entity.Background then background = tostring(entity.Background.Background or "") end end)
  tryCall(function() if entity.Origin then origin = tostring(entity.Origin.Origin or "") end end)
  local raceAndBackground = {
    raceId = race,
    backgroundId = background,
    origin = origin,
  }

  -- Is player/avatar (component existence check)
  local isPlayer = false
  local isAvatar = false
  tryCall(function() if entity.Player then isPlayer = true end end)
  tryCall(function() if entity.Avatar then isAvatar = true end end)

  -- Tags
  local tags = {}
  tryCall(function()
    if entity.Tag and entity.Tag.Tags then
      for _, tag in pairs(entity.Tag.Tags) do
        if type(tag) == "string" and tag ~= "" then
          table.insert(tags, tag)
        end
      end
    end
  end)

  -- Passives (check known passives via Osi.HasPassive)
  local passives = {}
  for _, pname in ipairs(KNOWN_PASSIVES) do
    local hasIt = tryCall(function() return Osi.HasPassive(guid, pname) end)
    if hasIt == 1 or hasIt == true then
      table.insert(passives, pname)
    end
  end

  -- Ability scores from Stats.Abilities (Array<int32> userdata, indices 2-7!)
  -- 0=invalid, 1=invalid, 2=STR, 3=DEX, 4=CON, 5=INT, 6=WIS, 7=CHA
  local abilityScores = nil
  tryCall(function()
    if entity.Stats and entity.Stats.Abilities then
      local ab = entity.Stats.Abilities
      abilityScores = {
        str = tonumber(ab[2]) or 10,
        dex = tonumber(ab[3]) or 10,
        con = tonumber(ab[4]) or 10,
        int = tonumber(ab[5]) or 10,
        wis = tonumber(ab[6]) or 10,
        cha = tonumber(ab[7]) or 10,
      }
    end
  end)

  -- Ability modifiers (same 2-7 index structure)
  local abilityModifiers = nil
  tryCall(function()
    if entity.Stats and entity.Stats.AbilityModifiers then
      local am = entity.Stats.AbilityModifiers
      abilityModifiers = {
        str = tonumber(am[2]) or 0,
        dex = tonumber(am[3]) or 0,
        con = tonumber(am[4]) or 0,
        int = tonumber(am[5]) or 0,
        wis = tonumber(am[6]) or 0,
        cha = tonumber(am[7]) or 0,
      }
    end
  end)

  -- In dialog (entity.ServerCharacter.InDialog, NOT Osi.IsInDialog which is nil)
  local inDialog = false
  tryCall(function()
    if entity.ServerCharacter then
      inDialog = entity.ServerCharacter.InDialog or false
    end
  end)

  -- Sneaking & stealth (from Darkness component)
  local isSneaking = false
  local stealthState = nil
  tryCall(function()
    if entity.Darkness then
      isSneaking = entity.Darkness.Sneaking or false
      stealthState = {
        sneaking = isSneaking == true,
        obscurity = tonumber(entity.Darkness.Obscurity) or 0,
      }
    end
  end)

  -- Area from ServerCharacter.Level (NOT Template.CurrentLevel which errors)
  local area = ""
  tryCall(function()
    if entity.ServerCharacter then
      area = tostring(entity.ServerCharacter.Level or "")
    end
  end)

  -- God/deity
  local god = ""
  tryCall(function()
    if entity.God then
      god = tostring(entity.God.God or "")
    end
  end)

  -- Build result table
  local result = {
    guid = guid,
    name = name,
    hp = hp,
    maxHp = maxHp,
    tempHp = tempHp,
    level = level,
    armorClass = armorClass,
    initiative = initiative,
    proficiencyBonus = proficiencyBonus,
    spellSlots = spellSlots,
    actionResources = actionResources,
    conditions = conditions,
    concentration = concentration,
    position = position,
    experience = experience,
    encumbrance = encumbrance,
    vision = vision,
    movementSpeed = movementSpeed,
    deathSaves = deathSaves,
    combatDetail = combatDetail,
    characterFlags = characterFlags,
    hasTadpole = hasTadpole,
    tadpoleState = tadpoleState,
    race = race,
    background = background,
    origin = origin,
    raceAndBackground = { raceId = race, backgroundId = background, origin = origin },
    isPlayer = isPlayer,
    isAvatar = isAvatar,
    tags = tags,
    passives = passives,
    abilityScores = abilityScores,
    abilityModifiers = abilityModifiers,
    inDialog = inDialog,
    isSneaking = isSneaking == true,
    isInvulnerable = isInvulnerable,
    stealthState = stealthState,
    area = area,
    god = god,
    spellbook = spellbook,
    equipment = equipment,
  }

  -- Add approval if found
  if approval ~= nil then
    result.approval = approval
  end

  return result
end

---------------------------------------------------------------------------
-- Event helper
---------------------------------------------------------------------------
local function addEvent(evt)
  table.insert(Tadpole.recentEvents, evt)
  while #Tadpole.recentEvents > MAX_EVENTS do
    table.remove(Tadpole.recentEvents, 1)
  end
end

---------------------------------------------------------------------------
-- Main state capture
---------------------------------------------------------------------------
function Tadpole:CaptureState()
  local ok, result = pcall(function()
    local hostGuid = Osi.GetHostCharacter()
    if not hostGuid then return nil end

    -- Party detection via getPartyMembers (multi-method fallback)
    local party = {}
    tryCall(function()
      local members = getPartyMembers()
      for _, guid in ipairs(members) do
        if guid ~= hostGuid then
          local data = getPartyMemberData(guid, hostGuid)
          if data then table.insert(party, data) end
        end
      end
    end)

    local hostData = getPartyMemberData(hostGuid, hostGuid)

    -- Session-level area (from Ext.Utils.GetCurrentLevel)
    local area = ""
    pcall(function() area = Ext.Utils.GetCurrentLevel() or "" end)
    local areaInfo = resolveAreaName(area)
    local areaName = areaInfo and areaInfo.name or ""
    local areaSlug = areaInfo and areaInfo.slug or ""
    local areaAct = areaInfo and areaInfo.act or 0

    local gold = 0
    pcall(function() gold = Osi.GetGold(hostGuid) or 0 end)

    local inCombat = false
    pcall(function() inCombat = Osi.IsInCombat(hostGuid) == 1 end)

    -- Camp supplies (entity components are userdata, wrap in pcall + tonumber)
    local campSupplies = { canRest = true, current = 0, max = 0 }
    tryCall(function()
      local hostEntity = safeGetEntity(hostGuid)
      if hostEntity then
        tryCall(function() campSupplies.current = tonumber(hostEntity.CampSupply) or 0 end)
        tryCall(function() campSupplies.max = tonumber(hostEntity.CampTotalSupplies) or 0 end)
        tryCall(function()
          local rest = hostEntity.CanDoRest
          if type(rest) == "boolean" then campSupplies.canRest = rest end
        end)
      end
    end)

    local state = {
      version = self.version,
      timestamp = getTime(),
      area = area,
      areaName = areaName,
      areaSlug = areaSlug,
      areaAct = areaAct,
      inCombat = inCombat,
      host = hostData,
      party = party,
      gold = gold,
      campSupplies = campSupplies,
      events = self.recentEvents,
      sessionStats = self.sessionStats,
    }

    return state
  end)
  if ok then return result end
  return nil
end

---------------------------------------------------------------------------
-- State change detection (with pcall safety for userdata)
---------------------------------------------------------------------------
function Tadpole:StateChanged(newState)
  local ok, newJson = pcall(Ext.Json.Stringify, newState)
  if not ok then return true end  -- stringify failed, assume changed
  if newJson ~= self.lastStateJson then
    self.lastStateJson = newJson
    return true
  end
  return false
end

---------------------------------------------------------------------------
-- Write state file
---------------------------------------------------------------------------
function Tadpole:WriteState(state)
  local ok, json = pcall(Ext.Json.Stringify, state)
  if not ok then return false end
  Ext.IO.SaveFile("TadpoleState.json", json)
  return true
end

---------------------------------------------------------------------------
-- Read commands from phone app
---------------------------------------------------------------------------
function Tadpole:ReadCommands()
  local content = Ext.IO.LoadFile("TadpoleCommands.json")
  if not content or content == "" then return nil end

  local success, parsed = pcall(Ext.Json.Parse, content)
  if not success or not parsed then return nil end

  -- Delete after parse
  Ext.IO.SaveFile("TadpoleCommands.json", "")

  if type(parsed) == "table" and parsed[1] ~= nil then
    return parsed
  end
  return { parsed }
end

---------------------------------------------------------------------------
-- Execute a command from the phone app
---------------------------------------------------------------------------
function Tadpole:ExecuteCommand(cmd)
  if not cmd or not cmd.action then return end
  local hostGuid = Osi.GetHostCharacter()
  if not hostGuid then return end

  if cmd.action == "heal" then
    pcall(Osi.CharacterHeal, hostGuid, cmd.amount or 100)
  elseif cmd.action == "full_restore" then
    pcall(Osi.Proc_CharacterFullRestore, hostGuid)
  elseif cmd.action == "set_hp" then
    local hp = tonumber(cmd.value) or 100
    pcall(Osi.SetHitpoints, hostGuid, hp, 0)
  elseif cmd.action == "add_gold" then
    pcall(Osi.AddGold, hostGuid, cmd.value or 0)
  elseif cmd.action == "short_rest" then
    pcall(Osi.ShortRest, hostGuid)
  elseif cmd.action == "long_rest" then
    pcall(Osi.RequestLongRest, hostGuid, 1)
  elseif cmd.action == "trigger_rest" then
    pcall(Osi.RequestLongRest, hostGuid, 1)
  elseif cmd.action == "resurrect" then
    pcall(Osi.Resurrect, hostGuid, "", 1)
  elseif cmd.action == "reset_cooldowns" then
    pcall(Osi.ResetCooldowns, hostGuid)
  elseif cmd.action == "god_mode" then
    local enabled = cmd.enabled or false
    -- Try SetInvulnerable first, fall back to status-based approach
    local ok = pcall(Osi.SetInvulnerable, hostGuid, enabled and 1 or 0)
    if not ok then
      if enabled then
        pcall(Osi.ApplyStatus, hostGuid, "INVULNERABLE", 0, 1, hostGuid)
      else
        pcall(Osi.RemoveStatus, hostGuid, "INVULNERABLE", hostGuid)
      end
    end
  elseif cmd.action == "give_item" then
    -- Spawn item directly into inventory
    -- Try as template UUID first, fall back to stat name → UUID resolution
    tryCall(function()
      local templateId = cmd.itemId
      -- If it looks like a stat name (no dashes, not a UUID), try to resolve it
      if templateId and not templateId:match("%x%x%x%x%x%x%x%x%-%x%x%x%x%-%x%x%x%x") then
        local stat = Ext.Stats.Get(templateId)
        if stat and stat.RootTemplate then
          templateId = stat.RootTemplate
        end
      end
      pcall(Osi.TemplateAddTo, templateId, hostGuid, cmd.count or 1, 1)
    end)
  elseif cmd.action == "spawn_item" then
    -- Spawn item on ground at player location
    tryCall(function()
      local templateId = cmd.itemId
      -- Resolve stat name to template UUID if needed
      if templateId and not templateId:match("%x%x%x%x%x%x%x%x%-%x%x%x%x%-%x%x%x%x") then
        local stat = Ext.Stats.Get(templateId)
        if stat and stat.RootTemplate then
          templateId = stat.RootTemplate
        end
      end
      local x, y, z = 0, 0, 0
      local entity = safeGetEntity(hostGuid)
      if entity then local pos = getPosition(entity); x, y, z = pos.x, pos.y, pos.z end
      pcall(Osi.CreateAt, templateId, x, y, z, 0, 1, "")
    end)
  elseif cmd.action == "teleport_to" then
    if cmd.targetGuid then
      pcall(Osi.TeleportTo, hostGuid, cmd.targetGuid, "")
    end
  elseif cmd.action == "heal_party" then
    tryCall(function()
      local members = getPartyMembers()
      for _, guid in ipairs(members) do
        pcall(Osi.Proc_CharacterFullRestore, guid)
      end
    end)
  elseif cmd.action == "revive" then
    tryCall(function()
      local members = getPartyMembers()
      for _, guid in ipairs(members) do
        if Osi.IsDead(guid) == 1 then
          pcall(Osi.Resurrect, guid, "", 1)
        end
      end
    end)
  elseif cmd.action == "add_xp" then
    pcall(Osi.AddExplorationExperience, hostGuid, cmd.value or 100)
  elseif cmd.action == "set_level" then
    local lvl = tonumber(cmd.value) or 1
    if lvl >= 1 and lvl <= 12 then
      pcall(Osi.SetLevel, hostGuid, lvl)
    end
  elseif cmd.action == "apply_status" then
    if cmd.statusId then
      local duration = tonumber(cmd.duration) or 0  -- 0 = infinite
      pcall(Osi.ApplyStatus, hostGuid, cmd.statusId, duration, 1, hostGuid)
    end
  elseif cmd.action == "remove_status" then
    if cmd.statusId then
      pcall(Osi.RemoveStatus, hostGuid, cmd.statusId, hostGuid)
    end
  elseif cmd.action == "kill_target" then
    if cmd.targetGuid then
      pcall(Osi.CombatKillFor, cmd.targetGuid)
    end
  elseif cmd.action == "deal_damage" then
    if cmd.targetGuid then
      pcall(Osi.ApplyDamage, cmd.targetGuid, cmd.value or 100, cmd.damageType or "Slashing", hostGuid)
    end
  elseif cmd.action == "toggle_combat" then
    local inCombat = false
    pcall(function() inCombat = Osi.IsInCombat(hostGuid) == 1 end)
    if inCombat then
      pcall(Osi.LeaveCombat, hostGuid)
    else
      -- Find a nearby hostile to enter combat with
      tryCall(function()
        local x, y, z = 0, 0, 0
        local entity = safeGetEntity(hostGuid)
        if entity then local pos = getPosition(entity); x, y, z = pos.x, pos.y, pos.z end
        -- Get characters near the host and find an enemy
        local nearby = Osi.GetCharactersAroundPosition(x, y, z, 30)
        if nearby then
          for _, charGuid in ipairs(nearby) do
            if Osi.IsEnemyOf(hostGuid, charGuid) == 1 then
              pcall(Osi.EnterCombat, hostGuid, charGuid)
              return
            end
          end
        end
        -- Fallback: just force combat mode
        pcall(Osi.SetInCombat, hostGuid, 1)
      end)
    end
  elseif cmd.action == "teleport_to_waypoint" then
    if cmd.waypoint then
      pcall(Osi.TeleportTo, hostGuid, cmd.waypoint, "")
    end
  end
end

---------------------------------------------------------------------------
-- Tick — runs every frame, captures state every 60 frames (~2 sec)
---------------------------------------------------------------------------
Ext.Events.Tick:Subscribe(function(e)
  Tadpole.elapsed = Tadpole.elapsed + 1
  if Tadpole.elapsed < 60 then return end
  Tadpole.elapsed = 0

  -- Crash-proof: wrap entire tick body in pcall
  local ok, err = pcall(function()
    local state = Tadpole:CaptureState()
    if state and Tadpole:StateChanged(state) then
      local written = Tadpole:WriteState(state)
      if written then
        Tadpole.recentEvents = {}
      end
    end

    local cmds = Tadpole:ReadCommands()
    if cmds then
      for _, cmd in ipairs(cmds) do
        Tadpole:ExecuteCommand(cmd)
      end
    end
  end)
  if not ok then
    suppressError("Tick error: " .. tostring(err))
  end
end)

---------------------------------------------------------------------------
-- Osiris event listeners
---------------------------------------------------------------------------
Ext.Osiris.RegisterListener("CombatStarted", 1, "after", function(combat)
  addEvent({ type = "combat_started", timestamp = getTime() })
end)

Ext.Osiris.RegisterListener("CombatEnded", 1, "after", function(combat)
  addEvent({ type = "combat_ended", timestamp = getTime() })
end)

Ext.Osiris.RegisterListener("LevelGameplayStarted", 2, "after", function(level, isEditor)
  addEvent({ type = "area_changed", area = level, timestamp = getTime() })
end)

Ext.Osiris.RegisterListener("LongRestFinished", 0, "after", function()
  addEvent({ type = "long_rest", timestamp = getTime() })
end)

-- Status events
Ext.Osiris.RegisterListener("StatusApplied", 4, "after", function(target, status, cause, storyAction)
  addEvent({ type = "status_applied", target = target, status = status, cause = cause, timestamp = getTime() })
end)

-- Combat character events
Ext.Osiris.RegisterListener("EnteredCombat", 2, "after", function(entity, combat)
  addEvent({ type = "entered_combat", entity = entity, timestamp = getTime() })
end)

Ext.Osiris.RegisterListener("LeftCombat", 2, "after", function(entity, combat)
  addEvent({ type = "left_combat", entity = entity, timestamp = getTime() })
end)

-- Level up
Ext.Osiris.RegisterListener("LevelUp", 1, "after", function(entity)
  addEvent({ type = "level_up", entity = entity, timestamp = getTime() })
end)

-- Gold changed
Ext.Osiris.RegisterListener("GoldChanged", 2, "after", function(entity, amount)
  addEvent({ type = "gold_changed", entity = entity, amount = amount, timestamp = getTime() })
end)

-- Character died
Ext.Osiris.RegisterListener("CharacterDied", 1, "after", function(entity)
  -- Increment kills when a non-party character dies while the party is in combat
  tryCall(function()
    if not isHostOrParty(entity) then
      local hostGuid = Osi.GetHostCharacter()
      if hostGuid and Osi.IsInCombat(hostGuid) == 1 then
        Tadpole.sessionStats.kills = Tadpole.sessionStats.kills + 1
      end
    end
  end)
  addEvent({ type = "character_died", entity = entity, timestamp = getTime() })
end)

-- Resurrected
Ext.Osiris.RegisterListener("Resurrected", 1, "after", function(entity)
  addEvent({ type = "resurrected", entity = entity, timestamp = getTime() })
end)

---------------------------------------------------------------------------
-- Ext.Events subscriptions (v0.20.0 — rich game event tracking)
---------------------------------------------------------------------------

-- SpellCast
tryCall(function()
  Ext.Events.SpellCast:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local spellId = ""
      tryCall(function() spellId = tostring(e.SpellId or e.Spell or "") end)
      Tadpole.sessionStats.spellsCast = Tadpole.sessionStats.spellsCast + 1
      addEvent({
        type = "spell_cast",
        entity = guid,
        spellId = spellId,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- DamageTaken
tryCall(function()
  Ext.Events.DamageTaken:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local amount = 0
      tryCall(function() amount = tonumber(e.Amount) or 0 end)
      local damageType = ""
      tryCall(function() damageType = tostring(e.DamageType or "") end)
      if isHostOrParty(guid) then
        Tadpole.sessionStats.damageTaken = Tadpole.sessionStats.damageTaken + amount
      end
      -- Also track damage dealt by party members (via Instigator/Source)
      local instigatorGuid = ""
      tryCall(function()
        if e.Instigator and e.Instigator.Uuid then
          instigatorGuid = e.Instigator.Uuid._EntityUuid or ""
        elseif e.Source and type(e.Source) == "table" and e.Source.Uuid then
          instigatorGuid = e.Source.Uuid._EntityUuid or ""
        end
      end)
      if instigatorGuid ~= "" and isHostOrParty(instigatorGuid) and instigatorGuid ~= guid then
        Tadpole.sessionStats.damageDealt = Tadpole.sessionStats.damageDealt + amount
      end
      addEvent({
        type = "damage_taken",
        entity = guid,
        amount = amount,
        damageType = damageType,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- SpellCastHit — track damageDealt and criticalHits for party members
tryCall(function()
  Ext.Events.SpellCastHit:Subscribe(function(e)
    tryCall(function()
      local casterGuid = ""
      tryCall(function()
        if e.Caster then
          casterGuid = e.Caster.Uuid._EntityUuid or ""
        elseif e.Entity then
          casterGuid = e.Entity.Uuid._EntityUuid or ""
        end
      end)
      if isHostOrParty(casterGuid) then
        -- Track damage dealt
        local damage = 0
        tryCall(function()
          if e.TotalDamageDone then
            damage = tonumber(e.TotalDamageDone) or 0
          elseif e.Damage then
            damage = tonumber(e.Damage) or 0
          elseif e.Amount then
            damage = tonumber(e.Amount) or 0
          end
        end)
        if damage > 0 then
          Tadpole.sessionStats.damageDealt = Tadpole.sessionStats.damageDealt + damage
        end
        -- Track critical hits
        local isCritical = false
        tryCall(function()
          if type(e.IsCritical) == "boolean" then
            isCritical = e.IsCritical
          elseif type(e.CriticalHit) == "boolean" then
            isCritical = e.CriticalHit
          elseif type(e.Critical) == "boolean" then
            isCritical = e.Critical
          end
        end)
        if isCritical then
          Tadpole.sessionStats.criticalHits = Tadpole.sessionStats.criticalHits + 1
        end
        local targetGuid = ""
        tryCall(function()
          if e.Target then
            targetGuid = e.Target.Uuid._EntityUuid or ""
          elseif e.TargetEntity then
            targetGuid = e.TargetEntity.Uuid._EntityUuid or ""
          end
        end)
        local spellId = ""
        tryCall(function() spellId = tostring(e.SpellId or e.Spell or "") end)
        addEvent({
          type = "spell_cast_hit",
          caster = casterGuid,
          target = targetGuid,
          spellId = spellId,
          damage = damage,
          critical = isCritical,
          timestamp = getTime(),
        })
      end
    end)
  end)
end)

-- HealingReceived
tryCall(function()
  Ext.Events.HealingReceived:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local amount = 0
      tryCall(function() amount = tonumber(e.Amount) or 0 end)
      if isHostOrParty(guid) then
        Tadpole.sessionStats.healingDone = Tadpole.sessionStats.healingDone + amount
      end
      addEvent({
        type = "healing_received",
        entity = guid,
        amount = amount,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- StatusApplied (Ext.Events version — richer than Osiris)
tryCall(function()
  Ext.Events.StatusApplied:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local statusId = ""
      tryCall(function() statusId = tostring(e.StatusId or "") end)
      local source = ""
      tryCall(function()
        if e.Source then source = tostring(e.Source) end
      end)
      addEvent({
        type = "status_applied_ext",
        entity = guid,
        statusId = statusId,
        source = source,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- StatusRemoved
tryCall(function()
  Ext.Events.StatusRemoved:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local statusId = ""
      tryCall(function() statusId = tostring(e.StatusId or "") end)
      local source = ""
      tryCall(function()
        if e.Source then source = tostring(e.Source) end
      end)
      addEvent({
        type = "status_removed",
        entity = guid,
        statusId = statusId,
        source = source,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- ConcentrationGain
tryCall(function()
  Ext.Events.ConcentrationGain:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local spellId = ""
      tryCall(function() spellId = tostring(e.SpellId or e.Spell or "") end)
      local spellName = resolveSpellName(spellId)
      addEvent({
        type = "concentration_gain",
        entity = guid,
        spellId = spellId,
        spellName = spellName or "",
        timestamp = getTime(),
      })
    end)
  end)
end)

-- ConcentrationLost
tryCall(function()
  Ext.Events.ConcentrationLost:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      addEvent({
        type = "concentration_lost",
        entity = guid,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- ExperienceGained
tryCall(function()
  Ext.Events.ExperienceGained:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local amount = 0
      tryCall(function() amount = tonumber(e.Amount or e.Experience or 0) end)
      addEvent({
        type = "experience_gained",
        entity = guid,
        amount = amount,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- LevelUp (Ext.Events version)
tryCall(function()
  Ext.Events.LevelUp:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      addEvent({
        type = "level_up_ext",
        entity = guid,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- PassiveAdded
tryCall(function()
  Ext.Events.PassiveAdded:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local passiveId = ""
      tryCall(function() passiveId = tostring(e.PassiveId or e.Passive or "") end)
      addEvent({
        type = "passive_added",
        entity = guid,
        passiveId = passiveId,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- PassiveRemoved
tryCall(function()
  Ext.Events.PassiveRemoved:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local passiveId = ""
      tryCall(function() passiveId = tostring(e.PassiveId or e.Passive or "") end)
      addEvent({
        type = "passive_removed",
        entity = guid,
        passiveId = passiveId,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- SavingThrowRolled
tryCall(function()
  Ext.Events.SavingThrowRolled:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local ability = ""
      tryCall(function() ability = tostring(e.Ability or e.AbilityId or e.Skill or "") end)
      local result = ""
      tryCall(function() result = tostring(e.Result or e.Succeeded or "") end)
      -- Try to interpret result as success/fail
      local success = false
      tryCall(function()
        if type(e.Result) == "boolean" then
          success = e.Result
        elseif type(e.Succeeded) == "boolean" then
          success = e.Succeeded
        elseif result == "1" or result:lower() == "success" or result:lower() == "true" then
          success = true
        end
      end)
      Tadpole.sessionStats.savingThrows = Tadpole.sessionStats.savingThrows + 1
      addEvent({
        type = "saving_throw",
        entity = guid,
        ability = ability,
        result = success and "success" or "fail",
        timestamp = getTime(),
      })
    end)
  end)
end)

-- TurnStarted
tryCall(function()
  Ext.Events.TurnStarted:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      if isHostOrParty(guid) then
        Tadpole.sessionStats.turnsTaken = Tadpole.sessionStats.turnsTaken + 1
      end
      addEvent({
        type = "turn_started",
        entity = guid,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- CombatRoundStarted
tryCall(function()
  Ext.Events.CombatRoundStarted:Subscribe(function(e)
    tryCall(function()
      local round = 0
      tryCall(function() round = tonumber(e.Round or e.RoundNumber or 0) end)
      addEvent({
        type = "combat_round_started",
        round = round,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- ItemAddedToInventory
tryCall(function()
  Ext.Events.ItemAddedToInventory:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local itemId = ""
      tryCall(function() itemId = tostring(e.Item or e.ItemId or e.Template or "") end)
      addEvent({
        type = "item_added",
        entity = guid,
        itemId = itemId,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- ItemRemovedFromInventory
tryCall(function()
  Ext.Events.ItemRemovedFromInventory:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local itemId = ""
      tryCall(function() itemId = tostring(e.Item or e.ItemId or e.Template or "") end)
      addEvent({
        type = "item_removed",
        entity = guid,
        itemId = itemId,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- TagAdded
tryCall(function()
  Ext.Events.TagAdded:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      local tag = ""
      tryCall(function() tag = tostring(e.Tag or "") end)
      addEvent({
        type = "tag_added",
        entity = guid,
        tag = tag,
        timestamp = getTime(),
      })
    end)
  end)
end)

-- ShapeshiftChanged
tryCall(function()
  Ext.Events.ShapeshiftChanged:Subscribe(function(e)
    tryCall(function()
      local guid = ""
      tryCall(function() guid = e.Entity.Uuid._EntityUuid or "" end)
      addEvent({
        type = "shapeshift_changed",
        entity = guid,
        timestamp = getTime(),
      })
    end)
  end)
end)

---------------------------------------------------------------------------
-- Initialization
---------------------------------------------------------------------------
Ext.Events.SessionLoaded:Subscribe(function()
  Tadpole.lastStateJson = ""
  Tadpole.recentEvents = {}
  _suppressedErrors = {}
  -- Reset session stats on new session
  Tadpole.sessionStats = {
    damageDealt = 0,
    damageTaken = 0,
    healingDone = 0,
    spellsCast = 0,
    kills = 0,
    criticalHits = 0,
    savingThrows = 0,
    turnsTaken = 0,
  }
  pcall(function() Ext.Utils.PrintWarning("[Tadpole] Companion v" .. Tadpole.version .. " loaded!") end)
end)
