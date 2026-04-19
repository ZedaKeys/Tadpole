// BG3 Equipment suggestions per class, organized by category and act.
// Based on real in-game items and optimal gearing strategies.

export type EquipmentCategory = 'weapon' | 'armor' | 'accessory';

export interface EquipmentSuggestion {
  name: string;
  why: string;
  location: string;
  act: 1 | 2 | 3;
  rarity: string;
}

export interface ClassEquipmentCategory {
  category: EquipmentCategory;
  items: EquipmentSuggestion[];
}

export interface ClassEquipment {
  classId: string;
  className: string;
  categories: ClassEquipmentCategory[];
}

export const equipmentSuggestions: ClassEquipment[] = [
  // ── Barbarian ──────────────────────────────────────────────
  {
    classId: 'barbarian',
    className: 'Barbarian',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Everburn Blade',
            why: 'Greatsword with +1d4 Fire damage. Excellent early-game two-hander for Rage-fueled strikes. Available right at the start on the Nautiloid.',
            location: 'Ravaged Beach, looted from Commander Zhalk on the Nautiloid',
            act: 1,
            rarity: 'rare',
          },
          {
            name: 'Sarevok\'s Sword of Chaos',
            why: 'Greatsword that adds +1d8 Necrotic damage and can inflict Confusion on hit. Pairs perfectly with Reckless Attack for massive crit-fishing damage.',
            location: 'Morphic Pool, dropped by the Elder Brain during the final confrontation',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Giantbreaker',
            why: 'A versatile greatsword with bonus damage and knockback. Great for controlling the battlefield while raging. Solid mid-game upgrade.',
            location: 'Grymforge, looted from a Duergar boss encounter',
            act: 1,
            rarity: 'uncommon',
          },
          {
            name: 'Nyrulna',
            why: 'Legendary trident with +1d4 Thunder damage and Thunderbolt ability. Returns when thrown — perfect for a thrown-weapon Berserker build.',
            location: 'Wyrm\'s Rock, won from Akabi the djinni in the circus',
            act: 3,
            rarity: 'legendary',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Adamantine Splint Mail',
            why: 'Heavy armor immune to critical hits and makes attackers Reeling. Combined with Rage damage resistance, you become incredibly tanky.',
            location: 'Grymforge, forged at the Adamantine Forge with Mithral Ore and Splint Mail mould',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Helldusk Armor',
            why: 'Legendary heavy armor with fire resistance, crit immunity, and a free Fly spell. The ultimate tank armor for any barbarian.',
            location: 'House of Hope, in Raphael\'s vault',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Unwavering Scale Mail',
            why: 'Medium armor that grants advantage on saving throws against being frightened. A strong pick for Wildheart barbarians who don\'t want heavy armor.',
            location: 'Last Light Inn, sold by Dammon the tiefling blacksmith',
            act: 2,
            rarity: 'rare',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Gauntlets of Hill Giant Strength',
            why: 'Sets Strength to 21. Barbarians are all about Strength — this frees up ability score points for Constitution and Dexterity.',
            location: 'Last Light Inn, in a locked chest behind the Harper camp',
            act: 2,
            rarity: 'very rare',
          },
          {
            name: 'Amulet of Greater Health',
            why: 'Sets Constitution to 23. Massive HP boost for a d12 hit die class. Also grants advantage on Concentration saves — great if you picked up a concentration spell.',
            location: 'Moonrise Towers, looted from Ketheric Thorm after defeating him',
            act: 2,
            rarity: 'legendary',
          },
          {
            name: 'Caustic Band',
            why: 'Adds +2 Acid damage to every weapon attack. With multiple attacks per turn from Extra Attack, this adds up fast during Rage.',
            location: 'Emerald Grove, sold by the trader Arron',
            act: 1,
            rarity: 'rare',
          },
        ],
      },
    ],
  },

  // ── Bard ───────────────────────────────────────────────────
  {
    classId: 'bard',
    className: 'Bard',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Phalar Aluve',
            why: 'A singing longsword with Sing (advantage on saves for allies) and Shriek (1d4 Thunder AoE). Perfect for a Valour or Swords Bard who wades into melee.',
            location: 'Underdark, embedded in a rock near the Selunite outpost',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Dancing Breeze',
            why: 'Elegant rapier with on-kill temp HP and a free Dash. A Swords Bard\'s dream weapon that rewards aggressive play.',
            location: 'Wyrm\'s Rock, from the djinni in the circus',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Rhapsody',
            why: 'Dagger that stacks +1 to attack, damage, and spell DC per kill (max +3). Devastating for any Bard using Blade Flourish or offensive spells.',
            location: 'Cazador\'s Palace, looted after the Astarion quest confrontation',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Hellfire Hand Crossbow',
            why: 'Hand crossbow with +1d6 Fire damage. Swords Bards using hand crossbows for bonus-action attacks get incredible value from this.',
            location: 'House of Hope, looted from a fiendish guardian',
            act: 3,
            rarity: 'very rare',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Potent Robe',
            why: 'Adds Charisma modifier to cantrip damage and grants at-will Mage Armour. Lore Bards who spam Vicious Mockery or use cantrips will love the damage boost.',
            location: 'Last Light Inn, given by Alfira after completing her song quest',
            act: 2,
            rarity: 'very rare',
          },
          {
            name: 'Birthright',
            why: 'Increases Charisma by +2 (up to 22). More Charisma means better spell DC, better Bardic Inspiration, and better dialogue — everything a Bard wants.',
            location: 'Sorcerous Sundries, purchased from the shop',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Adamantine Scale Mail',
            why: 'Medium armor with crit immunity and the Reeling effect. Great for Valour and Swords Bards who want to be in the thick of combat.',
            location: 'Grymforge, forged at the Adamantine Forge with Mithral Ore and Scale Mail mould',
            act: 1,
            rarity: 'very rare',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Ring of Protection',
            why: '+1 to AC and all saving throws. A simple, universally useful ring for a class that can end up in sticky situations.',
            location: 'Emerald Grove, reward for saving the grove from the goblins',
            act: 1,
            rarity: 'rare',
          },
          {
            name: 'Cloak of the Weave',
            why: 'Advantage on saves against spells and Arcane Battery (free spell slot). Excellent for a Bard\'s magical versatility and survivability.',
            location: 'Sorcerous Sundries vault, behind the Ramazith\'s Tower puzzle',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Crusher\'s Ring',
            why: '+3m movement speed. Bards love mobility — get into position for Cutting Words, Bardic Inspiration, or that perfect Shatter spell.',
            location: 'Goblin Camp, looted from Crusher the goblin boss',
            act: 1,
            rarity: 'uncommon',
          },
        ],
      },
    ],
  },

  // ── Cleric ─────────────────────────────────────────────────
  {
    classId: 'cleric',
    className: 'Cleric',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Blood of Lathander',
            why: 'Legendary mace with Sunbeam, blinds on crit, and +1d4 Radiant damage. The quintessential cleric weapon — powerful against undead throughout the game.',
            location: 'Githyanki Creche, in the Inquisitor\'s Chamber behind a Lathander statue puzzle',
            act: 1,
            rarity: 'legendary',
          },
          {
            name: 'Devotee\'s Mace',
            why: 'Legendary mace with +1d8 Radiant damage and a healing ability. Grants +1 to spell save DC. The ultimate cleric weapon for both offense and support.',
            location: 'Stormshore Armoury, sold by Counsellor Florrick or looted in the Lower City vault',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Selune\'s Spear of Night',
            why: 'Spear with +1d6 Radiant damage and free Moonbeam cast. Particularly thematic for a Selunite cleric and strong in the Shadow-Cursed Lands.',
            location: 'Shadowfelt, given by the Nightsong (Dame Aylin) after sparing her in Act 2',
            act: 2,
            rarity: 'legendary',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Adamantine Splint Mail',
            why: 'Heavy armor with crit immunity. Life Domain clerics get heavy armor proficiency — this is the best tank option in Act 1 for a front-line cleric.',
            location: 'Grymforge, forged at the Adamantine Forge with Mithral Ore and Splint Mail mould',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Helldusk Armor',
            why: 'Legendary heavy armor with fire resistance, flight, and crit immunity. For Life or War Domain clerics who want the ultimate protection.',
            location: 'House of Hope, in Raphael\'s vault',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Potent Robe',
            why: 'Adds Charisma modifier to cantrip damage and grants Mage Armour. While Clerics use Wisdom, the robe works for any caster using cantrips like Sacred Flame or Toll the Dead.',
            location: 'Last Light Inn, given by Alfira after completing her song quest',
            act: 2,
            rarity: 'very rare',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Amulet of the Devout',
            why: '+2 to spell save DC and spell attack rolls. The single best accessory for maximizing the impact of your cleric spells like Spirit Guardians and Guiding Bolt.',
            location: 'Stormshore Armoury, looted from the vault in Baldur\'s Gate',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Gloves of Belligerent Skies',
            why: 'Extends Radiant debuffs and adds +1d4 Radiant damage to debuffed targets. Pairs perfectly with Spirit Guardians and Guiding Bolt for a Light cleric.',
            location: 'Shadow-Cursed Lands, found in a chest near the Reithwin Town area',
            act: 2,
            rarity: 'rare',
          },
          {
            name: 'Amulet of Greater Health',
            why: 'Sets Constitution to 23. A front-line cleric with Spirit Guardians needs to stay alive — this gives a massive HP pool and Con save advantage.',
            location: 'Moonrise Towers, looted from Ketheric Thorm after defeating him',
            act: 2,
            rarity: 'legendary',
          },
        ],
      },
    ],
  },

  // ── Druid ──────────────────────────────────────────────────
  {
    classId: 'druid',
    className: 'Druid',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Markoheshkir',
            why: 'Legendary quarterstaff with Arcane Battery, +1 to spell save DC, and Kereska\'s Favour elemental buff. The best spellcasting staff in the game for any druid.',
            location: 'Ramazith\'s Tower, top floor, on a pedestal behind magical barriers',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Staff of Spellpower',
            why: '+1 to spell save DC, bonus 3rd-level spell slot, and 1d6 Force damage on melee hits. An excellent alternative to Markoheshkir for a caster druid.',
            location: 'Sorcerous Sundries, purchased or looted from the tower vaults',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Phalar Aluve',
            why: 'Longsword with Sing and Shriek abilities. Works while in Wild Shape (the effects persist), making it great for a Moon Druid who buffs before transforming.',
            location: 'Underdark, embedded in a rock near the Selunite outpost',
            act: 1,
            rarity: 'very rare',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Armour of the Spore Druid',
            why: 'Medium armor with acid resistance and passive necrotic damage to nearby enemies. Built specifically for Circle of Spores druids — synergizes with Halo of Spores.',
            location: 'Underdark, sold by the Myconid trader',
            act: 1,
            rarity: 'rare',
          },
          {
            name: 'Adamantine Scale Mail',
            why: 'Medium armor with crit immunity and the Reeling effect. Druids have medium armor proficiency, and this is the best defensive option in Act 1.',
            location: 'Grymforge, forged at the Adamantine Forge with Mithral Ore and Scale Mail mould',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Potent Robe',
            why: 'Adds Charisma modifier to cantrip damage and grants Mage Armour. While druids use Wisdom, this works well for a caster druid spamming Produce Flame or Thorn Whip.',
            location: 'Last Light Inn, given by Alfira after completing her song quest',
            act: 2,
            rarity: 'very rare',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Shapeshifter\'s Boon Ring',
            why: '+1d6 damage while shapeshifted and advantage on Intimidation. Essential for Moon Druids who spend most of combat in Wild Shape.',
            location: 'Emerald Grove, reward from the Strange Ox after saving the grove',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Amulet of Greater Health',
            why: 'Sets Constitution to 23. Huge HP boost for a druid, and the Con save advantage helps maintain Concentration on Call Lightning or Moonbeam.',
            location: 'Moonrise Towers, looted from Ketheric Thorm after defeating him',
            act: 2,
            rarity: 'legendary',
          },
          {
            name: 'Ring of Protection',
            why: '+1 to AC and all saving throws. Druids are often in the mid-line — this helps them survive while maintaining concentration on key spells.',
            location: 'Emerald Grove, reward for saving the grove from the goblins',
            act: 1,
            rarity: 'rare',
          },
        ],
      },
    ],
  },

  // ── Fighter ────────────────────────────────────────────────
  {
    classId: 'fighter',
    className: 'Fighter',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Everburn Blade',
            why: 'Greatsword with +1d4 Fire damage. Available from minute one and remains relevant through Act 1. Pairs well with Great Weapon Fighting style.',
            location: 'Ravaged Beach, looted from Commander Zhalk on the Nautiloid',
            act: 1,
            rarity: 'rare',
          },
          {
            name: 'Nyrulna',
            why: 'Legendary trident with +1d4 Thunder damage and Thunderbolt ability. Returns when thrown — incredible for a thrown-weapon Fighter build.',
            location: 'Wyrm\'s Rock, won from Akabi the djinni in the circus',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Gontr Mael',
            why: 'Legendary longbow with Guiding Bolt and Sunbeam. An archer Fighter\'s dream — adds utility and damage that scales with Extra Attack (3 attacks at level 11).',
            location: 'Open Hand Temple, in the secret vault accessible during the Murder Tribunal quest',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Sword of Chaos',
            why: 'Sentient greatsword with +1d8 Necrotic and Confusion on hit. Perfect for a Great Weapon Master crit-fishing build with Action Surge.',
            location: 'Morphic Pool, dropped by the Elder Brain during the final confrontation',
            act: 3,
            rarity: 'legendary',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Adamantine Splint Mail',
            why: 'Crit immunity and Reeling on attackers. The definitive Act 1 armor for heavy-armor Fighters. Combined with Second Wind, you\'re nearly unkillable.',
            location: 'Grymforge, forged at the Adamantine Forge with Mithral Ore and Splint Mail mould',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Helldusk Armor',
            why: 'Legendary heavy armor with fire resistance, crit immunity, and Fly. The absolute best-in-slot armor for Fighters in Act 3.',
            location: 'House of Hope, in Raphael\'s vault',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Helm of Balduran',
            why: 'Legendary helmet with crit immunity, healing on crits, +1 AC, and fear immunity. Stacks with adamantine for ultimate tankiness.',
            location: 'Dragon\'s Sanctum in Wyrm\'s Rock, found in the sealed vault',
            act: 3,
            rarity: 'legendary',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Gauntlets of Hill Giant Strength',
            why: 'Sets Strength to 21. A Strength-based Fighter gets +5 to hit and damage, making Great Weapon Master\'s -5 penalty much easier to overcome.',
            location: 'Last Light Inn, in a locked chest behind the Harper camp',
            act: 2,
            rarity: 'very rare',
          },
          {
            name: 'Amulet of Greater Health',
            why: 'Sets Constitution to 23. A d10 hit die class with 23 Con and Indomitable makes for the tankiest character possible.',
            location: 'Moonrise Towers, looted from Ketheric Thorm after defeating him',
            act: 2,
            rarity: 'legendary',
          },
          {
            name: 'Caustic Band',
            why: '+2 Acid damage per hit. With 3 attacks per turn at level 11 (or more with Action Surge), this adds up to 6+ extra damage every round.',
            location: 'Emerald Grove, sold by the trader Arron',
            act: 1,
            rarity: 'rare',
          },
        ],
      },
    ],
  },

  // ── Monk ───────────────────────────────────────────────────
  {
    classId: 'monk',
    className: 'Monk',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Phalar Aluve',
            why: 'Longsword with Sing and Shriek abilities. Monks can use this as a monk weapon at higher levels, and the party-wide buff from Sing is exceptional.',
            location: 'Underdark, embedded in a rock near the Selunite outpost',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Rhapsody',
            why: 'Dagger that stacks +1 to attack, damage, and spell DC per kill. Monks make many attacks per turn with Flurry of Blows, racking up kills fast.',
            location: 'Cazador\'s Palace, looted after the Astarion quest confrontation',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Sword of Life Stealing',
            why: 'Shortsword that steals life on crits. Monks can use shortswords as monk weapons. With multiple attacks, crit chance is high, triggering the life steal often.',
            location: 'Goblin Camp, looted from Priestess Gut or in the Shattered Sanctum',
            act: 1,
            rarity: 'rare',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Helm of Balduran',
            why: 'Legendary helmet with crit immunity, healing on crits, +1 AC, and fear immunity. Since Monks can\'t wear armor, headgear is their main defensive slot.',
            location: 'Dragon\'s Sanctum in Wyrm\'s Rock, found in the sealed vault',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Gloves of Dexterity',
            why: 'Sets Dexterity to 18. With Unarmored Defense (10 + Dex + Wis), this gives a massive AC boost without needing to invest heavily in Dexterity.',
            location: 'Creche Y\'llek, looted from the Inquisitor\'s chamber',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Gloves of Soul Catching',
            why: 'Grants advantage on Constitution saves and can grant temporary hit points. Works beautifully with a monk\'s ki-powered abilities and high Dex build.',
            location: 'House of Hope, looted from the archive guardian',
            act: 3,
            rarity: 'very rare',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Crusher\'s Ring',
            why: '+3m movement speed. Monks already have fast movement — this makes them absurdly mobile, able to reach any target on the battlefield.',
            location: 'Goblin Camp, looted from Crusher the goblin boss',
            act: 1,
            rarity: 'uncommon',
          },
          {
            name: 'Amulet of Greater Health',
            why: 'Sets Constitution to 23. Monks have only a d8 hit die and often find themselves in melee. This dramatically improves survivability and Stunning Strike DC.',
            location: 'Moonrise Towers, looted from Ketheric Thorm after defeating him',
            act: 2,
            rarity: 'legendary',
          },
          {
            name: 'Ring of Protection',
            why: '+1 to AC and all saving throws. Monks rely on Unarmored Defense, so every point of AC matters. The save bonus helps with Dexterity and Wisdom checks.',
            location: 'Emerald Grove, reward for saving the grove from the goblins',
            act: 1,
            rarity: 'rare',
          },
        ],
      },
    ],
  },

  // ── Paladin ────────────────────────────────────────────────
  {
    classId: 'paladin',
    className: 'Paladin',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Blood of Lathander',
            why: 'Legendary mace with Sunbeam, +1d4 Radiant damage, and blinds on crit. Divine Smite + Radiant weapon damage is the paladin dream, especially vs undead.',
            location: 'Githyanki Creche, in the Inquisitor\'s Chamber behind a Lathander statue puzzle',
            act: 1,
            rarity: 'legendary',
          },
          {
            name: 'Devotee\'s Mace',
            why: 'Legendary mace with +1d8 Radiant and a healing ability. +1 spell save DC helps with your paladin aura and spells. A perfect Oath of Devotion weapon.',
            location: 'Stormshore Armoury, sold by Counsellor Florrick or looted in the Lower City vault',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Sword of Chaos',
            why: 'Greatsword with +1d8 Necrotic and Confusion. Perfect for a two-handed paladin using Great Weapon Fighting style and Divine Smite for massive burst.',
            location: 'Morphic Pool, dropped by the Elder Brain during the final confrontation',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Selune\'s Spear of Night',
            why: 'Spear with +1d6 Radiant and free Moonbeam. Great for an Oath of the Ancients paladin — thematically appropriate and mechanically strong.',
            location: 'Shadowfelt, given by the Nightsong (Dame Aylin) after sparing her in Act 2',
            act: 2,
            rarity: 'legendary',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Adamantine Splint Mail',
            why: 'Heavy armor with crit immunity. Paladins have heavy armor proficiency and rely on being in the front line. This keeps them alive through Act 1 and beyond.',
            location: 'Grymforge, forged at the Adamantine Forge with Mithral Ore and Splint Mail mould',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Helldusk Armor',
            why: 'Legendary heavy armor with fire resistance, crit immunity, and Fly. Paladins who can fly into the backline to smite priority targets are terrifying.',
            location: 'House of Hope, in Raphael\'s vault',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Armour of Persistence',
            why: 'Legendary plate with flat damage reduction and regeneration. Combined with Lay on Hands and your aura, you become an unstoppable tank.',
            location: 'Sorcerous Sundries, purchased from Rolan in Act 3 after saving him',
            act: 3,
            rarity: 'legendary',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Amulet of Greater Health',
            why: 'Sets Constitution to 23. Paladins need high Con for Concentration on spells like Bless and Shield of Faith, plus the HP boost is enormous for a frontliner.',
            location: 'Moonrise Towers, looted from Ketheric Thorm after defeating him',
            act: 2,
            rarity: 'legendary',
          },
          {
            name: 'Gauntlets of Hill Giant Strength',
            why: 'Sets Strength to 21. More Strength means better attack rolls for landing those crucial Divine Smite hits, and better Athletics for shoving.',
            location: 'Last Light Inn, in a locked chest behind the Harper camp',
            act: 2,
            rarity: 'very rare',
          },
          {
            name: 'Gloves of Belligerent Skies',
            why: 'Extends Radiant debuffs and adds +1d4 Radiant to debuffed targets. Your Divine Smite applies Radiant — this amplifies that damage automatically.',
            location: 'Shadow-Cursed Lands, found in a chest near the Reithwin Town area',
            act: 2,
            rarity: 'rare',
          },
        ],
      },
    ],
  },

  // ── Ranger ─────────────────────────────────────────────────
  {
    classId: 'ranger',
    className: 'Ranger',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Gontr Mael',
            why: 'Legendary longbow with Guiding Bolt, Sunbeam, and +1d4 Radiant damage. The best ranged weapon in the game — made for an archer Ranger.',
            location: 'Open Hand Temple, in the secret vault accessible during the Murder Tribunal quest',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Hellfire Hand Crossbow',
            why: 'Hand crossbow with +1d6 Fire damage and Ignite. Dual-wielding hand crossbows is one of the strongest Ranger builds, and this is the premium off-hand.',
            location: 'House of Hope, looted from a fiendish guardian',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Broodmother\'s Revenge',
            why: 'Crossbow that coats bolts with poison. With Hunter\'s Mark and multiple attacks, the poison stacks add significant sustained damage.',
            location: 'Spider Grove beneath the Blighted Village, looted from the Phase Spider Matriarch',
            act: 1,
            rarity: 'rare',
          },
          {
            name: 'Nyrulna',
            why: 'Legendary trident that returns when thrown. A throwing-focused Ranger build with this weapon and Extra Attack is incredibly fun and effective.',
            location: 'Wyrm\'s Rock, won from Akabi the djinni in the circus',
            act: 3,
            rarity: 'legendary',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Adamantine Scale Mail',
            why: 'Medium armor with crit immunity. Rangers have medium armor proficiency, and this is the best defensive option available in Act 1.',
            location: 'Grymforge, forged at the Adamantine Forge with Mithral Ore and Scale Mail mould',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Yuan-Ti Scale Mail',
            why: 'Medium armor with poison resistance and Envenom Weapon ability. The poison synergy works well with Ranger builds that already use poison-based strategies.',
            location: 'Temple of Bhaal in the Undercity, looted from the Yuan-Ti',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Helm of Balduran',
            why: 'Legendary helmet with crit immunity, healing on crits, +1 AC. Rangers don\'t wear heavy armor, so premium headgear is a key defensive slot.',
            location: 'Dragon\'s Sanctum in Wyrm\'s Rock, found in the sealed vault',
            act: 3,
            rarity: 'legendary',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Caustic Band',
            why: '+2 Acid damage per hit. Rangers make multiple attacks per turn with Extra Attack and sometimes off-hand attacks — this flat damage adds up fast.',
            location: 'Emerald Grove, sold by the trader Arron',
            act: 1,
            rarity: 'rare',
          },
          {
            name: 'Gloves of Dexterity',
            why: 'Sets Dexterity to 18. A Dex-based Ranger gets +4 to hit and damage, better AC, and better initiative. Frees up ability score improvements for Wisdom.',
            location: 'Creche Y\'llek, looted from the Inquisitor\'s chamber',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Crusher\'s Ring',
            why: '+3m movement speed. Rangers are mobile skirmishers — extra movement helps you get into optimal range for your bow or melee attacks.',
            location: 'Goblin Camp, looted from Crusher the goblin boss',
            act: 1,
            rarity: 'uncommon',
          },
        ],
      },
    ],
  },

  // ── Rogue ──────────────────────────────────────────────────
  {
    classId: 'rogue',
    className: 'Rogue',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Rhapsody',
            why: 'Dagger that stacks +1 to attack, damage, and spell DC per kill. Rogues often get killing blows with Sneak Attack — this snowballs fast in every fight.',
            location: 'Cazador\'s Palace, looted after the Astarion quest confrontation',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Sword of Life Stealing',
            why: 'Shortsword that steals life on crits. Sneak Attack rolls many dice, making crits more impactful — and when you crit, you heal for massive amounts.',
            location: 'Goblin Camp, looted from Priestess Gut or in the Shattered Sanctum',
            act: 1,
            rarity: 'rare',
          },
          {
            name: 'Hellfire Hand Crossbow',
            why: 'Hand crossbow with +1d6 Fire. Rogues often use hand crossbows for bonus-action attacks. The extra fire damage applies to every Sneak Attack shot.',
            location: 'House of Hope, looted from a fiendish guardian',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Crimson Rapier',
            why: 'Rapier with +1d6 Necrotic and heals on crits. Finesse weapon that works with Sneak Attack, and the healing helps offset the rogue\'s fragility.',
            location: 'House of Hope, looted from a Pact-bound servant',
            act: 3,
            rarity: 'very rare',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Adamantine Scale Mail',
            why: 'Medium armor with crit immunity. Rogues who take a level in Fighter or Ranger for medium armor proficiency should strongly consider this.',
            location: 'Grymforge, forged at the Adamantine Forge with Mithral Ore and Scale Mail mould',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Helm of Balduran',
            why: 'Crit immunity, heal on crits, +1 AC. Rogues are crit-vulnerable due to lower HP — this helmet is a lifesaver. Crits from your Sneak Attack also heal you.',
            location: 'Dragon\'s Sanctum in Wyrm\'s Rock, found in the sealed vault',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Shade-Slayer Cloak',
            why: 'Advantage on Stealth, necrotic resistance, and Umbral Escape teleport. Built for a rogue who thrives in shadows — which is all of them.',
            location: 'Shadow-Cursed Lands, looted from a shadow-cursed enemy',
            act: 2,
            rarity: 'rare',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Crusher\'s Ring',
            why: '+3m movement speed. Cunning Action + extra speed means you can Dash, Disengage, or Hide and still reach any target on the battlefield.',
            location: 'Goblin Camp, looted from Crusher the goblin boss',
            act: 1,
            rarity: 'uncommon',
          },
          {
            name: 'Smuggler\'s Ring',
            why: '+2 Sleight of Hand and +2 Stealth. The quintessential rogue ring — better lockpicking, pickpocketing, and sneaking from a single accessory.',
            location: 'Riverside Teahouse, hidden in a hollow tree near the river',
            act: 1,
            rarity: 'uncommon',
          },
          {
            name: 'Gloves of Dexterity',
            why: 'Sets Dexterity to 18. Better AC, better initiative, better attack and damage with finesse weapons. A rogue with 18 Dex from gear can invest in other stats.',
            location: 'Creche Y\'llek, looted from the Inquisitor\'s chamber',
            act: 1,
            rarity: 'very rare',
          },
        ],
      },
    ],
  },

  // ── Sorcerer ───────────────────────────────────────────────
  {
    classId: 'sorcerer',
    className: 'Sorcerer',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Markoheshkir',
            why: 'Legendary quarterstaff with Arcane Battery (free spell slot), +1 spell save DC, and elemental buff choice. The absolute best weapon for any sorcerer.',
            location: 'Ramazith\'s Tower, top floor, on a pedestal behind magical barriers',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Staff of Spellpower',
            why: '+1 spell save DC, bonus 3rd-level spell slot, and 1d6 Force on melee. An excellent alternative if you can\'t get Markoheshkir.',
            location: 'Sorcerous Sundries, purchased or looted from the tower vaults',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Rhapsody',
            why: 'Dagger stacking +1 to attack, damage, and spell DC per kill. A sorcerer with Twinned Spell can rack up kills fast, boosting DC for critical control spells.',
            location: 'Cazador\'s Palace, looted after the Astarion quest confrontation',
            act: 3,
            rarity: 'very rare',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Potent Robe',
            why: 'Adds Charisma modifier to cantrip damage. Draconic Bloodline and other sorcerers who spam Fire Bolt or Ray of Frost get massive value from this.',
            location: 'Last Light Inn, given by Alfira after completing her song quest',
            act: 2,
            rarity: 'very rare',
          },
          {
            name: 'Birthright',
            why: '+2 Charisma (up to 22). More Charisma means higher spell DC and better Metamagic. Every sorcerer should want this hat.',
            location: 'Sorcerous Sundries, purchased from the shop',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Robes of the Warmage',
            why: 'Grants a bonus to spell attack rolls and cantrip damage. A strong early-to-mid game option for sorcerers before obtaining the Potent Robe.',
            location: 'Goblin Camp, sold by the goblin trader',
            act: 1,
            rarity: 'rare',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Cloak of the Weave',
            why: 'Advantage on saves vs spells and Arcane Battery. Sorcerers who stand in the backline still get targeted by spells — this keeps them alive and fuels Metamagic.',
            location: 'Sorcerous Sundries vault, behind the Ramazith\'s Tower puzzle',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Amulet of the Devout',
            why: '+2 to spell save DC and spell attack rolls. A sorcerer with Heightened Spell and +2 DC is virtually guaranteed to land their key control spells.',
            location: 'Stormshore Armoury, looted from the vault in Baldur\'s Gate',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Amulet of Greater Health',
            why: 'Sets Constitution to 23. Sorcerers have a d6 hit die — the lowest in the game. This dramatically improves survivability and Concentration checks.',
            location: 'Moonrise Towers, looted from Ketheric Thorm after defeating him',
            act: 2,
            rarity: 'legendary',
          },
        ],
      },
    ],
  },

  // ── Warlock ────────────────────────────────────────────────
  {
    classId: 'warlock',
    className: 'Warlock',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Markoheshkir',
            why: 'Legendary quarterstaff with Arcane Battery and +1 spell save DC. Warlocks have limited spell slots — a free one per short rest is incredibly valuable.',
            location: 'Ramazith\'s Tower, top floor, on a pedestal behind magical barriers',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Crimson Rapier',
            why: 'Rapier with +1d6 Necrotic and heals on crits. Pact of the Blade warlocks can bind this, making it use Charisma for attack and damage rolls.',
            location: 'House of Hope, looted from a Pact-bound servant',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Phalar Aluve',
            why: 'Longsword with Sing and Shriek. Pact of the Blade lets you use Charisma with this weapon. The Shriek ability adds AoE damage around your Hex target.',
            location: 'Underdark, embedded in a rock near the Selunite outpost',
            act: 1,
            rarity: 'very rare',
          },
          {
            name: 'Rhapsody',
            why: 'Dagger with stacking +1 per kill to attack, damage, and spell DC. Warlocks with Eldritch Blast can kill quickly, building stacks for devastating spells.',
            location: 'Cazador\'s Palace, looted after the Astarion quest confrontation',
            act: 3,
            rarity: 'very rare',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Potent Robe',
            why: 'Adds Charisma modifier to cantrip damage. This is THE warlock item — it supercharges Eldritch Blast, your primary damage cantrip.',
            location: 'Last Light Inn, given by Alfira after completing her song quest',
            act: 2,
            rarity: 'very rare',
          },
          {
            name: 'Birthright',
            why: '+2 Charisma (up to 22). Warlocks are the most Charisma-dependent class — everything from spell DC to Eldritch Blast uses Charisma.',
            location: 'Sorcerous Sundries, purchased from the shop',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Helldusk Armor',
            why: 'Heavy armor with fire resistance and Fly. A Pact of the Blade warlock with medium/heavy armor from a multiclass dip becomes a terrifying gish.',
            location: 'House of Hope, in Raphael\'s vault',
            act: 3,
            rarity: 'legendary',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Amulet of the Devout',
            why: '+2 spell save DC and spell attack rolls. Warlocks have few spell slots — making each one count with a higher DC is critical.',
            location: 'Stormshore Armoury, looted from the vault in Baldur\'s Gate',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Cloak of the Weave',
            why: 'Advantage on saves vs spells and Arcane Battery. A free spell slot per short rest effectively doubles your recovery rate for that slot.',
            location: 'Sorcerous Sundries vault, behind the Ramazith\'s Tower puzzle',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Ring of Protection',
            why: '+1 to AC and all saving throws. Warlocks have light armor at best — every point of AC helps when you\'re in the mid-line casting spells.',
            location: 'Emerald Grove, reward for saving the grove from the goblins',
            act: 1,
            rarity: 'rare',
          },
        ],
      },
    ],
  },

  // ── Wizard ─────────────────────────────────────────────────
  {
    classId: 'wizard',
    className: 'Wizard',
    categories: [
      {
        category: 'weapon',
        items: [
          {
            name: 'Markoheshkir',
            why: 'Legendary quarterstaff with Arcane Battery, +1 spell save DC, and Kereska\'s Favour elemental buff. The holy grail for wizards — it does everything a caster wants.',
            location: 'Ramazith\'s Tower, top floor, on a pedestal behind magical barriers',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Staff of Spellpower',
            why: '+1 spell save DC and a bonus 3rd-level spell slot. Wizards are slot-starved at low levels — this helps bridge the gap significantly.',
            location: 'Sorcerous Sundries, purchased or looted from the tower vaults',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Rhapsody',
            why: 'Dagger with stacking +1 per kill to spell DC. An Evocation wizard dropping Fireballs can build stacks quickly, making subsequent spells even deadlier.',
            location: 'Cazador\'s Palace, looted after the Astarion quest confrontation',
            act: 3,
            rarity: 'very rare',
          },
        ],
      },
      {
        category: 'armor',
        items: [
          {
            name: 'Potent Robe',
            why: 'Adds Charisma modifier to cantrip damage and Mage Armour at will. While wizards use Intelligence, the free Mage Armour saves a spell slot every day.',
            location: 'Last Light Inn, given by Alfira after completing her song quest',
            act: 2,
            rarity: 'very rare',
          },
          {
            name: 'Birthright',
            why: '+2 Charisma hat. While wizards don\'t use Charisma directly, if you multiclass or want better dialogue checks, this is useful. More niche for pure wizards.',
            location: 'Sorcerous Sundries, purchased from the shop',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Warped Headband of Intellect',
            why: 'Sets Intelligence to 17 and grants Detect Thoughts at will. In the early game, this is a massive boost to spell DC, attack rolls, and skill checks for a wizard.',
            location: 'Blighted Village, in the cellar of one of the houses behind a locked door',
            act: 1,
            rarity: 'uncommon',
          },
        ],
      },
      {
        category: 'accessory',
        items: [
          {
            name: 'Amulet of the Devout',
            why: '+2 spell save DC and spell attack rolls. The best caster necklace in the game — your Fireballs, Hold Persons, and Counterspells become significantly more reliable.',
            location: 'Stormshore Armoury, looted from the vault in Baldur\'s Gate',
            act: 3,
            rarity: 'very rare',
          },
          {
            name: 'Cloak of the Weave',
            why: 'Advantage on saves vs spells and Arcane Battery. Wizards are prime targets for enemy casters — this keeps you alive and gives you an extra spell slot.',
            location: 'Sorcerous Sundries vault, behind the Ramazith\'s Tower puzzle',
            act: 3,
            rarity: 'legendary',
          },
          {
            name: 'Necromancy of Thay',
            why: 'Grants Danse Macabre (summon undead), +1 Necromancy DC, and Chill Touch. A School of Necromancy wizard gets incredible value from this forbidden book.',
            location: 'Whispering Depths, behind a locked bookshelf beneath the Blighted Village',
            act: 1,
            rarity: 'very rare',
          },
        ],
      },
    ],
  },
];
