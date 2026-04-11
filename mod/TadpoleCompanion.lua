-- TadpoleCompanion.lua
-- BG3 ScriptExtender mod for Tadpole companion app
-- Install to: %LOCALAPPDATA%\Larian Studios\Baldur's Gate 3\ScriptExtender\LuaScripts\

local Tadpole = {
  lastStateJson = "",
  updateInterval = 2.0,
  elapsed = 0,
  recentEvents = {},
  prevState = nil,
}

local OUTPUT_PATH = os.getenv("TEMP") .. "\\tadpole_state.json"
local COMMAND_PATH = os.getenv("TEMP") .. "\\tadpole_commands.json"

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
  
  local hp, maxHp = 0, 1
  pcall(function()
    if entity.Health then
      hp = entity.Health.Hp or 0
      maxHp = entity.Health.MaxHp or 1
    end
  end)
  
  local level = 1
  pcall(function()
    if entity.Stats then
      level = entity.Stats.Level or 1
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
    level = level,
    position = { x = x, y = y, z = z },
  }
end

-- Main state capture
function Tadpole:CaptureState()
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
  
  local state = {
    timestamp = Ext.Utils.GetTime(),
    area = area,
    inCombat = inCombat,
    host = hostData,
    party = party,
    gold = gold,
    events = self.recentEvents,
  }
  
  self.recentEvents = {}
  return state
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

-- Write state to file for bridge server
function Tadpole:WriteState(state)
  local json = Ext.Json.Stringify(state)
  local file, err = io.open(OUTPUT_PATH, "w")
  if file then
    file:write(json)
    file:close()
  end
end

-- Read commands from bridge server
function Tadpole:ReadCommands()
  local file = io.open(COMMAND_PATH, "r")
  if not file then return nil end
  local content = file:read("*a")
  file:close()
  os.remove(COMMAND_PATH)
  local success, cmd = pcall(Ext.Json.Parse, content)
  if success then return cmd end
  return nil
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
  end
end

-- Tick function -- runs every frame
Ext.Events.Tick:Subscribe(function(e)
  Tadpole.elapsed = Tadpole.elapsed + e.Time.Delta
  if Tadpole.elapsed < Tadpole.updateInterval then return end
  Tadpole.elapsed = 0
  
  local state = Tadpole:CaptureState()
  if state and Tadpole:StateChanged(state) then
    Tadpole:WriteState(state)
  end
  
  local cmd = Tadpole:ReadCommands()
  if cmd then Tadpole:ExecuteCommand(cmd) end
end)

-- Event listeners
Ext.Osiris.RegisterListener("CombatStarted", 1, "after", function(combat)
  table.insert(Tadpole.recentEvents, {
    type = "combat_started",
    timestamp = Ext.Utils.GetTime(),
  })
end)

Ext.Osiris.RegisterListener("CombatEnded", 1, "after", function(combat)
  table.insert(Tadpole.recentEvents, {
    type = "combat_ended",
    timestamp = Ext.Utils.GetTime(),
  })
end)

Ext.Osiris.RegisterListener("LevelGameplayStarted", 2, "after", function(level, isEditor)
  table.insert(Tadpole.recentEvents, {
    type = "area_changed",
    area = level,
    timestamp = Ext.Utils.GetTime(),
  })
end)

Ext.Osiris.RegisterListener("DialogStarted", 1, "after", function(dialog)
  table.insert(Tadpole.recentEvents, {
    type = "dialog_started",
    timestamp = Ext.Utils.GetTime(),
  })
end)

Ext.Osiris.RegisterListener("DialogEnded", 1, "after", function(dialog)
  table.insert(Tadpole.recentEvents, {
    type = "dialog_ended",
    timestamp = Ext.Utils.GetTime(),
  })
end)

Ext.Osiris.RegisterListener("LongRestFinished", 0, "after", function()
  table.insert(Tadpole.recentEvents, {
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
