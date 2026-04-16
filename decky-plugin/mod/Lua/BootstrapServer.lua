-- ============================================================
-- TadpoleNet BG3SE v30 BootstrapServer.lua v0.15.0
-- Comprehensive game state reader + command executor
-- Deployed via GustavX piggyback on Steam Deck
-- ============================================================

local TADPOLE_VERSION = "0.17.0"
local STATE_FILE = "TadpoleState.json"
local COMMANDS_FILE = "TadpoleCommands.json"
local EVENT_LOG_MAX = 50

-- ============================================================
-- Globals
-- ============================================================
local _tickCount = 0
local _eventLog = {}
local _lastHostGuid = nil
local _stateCache = nil
local _ready = false

-- ============================================================
-- Utility: safe call wrapper
-- ============================================================
local function tryCall(fn, ...)
    if type(fn) ~= "function" then return nil end
    local ok, result = pcall(fn, ...)
    if not ok then
        Ext.Utils.PrintWarning("[Tadpole] Error: " .. tostring(result))
        return nil
    end
    return result
end

local function tryCall1(fn, a1)
    if type(fn) ~= "function" then return nil end
    local ok, result = pcall(fn, a1)
    if not ok then
        Ext.Utils.PrintWarning("[Tadpole] Error: " .. tostring(result))
        return nil
    end
    return result
end

local function tryCall2(fn, a1, a2)
    if type(fn) ~= "function" then return nil end
    local ok, result = pcall(fn, a1, a2)
    if not ok then
        Ext.Utils.PrintWarning("[Tadpole] Error: " .. tostring(result))
        return nil
    end
    return result
end

local function tryCall3(fn, a1, a2, a3)
    if type(fn) ~= "function" then return nil end
    local ok, result = pcall(fn, a1, a2, a3)
    if not ok then
        Ext.Utils.PrintWarning("[Tadpole] Error: " .. tostring(result))
        return nil
    end
    return result
end

-- Safely index a table without throwing
local function safeGet(t, key)
    if type(t) ~= "table" then return nil end
    return t[key]
end

-- Safely index nested tables
local function safeGetPath(t, ...)
    local current = t
    for i = 1, select("#", ...) do
        if type(current) ~= "table" then return nil end
        current = current[select(i, ...)]
    end
    return current
end

-- Resolve a name that might be a TranslatedString or a plain string
local function resolveName(nameVal)
    if nameVal == nil then return "Unknown" end
    if type(nameVal) == "string" then return nameVal end
    if type(nameVal) == "userdata" then
        -- TranslatedString has a :Get() method
        local ok, result = pcall(function()
            if type(nameVal.Get) == "function" then
                return nameVal:Get()
            end
            return tostring(nameVal)
        end)
        if ok then return result or tostring(nameVal) end
    end
    return tostring(nameVal)
end

-- Push an event to the log
local function pushEvent(eventType, data)
    local evt = {
        type = eventType,
        timestamp = _tickCount
    }
    if type(data) == "table" then
        for k, v in pairs(data) do
            evt[k] = v
        end
    end
    table.insert(_eventLog, evt)
    if #_eventLog > EVENT_LOG_MAX then
        table.remove(_eventLog, 1)
    end
end

-- ============================================================
-- Host detection
-- ============================================================
local function getHostGuid()
    -- Primary: Osi.GetHostCharacter (works in Tick)
    local guid = tryCall(function()
        return Osi.GetHostCharacter()
    end)
    if guid and type(guid) == "string" and guid ~= "" then
        _lastHostGuid = guid
        return guid
    end

    -- Fallback: cached host
    if _lastHostGuid then
        return _lastHostGuid
    end

    return nil
end

-- ============================================================
-- Area / Level detection
-- ============================================================
local function getCurrentArea()
    local hostGuid = getHostGuid()
    if not hostGuid then return "Unknown" end

    -- Try Osi.GetCurrentLevel
    local level = tryCall(function()
        return Osi.GetCurrentLevel(hostGuid)
    end)
    if level and type(level) == "string" and level ~= "" then
        return level
    end

    -- Try entity ServerCharacter
    local entity = tryCall(function()
        return Ext.Entity.Get(hostGuid)
    end)
    if entity then
        local char = tryCall(function()
            return entity.ServerCharacter
        end)
        if char then
            local template = tryCall(function()
                return char.Template
            end)
            if template then
                local currentLvl = tryCall(function()
                    return template.CurrentLevel
                end)
                if currentLvl and currentLvl ~= "" then return currentLvl end
            end
        end
    end

    return "Unknown"
end

-- ============================================================
-- Combat state
-- ============================================================
local function getInCombat()
    local hostGuid = getHostGuid()
    if not hostGuid then return false end

    local inCombat = tryCall(function()
        return Osi.IsInCombat(hostGuid) == 1
    end)
    if inCombat ~= nil then return inCombat end

    -- Fallback: entity check
    local entity = tryCall(function()
        return Ext.Entity.Get(hostGuid)
    end)
    if entity then
        local combatGroup = tryCall(function()
            return entity.CombatGroup
        end)
        if combatGroup ~= nil then
            return combatGroup ~= "" and combatGroup ~= nil
        end
    end

    return false
end

-- ============================================================
-- Dialog state
-- ============================================================
local function getInDialog()
    local hostGuid = getHostGuid()
    if not hostGuid then return false end

    -- Try Osi.IsInDialogWith
    local inDialog = tryCall(function()
        -- Check if anyone is in dialog with host
        return Osi.IsInDialogWith(hostGuid, hostGuid) == 1
    end)
    if inDialog ~= nil then return inDialog end

    -- Try entity check
    local entity = tryCall(function()
        return Ext.Entity.Get(hostGuid)
    end)
    if entity then
        local dialog = tryCall(function()
            return entity.Dialog
        end)
        if dialog ~= nil then
            return true
        end
    end

    return false
end

-- ============================================================
-- Position
-- ============================================================
local function getPosition(guid)
    if not guid then return { x = 0, y = 0, z = 0 } end

    -- Try Osi.GetTransform
    local x, y, z = tryCall(function()
        return Osi.GetTransform(guid)
    end)
    if x and y and z then
        return { x = tonumber(x) or 0, y = tonumber(y) or 0, z = tonumber(z) or 0 }
    end

    -- Fallback: entity transform
    local entity = tryCall(function()
        return Ext.Entity.Get(guid)
    end)
    if entity then
        local transform = tryCall(function()
            return entity.Transform
        end)
        if transform then
            local pos = tryCall(function()
                return transform.Transform
            end)
            if pos then
                local tx = tryCall(function() return pos["x"] or pos[1] end)
                local ty = tryCall(function() return pos["y"] or pos[2] end)
                local tz = tryCall(function() return pos["z"] or pos[3] end)
                if tx then
                    return { x = tonumber(tx) or 0, y = tonumber(ty) or 0, z = tonumber(tz) or 0 }
                end
            end
        end
    end

    return { x = 0, y = 0, z = 0 }
end

-- ============================================================
-- Entity name
-- ============================================================
local function getEntityName(guid)
    if not guid then return "Unknown" end

    local entity = tryCall(function()
        return Ext.Entity.Get(guid)
    end)
    if entity then
        -- Try DisplayName
        local dn = tryCall(function()
            return entity.DisplayName
        end)
        if dn then
            local name = tryCall(function()
                return dn.Name
            end)
            if name then
                return resolveName(name)
            end
        end

        -- Try ServerCharacter.Template.Name
        local sc = tryCall(function()
            return entity.ServerCharacter
        end)
        if sc then
            local tmpl = tryCall(function()
                return sc.Template
            end)
            if tmpl then
                local n = tryCall(function()
                    return tmpl.Name
                end)
                if n and type(n) == "string" and n ~= "" then
                    return n
                end
            end
        end
    end

    -- Fallback: Osi version
    local osiName = tryCall(function()
        return Osi.GetName(guid)
    end)
    if osiName and type(osiName) == "string" and osiName ~= "" then
        return osiName
    end

    return "Unknown"
end

-- ============================================================
-- HP reading
-- ============================================================
local function getHP(guid)
    if not guid then return { hp = 0, maxHp = 0, tempHp = 0 } end

    local hp = 0
    local maxHp = 0
    local tempHp = 0

    -- Try Osi getters first
    hp = tryCall(function() return Osi.GetHp(guid) end) or 0
    maxHp = tryCall(function() return Osi.GetMaxHp(guid) end) or 0
    tempHp = tryCall(function() return Osi.GetTempHp(guid) end) or 0

    -- If Osi failed, try entity
    if hp == 0 and maxHp == 0 then
        local entity = tryCall(function() return Ext.Entity.Get(guid) end)
        if entity then
            local health = tryCall(function() return entity.Health end)
            if health then
                hp = tryCall(function() return health.Hp end) or hp
                maxHp = tryCall(function() return health.MaxHp end) or maxHp
                tempHp = tryCall(function() return health.TemporaryHp end) or tempHp
            end
        end
    end

    return {
        hp = tonumber(hp) or 0,
        maxHp = tonumber(maxHp) or 0,
        tempHp = tonumber(tempHp) or 0
    }
end

-- ============================================================
-- Level
-- ============================================================
local function getLevel(guid)
    if not guid then return 0 end

    local level = tryCall(function()
        return Osi.GetLevel(guid)
    end)
    if level then return tonumber(level) or 0 end

    -- Entity fallback
    local entity = tryCall(function() return Ext.Entity.Get(guid) end)
    if entity then
        local stats = tryCall(function() return entity.Stats end)
        if stats then
            local lvl = tryCall(function() return stats.Level end) or tryCall(function() return stats.LevelModifier end)
            if lvl then return tonumber(lvl) or 0 end
        end
    end

    return 0
end

-- ============================================================
-- Armor Class
-- ============================================================
local function getArmorClass(guid)
    if not guid then return 0 end

    local ac = tryCall(function()
        return Osi.GetArmorClass(guid)
    end)
    if ac then return tonumber(ac) or 0 end

    -- Entity fallback
    local entity = tryCall(function() return Ext.Entity.Get(guid) end)
    if entity then
        local stats = tryCall(function() return entity.Stats end)
        if stats then
            local armor = tryCall(function() return stats.Armor end) or tryCall(function() return stats.AC end)
            if armor then return tonumber(armor) or 0 end
        end
    end

    return 10
end

-- ============================================================
-- Is Dead
-- ============================================================
local function getIsDead(guid)
    if not guid then return false end

    local dead = tryCall(function()
        return Osi.IsDead(guid) == 1
    end)
    if dead ~= nil then return dead end

    local entity = tryCall(function() return Ext.Entity.Get(guid) end)
    if entity then
        local hp = tryCall(function() return entity.Health end)
        if hp then
            local hpVal = tryCall(function() return hp.Hp end)
            if hpVal ~= nil then return hpVal <= 0 end
        end
    end

    return false
end

-- ============================================================
-- Is Sneaking
-- ============================================================
local function getIsSneaking(guid)
    if not guid then return false end

    local sneaking = tryCall(function()
        return Osi.IsSneaking(guid) == 1
    end)
    if sneaking ~= nil then return sneaking end

    return false
end

-- ============================================================
-- Is Invulnerable
-- ============================================================
local function getIsInvulnerable(guid)
    if not guid then return false end

    local entity = tryCall(function() return Ext.Entity.Get(guid) end)
    if entity then
        local invuln = tryCall(function()
            return entity.Invulnerable
        end)
        if invuln ~= nil then
            local enabled = tryCall(function()
                return invuln.Invulnerable
            end)
            if enabled ~= nil then return enabled end
        end
    end

    -- Check via status
    local hasStatus = tryCall(function()
        return Osi.HasStatus(guid, "INVULNERABLE")
    end)
    if hasStatus and hasStatus ~= 0 then return true end

    return false
end

-- ============================================================
-- Gold
-- ============================================================
local function getGold()
    local hostGuid = getHostGuid()
    if not hostGuid then return 0 end

    local gold = tryCall(function()
        return Osi.GetGold(hostGuid)
    end)
    if gold then return tonumber(gold) or 0 end

    return 0
end

-- ============================================================
-- Experience
-- ============================================================
local function getExperience()
    local hostGuid = getHostGuid()
    if not hostGuid then return 0 end

    local xp = tryCall(function()
        return Osi.GetExperience(hostGuid)
    end)
    if xp then return tonumber(xp) or 0 end

    return 0
end

-- ============================================================
-- Proficiency Bonus
-- ============================================================
local function getProficiencyBonus(guid)
    if not guid then return 0 end

    local entity = tryCall(function() return Ext.Entity.Get(guid) end)
    if entity then
        local stats = tryCall(function() return entity.Stats end)
        if stats then
            local pb = tryCall(function() return stats.ProficiencyBonus end)
            if pb then return tonumber(pb) or 0 end

            -- Try dynamic stats
            local dynStats = tryCall(function() return stats.DynamicStats end)
            if dynStats then
                -- Could be array-like or object
                if type(dynStats) == "table" then
                    for _, ds in pairs(dynStats) do
                        if type(ds) == "table" then
                            local p = tryCall(function() return ds.ProficiencyBonus end)
                            if p then return tonumber(p) or 0 end
                        end
                    end
                end
            end
        end
    end

    -- Calculate from level
    local level = getLevel(guid)
    if level > 0 then
        return math.floor((level - 1) / 4) + 2
    end

    return 2
end

-- ============================================================
-- Ability Scores
-- ============================================================
local function getAbilityScores(guid)
    local scores = { str = 10, dex = 10, con = 10, int = 10, wis = 10, cha = 10 }

    if not guid then return scores end

    local entity = tryCall(function() return Ext.Entity.Get(guid) end)
    if not entity then return scores end

    local stats = tryCall(function() return entity.Stats end)
    if not stats then return scores end

    -- Try direct properties
    local function tryStat(key, statName)
        local val = tryCall(function() return stats[statName] end)
        if val == nil then
            -- Try DynamicStats
            local dynStats = tryCall(function() return stats.DynamicStats end)
            if dynStats and type(dynStats) == "table" then
                for _, ds in pairs(dynStats) do
                    if type(ds) == "table" then
                        val = tryCall(function() return ds[statName] end)
                        if val then break end
                    end
                end
            end
        end
        if val then scores[key] = tonumber(val) or scores[key] end
    end

    tryStat("str", "Strength")
    tryStat("dex", "Dexterity")
    tryStat("con", "Constitution")
    tryStat("int", "Intelligence")
    tryStat("wis", "Wisdom")
    tryStat("cha", "Charisma")

    -- Also try lowercase variants
    if scores.str == 10 then tryStat("str", "strength") end
    if scores.dex == 10 then tryStat("dex", "dexterity") end
    if scores.con == 10 then tryStat("con", "constitution") end
    if scores.int == 10 then tryStat("int", "intelligence") end
    if scores.wis == 10 then tryStat("wis", "wisdom") end
    if scores.cha == 10 then tryStat("cha", "charisma") end

    return scores
end

-- ============================================================
-- Action Resources (Spell Slots + all class resources)
-- ============================================================

-- Known resource ID patterns and their display names
local RESOURCE_NAMES = {
    -- Spell slots
    SpellSlot = "Spell Slot",
    -- Class resources
    BardicInspiration = "Bardic Inspiration",
    SorceryPoint = "Sorcery Point",
    KiPoint = "Ki Point",
    MartialArtsDie = "Martial Arts",
    Rage = "Rage",
    LayOnHands = "Lay on Hands",
    WildShape = "Wild Shape",
    SneakAttack = "Sneak Attack",
    ChannelOath = "Channel Oath",
    ChannelDivinity = "Channel Divinity",
    SuperiorityDie = "Superiority Die",
    HellishRapture = "Hellish Rapture",
    FrenziedStrike = "Frenzied Strike",
    BloodCurse = "Blood Curse",
    AbiDalzarHorror = "Horror",
    ArcaneRecovery = "Arcane Recovery",
    NaturalRecovery = "Natural Recovery",
    ActionSurge = "Action Surge",
    SecondWind = "Second Wind",
    Indomitable = "Indomitable",
    UnarmoredMovement = "Unarmored Movement",
    SongOfRest = "Song of Rest",
    HealingLight = "Healing Light",
    FavorOfTheGods = "Favor of the Gods",
    TidesOfChaos = "Tides of Chaos",
    Metamagic = "Metamagic",
    Conjuration = "Conjuration",
    Divination = "Divination",
    Enchantment = "Enchantment",
    Evocation = "Evocation",
    Illusion = "Illusion",
    Necromancy = "Necromancy",
    Transmutation = "Transmutation",
    Abjuration = "Abjuration",
    WarMagic = "War Magic",
    PactSlot = "Pact Slot",
    Smite = "Smite",
    DivineSmite = "Divine Smite",
    HuntersMark = "Hunter's Mark",
}

local function getResourceDisplayName(key)
    if not key or type(key) ~= "string" then return "Unknown" end
    -- Check exact match first
    if RESOURCE_NAMES[key] then return RESOURCE_NAMES[key] end
    -- Check if key contains a known pattern
    for pattern, name in pairs(RESOURCE_NAMES) do
        if key:find(pattern) then return name end
    end
    -- Return cleaned-up key as fallback
    return key:gsub("([A-Z])", " %1"):gsub("^%s", ""):gsub("^%s*(.-)%s*$", "%1")
end

local function getActionResources(guid)
    if not guid then return { spellSlots = {}, resources = {} } end

    local entity = tryCall(function() return Ext.Entity.Get(guid) end)
    if not entity then return { spellSlots = {}, resources = {} } end

    local spellSlots = {}
    local resources = {}
    local foundAny = false

    -- Try ActionResources component
    local actionResComp = tryCall(function() return entity.ActionResources end)
    if actionResComp then
        local resTable = tryCall(function() return actionResComp.Resources end)
        if resTable and type(resTable) == "table" then
            for k, v in pairs(resTable) do
                if type(k) == "string" then
                    foundAny = true
                    local entry = nil

                    if type(v) == "table" then
                        local current = tryCall(function() return v.CurrentAmount end)
                            or tryCall(function() return v[1] end)
                        local maxAmt = tryCall(function() return v.MaxAmount end)
                            or tryCall(function() return v[2] end)
                        if current ~= nil or maxAmt ~= nil then
                            entry = {
                                current = tonumber(current) or 0,
                                max = tonumber(maxAmt) or 0
                            }
                        end
                    elseif type(v) == "number" then
                        entry = { current = v, max = v }
                    end

                    if entry then
                        -- Classify: spell slots vs other resources
                        if k:find("SpellSlot") or k:find("PactSlot") then
                            spellSlots[k] = entry
                        else
                            entry.id = k
                            entry.name = getResourceDisplayName(k)
                            table.insert(resources, entry)
                        end
                    end
                end
            end
        end

        -- Also try ActionResources.Tables (alternative structure in some BG3SE versions)
        if not foundAny then
            local resTables = tryCall(function() return actionResComp.Tables end)
            if resTables and type(resTables) == "table" then
                for k, v in pairs(resTables) do
                    if type(k) == "string" and type(v) == "table" then
                        foundAny = true
                        local current = tryCall(function() return v.CurrentAmount end)
                            or tryCall(function() return v.Amount end)
                        local maxAmt = tryCall(function() return v.MaxAmount end)
                            or tryCall(function() return v.Max end)
                        if current ~= nil or maxAmt ~= nil then
                            local entry = {
                                current = tonumber(current) or 0,
                                max = tonumber(maxAmt) or 0
                            }
                            if k:find("SpellSlot") or k:find("PactSlot") then
                                spellSlots[k] = entry
                            else
                                entry.id = k
                                entry.name = getResourceDisplayName(k)
                                table.insert(resources, entry)
                            end
                        end
                    end
                end
            end
        end
    end

    -- Sort resources by name for consistent output
    table.sort(resources, function(a, b) return (a.name or "") < (b.name or "") end)

    if not foundAny then
        return { spellSlots = {}, resources = {} }
    end

    return {
        spellSlots = spellSlots,
        resources = resources
    }
end

-- ============================================================
-- Conditions / Status Effects
-- ============================================================
local function getConditions(guid)
    if not guid then return {} end

    local conditions = {}

    -- Try Osi.GetStatusIds
    local statusIds = tryCall(function()
        return Osi.GetStatusIds(guid)
    end)
    if statusIds then
        if type(statusIds) == "table" then
            for _, s in pairs(statusIds) do
                if type(s) == "string" and s ~= "" then
                    table.insert(conditions, s)
                end
            end
        elseif type(statusIds) == "string" then
            -- Might be comma-separated
            for s in statusIds:gmatch("[^,]+") do
                s = s:match("^%s*(.-)%s*$")
                if s ~= "" then
                    table.insert(conditions, s)
                end
            end
        end
        if #conditions > 0 then return conditions end
    end

    -- Fallback: entity approach
    local entity = tryCall(function() return Ext.Entity.Get(guid) end)
    if entity then
        local statusContainer = tryCall(function() return entity.StatusContainer end)
        if statusContainer then
            local statuses = tryCall(function() return statusContainer.Statuses end)
            if statuses and type(statuses) == "table" then
                for k, v in pairs(statuses) do
                    if type(k) == "string" then
                        table.insert(conditions, k)
                    elseif type(v) == "string" then
                        table.insert(conditions, v)
                    end
                end
            end
        end
    end

    return conditions
end

-- ============================================================
-- Death Saves
-- ============================================================
local function getDeathSaves(guid)
    if not guid then return nil end

    local entity = tryCall(function() return Ext.Entity.Get(guid) end)
    if not entity then return nil end

    local deathState = tryCall(function() return entity.DeathState end)
    if not deathState then
        -- Only return death saves if actually dying
        local isDead = getIsDead(guid)
        if isDead then
            return { successes = 0, failures = 0, isDead = true }
        end
        return nil
    end

    local successes = tryCall(function() return deathState.SuccessCount end)
        or tryCall(function() return deathState.DeathSaveSuccessCount end) or 0
    local failures = tryCall(function() return deathState.FailureCount end)
        or tryCall(function() return deathState.DeathSaveFailureCount end) or 0
    local isDead = tryCall(function() return deathState.IsDead end) or false

    -- Only report if the character has death saves active
    if successes == 0 and failures == 0 and not isDead then
        -- Check if actually in dying state
        local dyingStatus = tryCall(function()
            return Osi.HasStatus(guid, "DYING")
        end)
        if not dyingStatus or dyingStatus == 0 then
            return nil
        end
    end

    return {
        successes = tonumber(successes) or 0,
        failures = tonumber(failures) or 0,
        isDead = isDead
    }
end

-- ============================================================
-- Concentration
-- ============================================================
local function getConcentration(guid)
    if not guid then return nil end

    -- Check if has CONCENTRATING status
    local entity = tryCall(function() return Ext.Entity.Get(guid) end)
    if not entity then return nil end

    -- Try to find concentration through status
    local hasConc = tryCall(function()
        return Osi.HasStatus(guid, "CONCENTRATING")
    end)
    if hasConc and hasConc ~= 0 then
        -- Try to get the concentrated spell
        local statusContainer = tryCall(function() return entity.StatusContainer end)
        if statusContainer then
            local statuses = tryCall(function() return statusContainer.Statuses end)
            if statuses and type(statuses) == "table" then
                for k, v in pairs(statuses) do
                    local statusName = type(k) == "string" and k or (type(v) == "string" and v or nil)
                    if statusName and statusName:find("CONCENTRATING") then
                        return { spellId = statusName, caster = guid }
                    end
                end
            end
        end

        -- Basic concentration info
        return { spellId = "CONCENTRATING", caster = guid }
    end

    return nil
end

-- ============================================================
-- Weather
-- ============================================================
local function getWeather()
    local weather = tryCall(function()
        return Osi.GetCurrentWeather()
    end)
    if weather and type(weather) == "string" then
        return weather
    end

    -- Fallback entity approach
    local hostGuid = getHostGuid()
    if hostGuid then
        local entity = tryCall(function() return Ext.Entity.Get(hostGuid) end)
        if entity then
            local climate = tryCall(function() return entity.Climate end)
            if climate then
                local w = tryCall(function() return climate.Weather end)
                if w and type(w) == "string" and w ~= "" then
                    return w
                end
            end
        end
    end

    return "Clear"
end

-- ============================================================
-- Camp Supplies
-- ============================================================
local function getCampSupplies()
    local count = tryCall(function()
        return Osi.GetCampSuppliesCount()
    end)

    if count ~= nil then
        local current = tonumber(count) or 0
        local maxSupplies = 80  -- Standard long rest cost
        return {
            current = current,
            max = maxSupplies,
            canRest = current >= maxSupplies
        }
    end

    -- Fallback: try to count inventory items
    local hostGuid = getHostGuid()
    if hostGuid then
        local itemCount = tryCall(function()
            return Osi.GetCampSuppliesCount(hostGuid)
        end)
        if itemCount ~= nil then
            local current = tonumber(itemCount) or 0
            return {
                current = current,
                max = 80,
                canRest = current >= 80
            }
        end
    end

    return nil
end

-- ============================================================
-- Party Members
-- ============================================================
local function getPartyMembers()
    local hostGuid = getHostGuid()
    local party = {}

    -- Strategy 1: Osi.DB_IsInPartyWith
    if hostGuid then
        local partyResults = tryCall(function()
            return Osi.DB_IsInPartyWith:Get(hostGuid, nil)
        end)
        if partyResults and type(partyResults) == "table" then
            for _, row in pairs(partyResults) do
                if type(row) == "table" then
                    for _, memberGuid in pairs(row) do
                        if type(memberGuid) == "string" and memberGuid ~= hostGuid then
                            table.insert(party, memberGuid)
                        end
                    end
                elseif type(row) == "string" and row ~= hostGuid then
                    table.insert(party, row)
                end
            end
        end

        -- Also get reverse direction
        local partyResults2 = tryCall(function()
            return Osi.DB_IsInPartyWith:Get(nil, hostGuid)
        end)
        if partyResults2 and type(partyResults2) == "table" then
            for _, row in pairs(partyResults2) do
                if type(row) == "table" then
                    for _, memberGuid in pairs(row) do
                        if type(memberGuid) == "string" and memberGuid ~= hostGuid then
                            -- Check not already in party
                            local found = false
                            for _, p in pairs(party) do
                                if p == memberGuid then found = true; break end
                            end
                            if not found then
                                table.insert(party, memberGuid)
                            end
                        end
                    end
                elseif type(row) == "string" and row ~= hostGuid then
                    local found = false
                    for _, p in pairs(party) do
                        if p == row then found = true; break end
                    end
                    if not found then
                        table.insert(party, row)
                    end
                end
            end
        end
    end

    -- Strategy 2: Osi.DB_Available
    if #party == 0 then
        local available = tryCall(function()
            return Osi.DB_Available:Get(nil)
        end)
        if available and type(available) == "table" then
            for _, row in pairs(available) do
                if type(row) == "table" then
                    for _, guid in pairs(row) do
                        if type(guid) == "string" and guid ~= hostGuid then
                            table.insert(party, guid)
                        end
                    end
                elseif type(row) == "string" and row ~= hostGuid then
                    table.insert(party, row)
                end
            end
        end
    end

    -- Strategy 3: Try Osi.GetPartyMembers
    if #party == 0 then
        local members = tryCall(function()
            return Osi.GetPartyMembers()
        end)
        if members and type(members) == "table" then
            for _, guid in pairs(members) do
                if type(guid) == "string" and guid ~= hostGuid then
                    table.insert(party, guid)
                end
            end
        elseif members and type(members) == "string" then
            if members ~= hostGuid then
                table.insert(party, members)
            end
        end
    end

    return party
end

-- ============================================================
-- Build character data
-- ============================================================
local function buildCharacterData(guid)
    if not guid then return nil end

    local hpData = getHP(guid)
    local pos = getPosition(guid)
    local actionRes = getActionResources(guid)

    return {
        guid = guid,
        name = getEntityName(guid),
        hp = hpData.hp,
        maxHp = hpData.maxHp,
        tempHp = hpData.tempHp,
        level = getLevel(guid),
        armorClass = getArmorClass(guid),
        position = pos,
        isInvulnerable = getIsInvulnerable(guid),
        isDead = getIsDead(guid),
        isSneaking = getIsSneaking(guid),
        spellSlots = next(actionRes.spellSlots) and actionRes.spellSlots or nil,
        actionResources = next(actionRes.resources) and actionRes.resources or nil
    }
end

-- ============================================================
-- Build full game state
-- ============================================================
local function buildGameState()
    local hostGuid = getHostGuid()

    local state = {
        version = TADPOLE_VERSION,
        timestamp = _tickCount,
        area = getCurrentArea(),
        inCombat = getInCombat(),
        host = nil,
        party = {},
        gold = getGold(),
        experience = getExperience(),
        events = _eventLog,
        deathSaves = nil,
        conditions = {},
        concentration = nil,
        proficiencyBonus = 0,
        abilityScores = { str = 10, dex = 10, con = 10, int = 10, wis = 10, cha = 10 },
        inDialog = getInDialog(),
        weather = getWeather(),
        campSupplies = nil
    }

    -- Host data
    if hostGuid then
        state.host = buildCharacterData(hostGuid)
        state.deathSaves = getDeathSaves(hostGuid)
        state.conditions = getConditions(hostGuid)
        state.concentration = getConcentration(hostGuid)
        state.proficiencyBonus = getProficiencyBonus(hostGuid)
        state.abilityScores = getAbilityScores(hostGuid)
    end

    -- Party data
    local partyMembers = getPartyMembers()
    for _, memberGuid in pairs(partyMembers) do
        local charData = buildCharacterData(memberGuid)
        if charData then
            table.insert(state.party, charData)
        end
    end

    -- Camp supplies
    state.campSupplies = getCampSupplies()

    return state
end

-- ============================================================
-- Command Handlers
-- ============================================================
local CommandHandlers = {}

CommandHandlers["add_gold"] = function(cmd)
    local value = tonumber(cmd.value) or 0
    local hostGuid = getHostGuid()
    if hostGuid and value ~= 0 then
        if value > 0 then
            tryCall(function() Osi.AddGold(hostGuid, value) end)
        else
            tryCall(function() Osi.RemoveGold(hostGuid, math.abs(value)) end)
        end
        pushEvent("add_gold", { value = value })
        Ext.Utils.PrintWarning("[Tadpole] add_gold: " .. tostring(value))
    end
end

CommandHandlers["give_item"] = function(cmd)
    local itemId = cmd.itemId
    local count = tonumber(cmd.count) or 1
    local hostGuid = getHostGuid()
    if hostGuid and itemId then
        tryCall(function() Osi.CreateAt(itemId, hostGuid, count, 0) end)
        pushEvent("give_item", { itemId = itemId, count = count })
        Ext.Utils.PrintWarning("[Tadpole] give_item: " .. itemId .. " x" .. tostring(count))
    end
end

CommandHandlers["trigger_rest"] = function(cmd)
    tryCall(function() Osi.ScheduleLongRest() end)
    pushEvent("trigger_rest", {})
    Ext.Utils.PrintWarning("[Tadpole] trigger_rest")
end

CommandHandlers["short_rest"] = function(cmd)
    local hostGuid = getHostGuid()
    if hostGuid then
        tryCall(function() Osi.RequestShortRest(hostGuid) end)
        pushEvent("short_rest", {})
        Ext.Utils.PrintWarning("[Tadpole] short_rest")
    end
end

CommandHandlers["heal_party"] = function(cmd)
    local amount = cmd.amount  -- nil means full heal
    local hostGuid = getHostGuid()
    if hostGuid then
        -- Heal host
        if amount then
            tryCall(function() Osi.SetHp(hostGuid, (getHP(hostGuid).hp + tonumber(amount))) end)
        else
            tryCall(function() Osi.SetHp(hostGuid, getHP(hostGuid).maxHp) end)
        end

        -- Heal party members
        local partyMembers = getPartyMembers()
        for _, memberGuid in pairs(partyMembers) do
            if amount then
                tryCall(function() Osi.SetHp(memberGuid, (getHP(memberGuid).hp + tonumber(amount))) end)
            else
                tryCall(function() Osi.SetHp(memberGuid, getHP(memberGuid).maxHp) end)
            end
        end

        pushEvent("heal_party", { amount = amount })
        Ext.Utils.PrintWarning("[Tadpole] heal_party: " .. tostring(amount or "full"))
    end
end

CommandHandlers["revive"] = function(cmd)
    local hostGuid = getHostGuid()
    if hostGuid then
        -- Try multiple revival approaches
        tryCall(function() Osi.Resurrect(hostGuid) end)
        tryCall(function() Osi.SetHp(hostGuid, getHP(hostGuid).maxHp) end)
        tryCall(function() Osi.RemoveStatus(hostGuid, "DYING") end)
        tryCall(function() Osi.RemoveStatus(hostGuid, "DEAD") end)

        -- Also revive party
        local partyMembers = getPartyMembers()
        for _, memberGuid in pairs(partyMembers) do
            tryCall(function() Osi.Resurrect(memberGuid) end)
            tryCall(function() Osi.SetHp(memberGuid, getHP(memberGuid).maxHp) end)
            tryCall(function() Osi.RemoveStatus(memberGuid, "DYING") end)
            tryCall(function() Osi.RemoveStatus(memberGuid, "DEAD") end)
        end

        pushEvent("revive", {})
        Ext.Utils.PrintWarning("[Tadpole] revive")
    end
end

CommandHandlers["god_mode"] = function(cmd)
    local enabled = cmd.enabled
    if enabled == nil then enabled = true end
    local hostGuid = getHostGuid()
    if hostGuid then
        if enabled then
            tryCall(function() Osi.SetInvulnerable(hostGuid, 1) end)
            tryCall(function() Osi.ApplyStatus(hostGuid, "INVULNERABLE", -1, 1) end)
        else
            tryCall(function() Osi.SetInvulnerable(hostGuid, 0) end)
            tryCall(function() Osi.RemoveStatus(hostGuid, "INVULNERABLE") end)
        end

        pushEvent("god_mode", { enabled = enabled })
        Ext.Utils.PrintWarning("[Tadpole] god_mode: " .. tostring(enabled))
    end
end

CommandHandlers["teleport_to"] = function(cmd)
    local hostGuid = getHostGuid()
    if hostGuid then
        local x = tonumber(cmd.x) or 0
        local y = tonumber(cmd.y) or 0
        local z = tonumber(cmd.z) or 0
        tryCall(function() Osi.TeleportToPosition(hostGuid, x, y, z, "TadpoleTeleport", 1, 1) end)
        pushEvent("teleport_to", { x = x, y = y, z = z })
        Ext.Utils.PrintWarning("[Tadpole] teleport_to: " .. x .. "," .. y .. "," .. z)
    end
end

CommandHandlers["set_level"] = function(cmd)
    local level = tonumber(cmd.level)
    local hostGuid = getHostGuid()
    if hostGuid and level and level > 0 then
        tryCall(function() Osi.SetLevel(hostGuid, level) end)
        pushEvent("set_level", { level = level })
        Ext.Utils.PrintWarning("[Tadpole] set_level: " .. tostring(level))
    end
end

CommandHandlers["add_experience"] = function(cmd)
    local amount = tonumber(cmd.amount) or 0
    local hostGuid = getHostGuid()
    if hostGuid and amount ~= 0 then
        tryCall(function() Osi.AddExperience(hostGuid, amount) end)
        pushEvent("add_experience", { amount = amount })
        Ext.Utils.PrintWarning("[Tadpole] add_experience: " .. tostring(amount))
    end
end

CommandHandlers["set_hp"] = function(cmd)
    local hp = tonumber(cmd.hp) or 0
    local hostGuid = getHostGuid()
    if hostGuid then
        tryCall(function() Osi.SetHp(hostGuid, hp) end)
        pushEvent("set_hp", { hp = hp })
        Ext.Utils.PrintWarning("[Tadpole] set_hp: " .. tostring(hp))
    end
end

CommandHandlers["reset_cooldowns"] = function(cmd)
    local hostGuid = getHostGuid()
    if hostGuid then
        -- Reset all cooldowns for host
        tryCall(function() Osi.ResetAllCooldowns(hostGuid) end)
        -- Also for party
        local partyMembers = getPartyMembers()
        for _, memberGuid in pairs(partyMembers) do
            tryCall(function() Osi.ResetAllCooldowns(memberGuid) end)
        end
        pushEvent("reset_cooldowns", {})
        Ext.Utils.PrintWarning("[Tadpole] reset_cooldowns")
    end
end

CommandHandlers["kill_target"] = function(cmd)
    local targetGuid = cmd.targetGuid
    if not targetGuid then
        -- Kill current selection or context target
        targetGuid = getHostGuid()  -- fallback to host context
    end
    if targetGuid then
        tryCall(function() Osi.Kill(targetGuid) end)
        pushEvent("kill_target", { targetGuid = targetGuid })
        Ext.Utils.PrintWarning("[Tadpole] kill_target: " .. tostring(targetGuid))
    end
end

CommandHandlers["toggle_combat"] = function(cmd)
    local hostGuid = getHostGuid()
    if hostGuid then
        local inCombat = getInCombat()
        if inCombat then
            tryCall(function() Osi.ExitCombat(hostGuid) end)
        else
            tryCall(function() Osi.EnterCombat(hostGuid) end)
        end
        pushEvent("toggle_combat", { wasInCombat = inCombat })
        Ext.Utils.PrintWarning("[Tadpole] toggle_combat: was " .. tostring(inCombat))
    end
end

CommandHandlers["set_invulnerable"] = function(cmd)
    local enabled = cmd.enabled
    if enabled == nil then enabled = true end
    local hostGuid = getHostGuid()
    if hostGuid then
        if enabled then
            tryCall(function() Osi.SetInvulnerable(hostGuid, 1) end)
        else
            tryCall(function() Osi.SetInvulnerable(hostGuid, 0) end)
        end
        pushEvent("set_invulnerable", { enabled = enabled })
        Ext.Utils.PrintWarning("[Tadpole] set_invulnerable: " .. tostring(enabled))
    end
end

CommandHandlers["set_ability_score"] = function(cmd)
    local ability = cmd.ability
    local value = tonumber(cmd.value)
    local hostGuid = getHostGuid()
    if hostGuid and ability and value then
        -- Map ability names to stat property names
        local abilityMap = {
            str = "Strength",
            strength = "Strength",
            dex = "Dexterity",
            dexterity = "Dexterity",
            con = "Constitution",
            constitution = "Constitution",
            int = "Intelligence",
            intelligence = "Intelligence",
            wis = "Wisdom",
            wisdom = "Wisdom",
            cha = "Charisma",
            charisma = "Charisma"
        }
        local statName = abilityMap[string.lower(ability)]
        if statName then
            tryCall(function()
                local entity = Ext.Entity.Get(hostGuid)
                if entity and entity.Stats then
                    -- Try setting through Osi first
                    Osi.SetStatString(hostGuid, statName, tostring(value))
                end
            end)
            -- Also try character stat manipulation
            tryCall(function()
                Osi.ChangeAbility(hostGuid, statName, value)
            end)
            pushEvent("set_ability_score", { ability = ability, value = value })
            Ext.Utils.PrintWarning("[Tadpole] set_ability_score: " .. ability .. " = " .. tostring(value))
        end
    end
end

CommandHandlers["spawn_enemy"] = function(cmd)
    local templateId = cmd.templateId
    local x = tonumber(cmd.x) or 0
    local y = tonumber(cmd.y) or 0
    local z = tonumber(cmd.z) or 0
    if templateId then
        tryCall(function()
            Osi.CreateAtObject(templateId, x, y, z, 0, 0)
        end)
        -- Alternative spawn approach
        tryCall(function()
            local hostGuid = getHostGuid()
            if hostGuid then
                Osi.CreateAt(templateId, hostGuid, 1, 0)
            end
        end)
        pushEvent("spawn_enemy", { templateId = templateId, x = x, y = y, z = z })
        Ext.Utils.PrintWarning("[Tadpole] spawn_enemy: " .. tostring(templateId))
    end
end

CommandHandlers["long_rest"] = function(cmd)
    local hostGuid = getHostGuid()
    if hostGuid then
        tryCall(function() Osi.RequestLongRest(hostGuid) end)
        -- Alternative
        tryCall(function() Osi.ScheduleLongRest() end)
        pushEvent("long_rest", {})
        Ext.Utils.PrintWarning("[Tadpole] long_rest")
    end
end

CommandHandlers["change_weather"] = function(cmd)
    local weather = cmd.weather
    if weather and type(weather) == "string" then
        tryCall(function() Osi.SetWeather(weather, 1) end)
        tryCall(function() Osi.ChangeWeather(weather) end)
        pushEvent("change_weather", { weather = weather })
        Ext.Utils.PrintWarning("[Tadpole] change_weather: " .. weather)
    end
end

CommandHandlers["full_restore"] = function(cmd)
    local hostGuid = getHostGuid()
    if hostGuid then
        -- Full HP restore
        local hpData = getHP(hostGuid)
        tryCall(function() Osi.SetHp(hostGuid, hpData.maxHp) end)
        tryCall(function() Osi.SetTempHp(hostGuid, 0) end)

        -- Remove negative statuses
        tryCall(function() Osi.RemoveStatus(hostGuid, "DYING") end)
        tryCall(function() Osi.RemoveStatus(hostGuid, "DEAD") end)
        tryCall(function() Osi.RemoveStatus(hostGuid, "POISONED") end)
        tryCall(function() Osi.RemoveStatus(hostGuid, "DISEASED") end)
        tryCall(function() Osi.RemoveStatus(hostGuid, "BLINDED") end)
        tryCall(function() Osi.RemoveStatus(hostGuid, "DEAFENED") end)
        tryCall(function() Osi.RemoveStatus(hostGuid, "PARALYZED") end)
        tryCall(function() Osi.RemoveStatus(hostGuid, "STUNNED") end)
        tryCall(function() Osi.RemoveStatus(hostGuid, "INCAPACITATED") end)

        -- Reset cooldowns
        tryCall(function() Osi.ResetAllCooldowns(hostGuid) end)

        -- Restore spell slots
        tryCall(function()
            local entity = Ext.Entity.Get(hostGuid)
            if entity and entity.ActionResources then
                local resources = entity.ActionResources.Resources
                if resources and type(resources) == "table" then
                    for k, v in pairs(resources) do
                        if type(k) == "string" and k:find("SpellSlot") then
                            if type(v) == "table" and v.MaxAmount then
                                v.CurrentAmount = v.MaxAmount
                            end
                        end
                    end
                end
            end
        end)

        -- Also restore party
        local partyMembers = getPartyMembers()
        for _, memberGuid in pairs(partyMembers) do
            local mHpData = getHP(memberGuid)
            tryCall(function() Osi.SetHp(memberGuid, mHpData.maxHp) end)
            tryCall(function() Osi.ResetAllCooldowns(memberGuid) end)
            tryCall(function() Osi.RemoveStatus(memberGuid, "DYING") end)
            tryCall(function() Osi.RemoveStatus(memberGuid, "DEAD") end)
        end

        pushEvent("full_restore", {})
        Ext.Utils.PrintWarning("[Tadpole] full_restore")
    end
end

-- ============================================================
-- Command Processing
-- ============================================================
local function processCommands()
    local raw = tryCall(function()
        return Ext.IO.LoadFile(COMMANDS_FILE)
    end)

    -- Clear commands file immediately to prevent re-processing
    tryCall(function()
        Ext.IO.SaveFile(COMMANDS_FILE, "")
    end)

    if not raw or type(raw) ~= "string" or raw == "" then
        return
    end

    local commands = tryCall(function()
        return Ext.Json.Parse(raw)
    end)

    if not commands then
        Ext.Utils.PrintWarning("[Tadpole] Failed to parse commands JSON")
        return
    end

    -- Handle array or single object
    if commands.type and type(commands.type) == "string" then
        -- Single command object
        commands = { commands }
    elseif type(commands) ~= "table" then
        Ext.Utils.PrintWarning("[Tadpole] Invalid commands format")
        return
    end

    for _, cmd in pairs(commands) do
        if type(cmd) == "table" and cmd.type and type(cmd.type) == "string" then
            local handler = CommandHandlers[cmd.type]
            if handler then
                tryCall(function() handler(cmd) end)
            else
                Ext.Utils.PrintWarning("[Tadpole] Unknown command: " .. tostring(cmd.type))
            end
        end
    end
end

-- ============================================================
-- Write state to file
-- ============================================================
local function writeState(state)
    local json = tryCall(function()
        return Ext.Json.Stringify(state)
    end)
    if json and type(json) == "string" then
        tryCall(function()
            Ext.IO.SaveFile(STATE_FILE, json)
        end)
    else
        Ext.Utils.PrintWarning("[Tadpole] Failed to stringify state")
    end
end

-- ============================================================
-- Tick Handler - Main Loop
-- ============================================================
Ext.Osiris.RegisterListener("Tick", 1, "before", function()
    _tickCount = _tickCount + 1

    if not _ready then
        return
    end

    -- Process incoming commands every tick for responsiveness
    processCommands()

    -- Write state every 10 ticks (~10 seconds at 1 tick/sec) to reduce I/O
    if _tickCount % 10 == 0 then
        local state = buildGameState()
        writeState(state)
        _stateCache = state
    end
end)

-- ============================================================
-- SessionLoaded Handler
-- ============================================================
Ext.Events.SessionLoaded:Subscribe(function()
    Ext.Utils.PrintWarning("[Tadpole] SessionLoaded - initializing v" .. TADPOLE_VERSION)
    _ready = true
    _tickCount = 0
    _eventLog = {}

    -- Build and write initial state
    local state = buildGameState()
    writeState(state)
    _stateCache = state

    pushEvent("session_loaded", { version = TADPOLE_VERSION })
    Ext.Utils.PrintWarning("[Tadpole] Initialization complete - state written to " .. STATE_FILE)
end)

-- ============================================================
-- Game Event Listeners
-- ============================================================

-- Combat enter/exit
Ext.Osiris.RegisterListener("EnteredCombat", 1, "after", function(guid)
    pushEvent("entered_combat", { guid = guid })
end)

Ext.Osiris.RegisterListener("LeftCombat", 1, "after", function(guid)
    pushEvent("left_combat", { guid = guid })
end)

-- Character died
Ext.Osiris.RegisterListener("CharacterDied", 1, "after", function(guid)
    pushEvent("character_died", { guid = guid })
end)

-- Character revived / resurrected
Ext.Osiris.RegisterListener("Resurrected", 1, "after", function(guid)
    pushEvent("character_resurrected", { guid = guid })
end)

-- Level up
Ext.Osiris.RegisterListener("LevelUp", 1, "after", function(guid)
    pushEvent("level_up", { guid = guid })
end)

-- Long rest completed
Ext.Osiris.RegisterListener("LongRestFinished", 0, "after", function()
    pushEvent("long_rest_finished", {})
end)

-- Short rest completed
Ext.Osiris.RegisterListener("ShortRestFinished", 0, "after", function()
    pushEvent("short_rest_finished", {})
end)

-- Status applied
Ext.Osiris.RegisterListener("StatusApplied", 4, "after", function(target, statusId, source, duration)
    pushEvent("status_applied", {
        target = target,
        statusId = statusId,
        source = source,
        duration = tonumber(duration) or 0
    })
end)

-- Dialog started
Ext.Osiris.RegisterListener("DialogStarted", 2, "after", function(dialog, instance)
    pushEvent("dialog_started", { dialog = dialog, instance = instance })
end)

-- Dialog ended
Ext.Osiris.RegisterListener("DialogEnded", 1, "after", function(instance)
    pushEvent("dialog_ended", { instance = instance })
end)

-- Item added to inventory
Ext.Osiris.RegisterListener("InventoryChanged", 2, "after", function(guid, item)
    pushEvent("inventory_changed", { guid = guid, item = item })
end)

-- Gold changed
Ext.Osiris.RegisterListener("GoldChanged", 2, "after", function(guid, amount)
    pushEvent("gold_changed", { guid = guid, amount = tonumber(amount) or 0 })
end)

-- Attacked
Ext.Osiris.RegisterListener("Attacked", 4, "after", function(target, source, damageType, damage)
    pushEvent("attacked", {
        target = target,
        source = source,
        damageType = damageType,
        damage = tonumber(damage) or 0
    })
end)

-- PropertyChanged for level/area changes
Ext.Osiris.RegisterListener("LevelGameplayStarted", 2, "after", function(level, isEditorMode)
    pushEvent("level_gameplay_started", { level = level })
    -- Force immediate state write on level load
    if _ready then
        local state = buildGameState()
        writeState(state)
    end
end)

-- ============================================================
-- Startup Log
-- ============================================================
Ext.Utils.PrintWarning("[Tadpole] BootstrapServer.lua v" .. TADPOLE_VERSION .. " loaded")
Ext.Utils.PrintWarning("[Tadpole] Awaiting session...")
