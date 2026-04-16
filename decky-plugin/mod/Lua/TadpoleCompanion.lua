-- TadpoleCompanion.lua
-- BG3 ScriptExtender mod for Tadpole companion app
-- BG3SE v30 format: Install entire TadpoleCompanion/ folder to BG3/Mods/
-- Then enable "TadpoleCompanion" in BG3's Mods menu

local Tadpole = {
  lastStateJson = "",
  updateInterval = 2.0,
  elapsed = 0,
  recentEvents = {},
  prevState = nil,
}

local MAX_EVENTS = 50
-- Cross-platform temp directory
-- Under Wine/Proton, TEMP points to the Windows prefix, not Linux /tmp.
-- We need to write to the REAL Linux /tmp so the bridge (Node.js) can read it.
-- BG3SE's io.open uses Wine's Z: drive mapping, so "Z:\\tmp" = "/tmp" on Linux.
-- On native Windows (non-Wine), TEMP is correct already.
local function getUnixTempDir()
  -- Check if running under Wine/Proton (BG3SE exposes this)
  local isWine = false
  pcall(function()
    -- Wine sets WINELOADERNOEXEC or we can check for Z: drive
    local f = io.open("Z:\\tmp", "r")  -- Z: maps to / on Linux
    if f then f:close(); isWine = true end
  end)

  if isWine then
    return "/tmp"  -- io.open maps this via Z: drive
  end
  -- Native Windows or native Linux
  return os.getenv("TMPDIR") or os.getenv("TEMP") or "/tmp"
end

local TEMP_DIR = getUnixTempDir()
local OUTPUT_PATH = TEMP_DIR .. "/tadpole_state.json"
local COMMAND_PATH = TEMP_DIR .. "/tadpole_commands.json"

-- Utility: safely get entity data
local function safeGetEntity(guid)
  local success, entity = pcall(Ext.Entity.Get, guid)
  if not success or not entity then return nil end
  return entity
end

-- Get party member data using Entity system
local function getPartyMemberData(guid)
  local entity = safeGetEntity(guid)
  if not entity then return nil end

  local name = "Unknown"
  pcall(function()
    if entity.DisplayName and entity.DisplayName.Name then
      name = entity.DisplayName.Name.Key or "Unknown"
    end
  end)

  local hp, maxHp, tempHp = 0, 1, 0
  pcall(function()
    if entity.Health then
      hp = entity.Health.Hp or 0
      maxHp = entity.Health.MaxHp or 1
      tempHp = entity.Health.TemporaryHp or 0
    end
  end)

  local level = 1
  pcall(function()
    if entity.Stats then
      level = entity.Stats.Level or 1
    end
  end)

  local initiative = 0
  pcall(function()
    if entity.Stats then
      initiative = entity.Stats.InitiativeBonus or 0
    end
  end)

  -- Spell slots (action resources)
  local spellSlots = {}
  pcall(function()
    if entity.ActionResources and entity.ActionResources.Resources then
      for _, resource in ipairs(entity.ActionResources.Resources) do
        if resource.Name and resource.Name:find("SpellSlot") then
          spellSlots[resource.Name] = {
            amount = resource.Amount or 0,
            maxAmount = resource.MaxAmount or 0,
          }
        end
      end
    end
  end)

  -- Active conditions (statuses)
  local conditions = {}
  pcall(function()
    if entity.StatusContainer and entity.StatusContainer.Statuses then
      for _, status in ipairs(entity.StatusContainer.Statuses) do
        if status.StatusId then
          table.insert(conditions, status.StatusId)
        end
      end
    end
  end)

  -- Concentration (if concentrating)
  local concentration = nil
  pcall(function()
    if entity.Concentration and entity.Concentration.SpellId then
      concentration = {
        spellId = entity.Concentration.SpellId,
        caster = entity.Concentration.Caster,
      }
    end
  end)

  local x, y, z = 0, 0, 0
  pcall(function()
    x, y, z = Osi.GetTransform(guid)
  end)

  return {
    guid = guid,
    name = name,
    hp = hp,
    maxHp = maxHp,
    tempHp = tempHp,
    level = level,
    initiative = initiative,
    spellSlots = spellSlots,
    conditions = conditions,
    concentration = concentration,
    position = { x = x, y = y, z = z },
  }
end

-- ISSUE 5: Helper to cap recentEvents at MAX_EVENTS
local function addEvent(evt)
  table.insert(Tadpole.recentEvents, evt)
  while #Tadpole.recentEvents > MAX_EVENTS do
    table.remove(Tadpole.recentEvents, 1)
  end
end

-- Main state capture — ISSUE 4: wrapped in pcall
function Tadpole:CaptureState()
  local ok, result = pcall(function()
    local hostGuid = Osi.GetHostCharacter()
    if not hostGuid then return nil end

    local party = {}
    local _, playerRows = Osi.DB_Players:Get(nil)
    if playerRows then
      for _, row in ipairs(playerRows) do
        local data = getPartyMemberData(row[1])
        if data then table.insert(party, data) end
      end
    end

    local hostData = getPartyMemberData(hostGuid)

    local area = ""
    pcall(function() area = Ext.Utils.GetCurrentLevel() or "" end)

    local gold = 0
    pcall(function() gold = Osi.GetGold(hostGuid) or 0 end)

    local inCombat = false
    pcall(function() inCombat = Osi.IsInCombat(hostGuid) == 1 end)

    local inDialog = false
    pcall(function()
      local dialogState = safeGetEntity(hostGuid)
      if dialogState and dialogState.DialogState then
        inDialog = dialogState.DialogState.DialogId ~= nil
      end
    end)

    -- Death save tracking
    local deathSaves = {}
    pcall(function()
      local hostEntity = safeGetEntity(hostGuid)
      if hostEntity and hostEntity.DeathState then
        deathSaves = {
          successes = hostEntity.DeathState.Successes or 0,
          failures = hostEntity.DeathState.Failures or 0,
          isDead = hostEntity.DeathState.IsDead or false,
        }
      end
    end)

    -- Class/level breakdown
    local classes = {}
    pcall(function()
      local hostEntity = safeGetEntity(hostGuid)
      if hostEntity and hostEntity.Classes then
        for _, class in ipairs(hostEntity.Classes) do
          table.insert(classes, {
            name = class.Name or "Unknown",
            level = class.Level or 1,
          })
        end
      end
    end)

    -- Camp supplies
    local campSupplies = nil
    pcall(function()
      local hostEntity = safeGetEntity(hostGuid)
      if hostEntity then
        campSupplies = {
          current = hostEntity.CampSupply or 0,
          max = hostEntity.CampTotalSupplies or 0,
          canRest = hostEntity.CanDoRest or false,
        }
      end
    end)

    local state = {
      timestamp = Ext.Utils.GetTime(),
      area = area,
      inCombat = inCombat,
      inDialog = inDialog,
      host = hostData,
      party = party,
      gold = gold,
      deathSaves = deathSaves,
      classes = classes,
      campSupplies = campSupplies,
      events = self.recentEvents,
    }

    -- Don't clear recentEvents here - let the caller clear it after successful write
    return state
  end)
  if ok then return result end
  return nil
end

-- Check if state changed
function Tadpole:StateChanged(newState)
  local newJson = Ext.Json.Stringify(newState)
  if newJson ~= self.lastStateJson then
    self.lastStateJson = newJson
    return true
  end
  return false
end

-- ISSUE 6: Atomic write — write to temp file then rename
function Tadpole:WriteState(state)
  local json = Ext.Json.Stringify(state)
  local tmpPath = OUTPUT_PATH .. ".tmp"
  local file, err = io.open(tmpPath, "w")
  if not file then return false end
  file:write(json)
  file:close()
  local success, _ = pcall(os.rename, tmpPath, OUTPUT_PATH)
  return success
end

-- ISSUE 2: ReadCommands now handles both single objects and arrays
function Tadpole:ReadCommands()
  local file = io.open(COMMAND_PATH, "r")
  if not file then return nil end
  local content = file:read("*a")
  file:close()

  -- Parse first, delete file only after successful parse
  local success, parsed = pcall(Ext.Json.Parse, content)
  if not success or not parsed then
    -- Parse failed, don't delete the file - user can try again
    return nil
  end

  -- Delete file after successful parse
  pcall(os.remove, COMMAND_PATH)

  -- If it's an array, return it as-is for iteration
  if type(parsed) == "table" and parsed[1] ~= nil then
    return parsed
  end
  -- Single command object — wrap in array for uniform handling
  return { parsed }
end

-- Execute a command from the phone app
function Tadpole:ExecuteCommand(cmd)
  if not cmd or not cmd.action then return end
  local hostGuid = Osi.GetHostCharacter()
  if not hostGuid then return end

  if cmd.action == "trigger_rest" then
    pcall(Osi.RestSessionStarted)
  elseif cmd.action == "add_gold" then
    pcall(Osi.AddGold, hostGuid, cmd.value or 0)
  elseif cmd.action == "give_item" then
    local x, y, z = Osi.GetTransform(hostGuid)
    pcall(Osi.CreateAt, cmd.itemId, x, y, z, 1)
  elseif cmd.action == "god_mode" then
    local enabled = cmd.enabled or false
    pcall(Osi.SetInvulnerable, hostGuid, enabled and 1 or 0)
  elseif cmd.action == "heal" then
    pcall(Osi.CharacterHeal, hostGuid, cmd.amount or 100)
  elseif cmd.action == "full_restore" then
    pcall(Osi.Proc_CharacterFullRestore, hostGuid)
  elseif cmd.action == "short_rest" then
    pcall(Osi.ShortRest, hostGuid)
  elseif cmd.action == "reset_cooldowns" then
    pcall(Osi.CharacterResetCooldowns, hostGuid)
  elseif cmd.action == "resurrect" then
    pcall(Osi.CharacterResurrect, hostGuid)
  elseif cmd.action == "teleport_to" then
    if cmd.targetGuid then
      pcall(Osi.TeleportTo, hostGuid, cmd.targetGuid, "")
    end
  elseif cmd.action == "heal_party" then
    -- Heal all party members
    local partySize = Osi.GetNumActiveEntities("Party Member") or 0
    for i = 0, partySize - 1 do
      local memberGuid = Osi.GetActiveEntityAt("Party Member", i)
      if memberGuid then
        pcall(Osi.Proc_CharacterFullRestore, memberGuid)
      end
    end
  elseif cmd.action == "long_rest" then
    pcall(Osi.RestSessionStarted)
  elseif cmd.action == "revive" then
    -- Alias for resurrect
    local partySize = Osi.GetNumActiveEntities("Party Member") or 0
    for i = 0, partySize - 1 do
      local memberGuid = Osi.GetActiveEntityAt("Party Member", i)
      if memberGuid and Osi.IsDead(memberGuid) == 1 then
        pcall(Osi.CharacterResurrect, memberGuid)
      end
    end
  elseif cmd.action == "teleport_to_waypoint" then
    if cmd.waypoint then
      pcall(Osi.TeleportTo, hostGuid, cmd.waypoint, "")
    end
  end
end

-- Tick function -- runs every frame
Ext.Events.Tick:Subscribe(function(e)
  Tadpole.elapsed = Tadpole.elapsed + e.Time.Delta
  if Tadpole.elapsed < Tadpole.updateInterval then return end
  Tadpole.elapsed = 0

  local state = Tadpole:CaptureState()
  if state and Tadpole:StateChanged(state) then
    local written = Tadpole:WriteState(state)
    if written then
      -- Only clear events if write succeeded
      Tadpole.recentEvents = {}
    end
  end

  -- ISSUE 2: ReadCommands returns array of commands
  local cmds = Tadpole:ReadCommands()
  if cmds then
    for _, cmd in ipairs(cmds) do
      Tadpole:ExecuteCommand(cmd)
    end
  end
end)

-- Event listeners — all use addEvent() which caps at MAX_EVENTS
Ext.Osiris.RegisterListener("CombatStarted", 1, "after", function(combat)
  addEvent({
    type = "combat_started",
    timestamp = Ext.Utils.GetTime(),
  })
end)

Ext.Osiris.RegisterListener("CombatEnded", 1, "after", function(combat)
  addEvent({
    type = "combat_ended",
    timestamp = Ext.Utils.GetTime(),
  })
end)

Ext.Osiris.RegisterListener("LevelGameplayStarted", 2, "after", function(level, isEditor)
  addEvent({
    type = "area_changed",
    area = level,
    timestamp = Ext.Utils.GetTime(),
  })
end)

-- Dialog events (capture manually since we're tracking inDialog state now)
Ext.Osiris.RegisterListener("DialogStarted", 1, "after", function(dialog)
  addEvent({
    type = "dialog_started",
    timestamp = Ext.Utils.GetTime(),
    dialogId = dialog,
  })
end)

Ext.Osiris.RegisterListener("DialogEnded", 1, "after", function(dialog)
  addEvent({
    type = "dialog_ended",
    timestamp = Ext.Utils.GetTime(),
    dialogId = dialog,
  })
end)

Ext.Osiris.RegisterListener("LongRestFinished", 0, "after", function()
  addEvent({
    type = "long_rest",
    timestamp = Ext.Utils.GetTime(),
  })
end)

-- Initialization
Ext.Events.SessionLoaded:Subscribe(function()
  Tadpole.lastStateJson = ""
  Tadpole.recentEvents = {}
  Ext.Utils.Log("Tadpole Companion mod loaded!")
end)
