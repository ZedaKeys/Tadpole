import { Race, RaceSubrace } from '@/types';

export const races: Race[] = [
  // ── Human ──────────────────────────────────────────────────────────────────
  {
    id: 'human',
    name: 'Human',
    description:
      'Humans are the most adaptable and ambitious people among the common races. Whatever drives them, humans are the innovators, the achievers, and the pioneers of the worlds.',
    abilityBonuses: [
      { ability: 'strength', bonus: 1 },
      { ability: 'dexterity', bonus: 1 },
      { ability: 'constitution', bonus: 1 },
      { ability: 'intelligence', bonus: 1 },
      { ability: 'wisdom', bonus: 1 },
      { ability: 'charisma', bonus: 1 },
    ],
    features: [
      {
        name: 'Human Versatility',
        description:
          'Humans gain +1 to every ability score, making them well-rounded and adaptable to any class.',
      },
    ],
    proficiencies: [],
    subraces: [],
    speed: 30,
    size: 'Medium',
  },

  // ── Elf ────────────────────────────────────────────────────────────────────
  {
    id: 'elf',
    name: 'Elf',
    description:
      'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. They live in places of ethereal beauty, in the midst of ancient forests or in silvery spires glittering with faerie light.',
    abilityBonuses: [{ ability: 'dexterity', bonus: 2 }],
    features: [
      {
        name: 'Darkvision',
        description:
          'Accustomed to twilit forests and the night sky, you have superior vision in dark and dim conditions. You can see in dim light within 12m as if it were bright light, and in darkness as if it were dim light.',
      },
      {
        name: 'Keen Senses',
        description:
          'You have proficiency in the Perception skill.',
      },
      {
        name: 'Fey Ancestry',
        description:
          'You have advantage on saving throws against being charmed, and magic cannot put you to sleep.',
      },
      {
        name: 'Trance',
        description:
          'Elves do not need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day.',
      },
    ],
    proficiencies: ['Perception'],
    subraces: [
      {
        id: 'high-elf',
        name: 'High Elf',
        description:
          'High Elves are the most common type of elf in the Forgotten Realms. They are civilized and organized, and prize magical learning above all else.',
        abilityBonuses: [{ ability: 'intelligence', bonus: 1 }],
        features: [
          {
            name: 'High Elf Cantrip',
            description:
              'You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.',
          },
          {
            name: 'Elf Weapon Training',
            description:
              'You have proficiency with the longsword, shortsword, shortbow, and longbow.',
          },
        ],
        proficiencies: ['Longsword', 'Shortsword', 'Shortbow', 'Longbow'],
      },
      {
        id: 'wood-elf',
        name: 'Wood Elf',
        description:
          'Wood Elves are reclusive but welcoming, guardians of the forest. They are faster and more stealthy than other elves.',
        abilityBonuses: [{ ability: 'wisdom', bonus: 1 }],
        features: [
          {
            name: 'Mask of the Wild',
            description:
              'You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena.',
          },
          {
            name: 'Elf Weapon Training',
            description:
              'You have proficiency with the longsword, shortsword, shortbow, and longbow.',
          },
        ],
        proficiencies: ['Longsword', 'Shortsword', 'Shortbow', 'Longbow'],
      },
      {
        id: 'drow',
        name: 'Drow',
        description:
          'Drow are a dark-skinned subrace of elves that primarily live in the Underdark. They are known for their cruelty and devotion to Lolth.',
        abilityBonuses: [{ ability: 'charisma', bonus: 1 }],
        features: [
          {
            name: 'Superior Darkvision',
            description:
              'Your darkvision has a range of 24m instead of the standard 12m. You also have Sunlight Sensitivity.',
          },
          {
            name: 'Sunlight Sensitivity',
            description:
              'You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight.',
          },
          {
            name: 'Drow Magic',
            description:
              'You know the Dancing Lights cantrip. When you reach 3rd level, you can cast Faerie Fire once per long rest. When you reach 5th level, you can cast Darkness once per long rest. Charisma is your spellcasting ability for these spells.',
          },
          {
            name: 'Drow Weapon Training',
            description:
              'You have proficiency with rapiers, shortswords, and hand crossbows.',
          },
        ],
        proficiencies: ['Rapier', 'Shortsword', 'Hand Crossbow'],
      },
    ],
    speed: 30,
    size: 'Medium',
  },

  // ── Half-Elf ───────────────────────────────────────────────────────────────
  {
    id: 'half-elf',
    name: 'Half-Elf',
    description:
      'Half-elves combine what some say are the best qualities of the elf and human races. They are charismatic and versatile, able to adapt to many situations.',
    abilityBonuses: [
      { ability: 'charisma', bonus: 2 },
      { ability: 'strength', bonus: 1 },
      { ability: 'dexterity', bonus: 1 },
    ],
    features: [
      {
        name: 'Darkvision',
        description:
          'Thanks to your elf blood, you have superior vision in dark and dim conditions. You can see in dim light within 12m as if it were bright light, and in darkness as if it were dim light.',
      },
      {
        name: 'Fey Ancestry',
        description:
          'You have advantage on saving throws against being charmed, and magic cannot put you to sleep.',
      },
      {
        name: 'Skill Versatility',
        description:
          'You gain proficiency in two skills of your choice.',
      },
    ],
    proficiencies: [],
    subraces: [],
    speed: 30,
    size: 'Medium',
  },

  // ── Half-Orc ───────────────────────────────────────────────────────────────
  {
    id: 'half-orc',
    name: 'Half-Orc',
    description:
      'Half-orcs are not uncommon in the Sword Coast. Their orcish heritage gives them strength and endurance, while their human side provides versatility.',
    abilityBonuses: [
      { ability: 'strength', bonus: 2 },
      { ability: 'constitution', bonus: 1 },
    ],
    features: [
      {
        name: 'Darkvision',
        description:
          'Thanks to your orc blood, you have superior vision in dark and dim conditions. You can see in dim light within 12m as if it were bright light, and in darkness as if it were dim light.',
      },
      {
        name: 'Relentless Endurance',
        description:
          'When you are reduced to 0 hit points but not killed outright, you drop to 1 hit point instead. You cannot use this feature again until you finish a long rest.',
      },
      {
        name: 'Savage Attacks',
        description:
          'When you score a critical hit with a melee weapon attack, you can roll one of the weapon\'s damage dice one additional time and add it to the extra damage of the critical hit.',
      },
    ],
    proficiencies: [],
    subraces: [],
    speed: 30,
    size: 'Medium',
  },

  // ── Halfling ───────────────────────────────────────────────────────────────
  {
    id: 'halfling',
    name: 'Halfling',
    description:
      'Halflings are an affable and cheerful people. Though they sometimes have a mischievous streak, they are creatures of comfort who enjoy the simple pleasures of life.',
    abilityBonuses: [{ ability: 'dexterity', bonus: 2 }],
    features: [
      {
        name: 'Lucky',
        description:
          'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.',
      },
      {
        name: 'Brave',
        description:
          'You have advantage on saving throws against being frightened.',
      },
      {
        name: 'Halfling Nimbleness',
        description:
          'You can move through the space of any creature that is of a size larger than yours.',
      },
    ],
    proficiencies: [],
    subraces: [
      {
        id: 'lightfoot-halfling',
        name: 'Lightfoot Halfling',
        description:
          'Lightfoot halflings are stealthier than their kin and can hide behind larger creatures, making them naturally gifted rogues.',
        abilityBonuses: [{ ability: 'charisma', bonus: 1 }],
        features: [
          {
            name: 'Naturally Stealthy',
            description:
              'You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'strongheart-halfling',
        name: 'Strongheart Halfling',
        description:
          'Strongheart halflings are hardier and more resilient than other halflings, with a strong resistance to poison.',
        abilityBonuses: [{ ability: 'constitution', bonus: 1 }],
        features: [
          {
            name: 'Stout Resilience',
            description:
              'You have advantage on saving throws against poison, and you have resistance against poison damage.',
          },
        ],
        proficiencies: [],
      },
    ],
    speed: 25,
    size: 'Small',
  },

  // ── Dwarf ──────────────────────────────────────────────────────────────────
  {
    id: 'dwarf',
    name: 'Dwarf',
    description:
      'Dwarves are bold and hardy, hailed as some of the greatest warriors and craftsmen in all the realms. They are fiercely loyal to their clans and their traditions.',
    abilityBonuses: [
      { ability: 'constitution', bonus: 2 },
    ],
    features: [
      {
        name: 'Darkvision',
        description:
          'Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 12m as if it were bright light, and in darkness as if it were dim light.',
      },
      {
        name: 'Dwarven Resilience',
        description:
          'You have advantage on saving throws against poison, and you have resistance against poison damage.',
      },
      {
        name: 'Stonecunning',
        description:
          'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check.',
      },
    ],
    proficiencies: [],
    subraces: [
      {
        id: 'gold-dwarf',
        name: 'Gold Dwarf',
        description:
          'Gold dwarves are known for their confidence and keen intuition. They are stockier and more muscular than other dwarves.',
        abilityBonuses: [{ ability: 'strength', bonus: 1 }],
        features: [
          {
            name: 'Dwarven Toughness',
            description:
              'Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.',
          },
          {
            name: 'Dwarven Combat Training',
            description:
              'You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.',
          },
        ],
        proficiencies: ['Battleaxe', 'Handaxe', 'Light Hammer', 'Warhammer'],
      },
      {
        id: 'shield-dwarf',
        name: 'Shield Dwarf',
        description:
          'Shield dwarves are the most common dwarves in the Sword Coast. They are proud and hold long grudges against their enemies.',
        abilityBonuses: [{ ability: 'strength', bonus: 1 }],
        features: [
          {
            name: 'Dwarven Armour Training',
            description:
              'You have proficiency with light and medium armour.',
          },
          {
            name: 'Dwarven Combat Training',
            description:
              'You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.',
          },
        ],
        proficiencies: [
          'Battleaxe',
          'Handaxe',
          'Light Hammer',
          'Warhammer',
          'Light Armour',
          'Medium Armour',
        ],
      },
    ],
    speed: 25,
    size: 'Medium',
  },

  // ── Gnome ──────────────────────────────────────────────────────────────────
  {
    id: 'gnome',
    name: 'Gnome',
    description:
      'Gnomes are a race of clever and curious people who prize intelligence and ingenuity above all. They are natural tinkerers and illusionists.',
    abilityBonuses: [{ ability: 'intelligence', bonus: 2 }],
    features: [
      {
        name: 'Darkvision',
        description:
          'Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 12m as if it were bright light, and in darkness as if it were dim light.',
      },
      {
        name: 'Gnome Cunning',
        description:
          'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.',
      },
    ],
    proficiencies: [],
    subraces: [
      {
        id: 'deep-gnome',
        name: 'Deep Gnome',
        description:
          'Deep gnomes, or svirfneblin, are reclusive denizens of the Underdark. They are hardy and stealthy survivors.',
        abilityBonuses: [{ ability: 'dexterity', bonus: 1 }],
        features: [
          {
            name: 'Superior Darkvision',
            description:
              'Your darkvision has a range of 36m instead of the standard 12m.',
          },
          {
            name: 'Stone Camouflage',
            description:
              'You have advantage on Dexterity (Stealth) checks made to hide in rocky terrain.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'forest-gnome',
        name: 'Forest Gnome',
        description:
          'Forest gnomes are curious and quick-witted. They have a natural gift for illusion and an innate bond with nature.',
        abilityBonuses: [{ ability: 'dexterity', bonus: 1 }],
        features: [
          {
            name: 'Natural Illusionist',
            description:
              'You know the Minor Illusion cantrip. Intelligence is your spellcasting ability for it.',
          },
          {
            name: 'Speak with Small Beasts',
            description:
              'Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'rock-gnome',
        name: 'Rock Gnome',
        description:
          'Rock gnomes are the most common gnomes in the Forgotten Realms. They are naturally inventive and excellent tinkerers.',
        abilityBonuses: [{ ability: 'constitution', bonus: 1 }],
        features: [
          {
            name: "Artificer's Lore",
            description:
              'Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, you can add twice your proficiency bonus.',
          },
          {
            name: 'Tinker',
            description:
              "You have proficiency with artisan's tools (tinker's tools). Using those tools, you can spend 1 hour and 10 gp worth of materials to construct a Tiny clockwork device.",
          },
        ],
        proficiencies: ["Tinker's Tools"],
      },
    ],
    speed: 25,
    size: 'Small',
  },

  // ── Tiefling ───────────────────────────────────────────────────────────────
  {
    id: 'tiefling',
    name: 'Tiefling',
    description:
      'Tieflings are a race touched by the infernal planes, bearing horns, tails, and other fiendish traits. They are mistrusted by many but possess an innate cunning and charm.',
    abilityBonuses: [
      { ability: 'charisma', bonus: 2 },
      { ability: 'intelligence', bonus: 1 },
    ],
    features: [
      {
        name: 'Darkvision',
        description:
          'Thanks to your infernal heritage, you have superior vision in dark and dim conditions. You can see in dim light within 12m as if it were bright light, and in darkness as if it were dim light.',
      },
      {
        name: 'Hellish Resistance',
        description:
          'You have resistance to fire damage.',
      },
      {
        name: 'Hellish Rebuke',
        description:
          'You can cast the Hellish Rebuke spell once per long rest as a 2nd-level spell. Charisma is your spellcasting ability for it.',
      },
    ],
    proficiencies: [],
    subraces: [],
    speed: 30,
    size: 'Medium',
  },

  // ── Githyanki ──────────────────────────────────────────────────────────────
  {
    id: 'githyanki',
    name: 'Githyanki',
    description:
      'Githyanki are a race of astral explorers who dwell in the liminal space between the Material Plane and the Astral Plane. Fierce and militaristic, they are born warriors and psionics.',
    abilityBonuses: [
      { ability: 'strength', bonus: 1 },
      { ability: 'intelligence', bonus: 1 },
    ],
    features: [
      {
        name: 'Astral Knowledge',
        description:
          'You gain proficiency in a skill of your choice, reflecting knowledge acquired on the Astral Plane.',
      },
      {
        name: 'Martial Prodigy',
        description:
          'You have proficiency with light and medium armour, as well as with shortswords, longswords, and greatswords.',
      },
      {
        name: 'Githyanki Psionics',
        description:
          'You know the Mage Hand cantrip. At 3rd level you can cast Jump once per long rest. At 5th level you can cast Misty Step once per long rest. Intelligence is your spellcasting ability for these.',
      },
    ],
    proficiencies: [
      'Light Armour',
      'Medium Armour',
      'Shortsword',
      'Longsword',
      'Greatsword',
    ],
    subraces: [],
    speed: 30,
    size: 'Medium',
  },

  // ── Dragonborn ─────────────────────────────────────────────────────────────
  {
    id: 'dragonborn',
    name: 'Dragonborn',
    description:
      'Dragonborn are a proud race descended from dragons. They bear the heritage of their draconic ancestors in their appearance and innate breath weapons.',
    abilityBonuses: [
      { ability: 'strength', bonus: 2 },
      { ability: 'charisma', bonus: 1 },
    ],
    features: [],
    proficiencies: [],
    subraces: [
      {
        id: 'black-dragonborn',
        name: 'Black Dragonborn',
        description:
          'Black dragonborn carry the heritage of black dragons, masters of swamp and marsh. Their acid breath corrodes all it touches.',
        abilityBonuses: [],
        features: [
          {
            name: 'Breath Weapon (Acid)',
            description:
              'You can use your action to exhale destructive energy in a 5m by 15m line. Creatures in the area must make a Dexterity saving throw (DC = 8 + your Constitution modifier + proficiency bonus), taking 2d6 acid damage on a failed save or half as much on a successful one. Damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. Recharges on a short or long rest.',
          },
          {
            name: 'Damage Resistance',
            description: 'You have resistance to acid damage.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'blue-dragonborn',
        name: 'Blue Dragonborn',
        description:
          'Blue dragonborn carry the heritage of blue dragons, lords of desert wastes. Their lightning breath is as swift and deadly as a storm.',
        abilityBonuses: [],
        features: [
          {
            name: 'Breath Weapon (Lightning)',
            description:
              'You can use your action to exhale destructive energy in a 5m by 15m line. Creatures in the area must make a Dexterity saving throw, taking 2d6 lightning damage on a failed save or half as much on a successful one. Damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. Recharges on a short or long rest.',
          },
          {
            name: 'Damage Resistance',
            description: 'You have resistance to lightning damage.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'brass-dragonborn',
        name: 'Brass Dragonborn',
        description:
          'Brass dragonborn carry the heritage of brass dragons, denizens of warm deserts. Their fiery breath reflects their sun-scorched lineage.',
        abilityBonuses: [],
        features: [
          {
            name: 'Breath Weapon (Fire)',
            description:
              'You can use your action to exhale destructive energy in a 5m by 15m line. Creatures in the area must make a Dexterity saving throw, taking 2d6 fire damage on a failed save or half as much on a successful one. Damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. Recharges on a short or long rest.',
          },
          {
            name: 'Damage Resistance',
            description: 'You have resistance to fire damage.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'bronze-dragonborn',
        name: 'Bronze Dragonborn',
        description:
          'Bronze dragonborn carry the heritage of bronze dragons, coastal guardians. Their lightning breath crackles with maritime fury.',
        abilityBonuses: [],
        features: [
          {
            name: 'Breath Weapon (Lightning)',
            description:
              'You can use your action to exhale destructive energy in a 5m by 15m line. Creatures in the area must make a Dexterity saving throw, taking 2d6 lightning damage on a failed save or half as much on a successful one. Damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. Recharges on a short or long rest.',
          },
          {
            name: 'Damage Resistance',
            description: 'You have resistance to lightning damage.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'copper-dragonborn',
        name: 'Copper Dragonborn',
        description:
          'Copper dragonborn carry the heritage of copper dragons, pranksters of hill and mountain. Their acid breath dissolves stone and flesh alike.',
        abilityBonuses: [],
        features: [
          {
            name: 'Breath Weapon (Acid)',
            description:
              'You can use your action to exhale destructive energy in a 5m by 15m line. Creatures in the area must make a Dexterity saving throw, taking 2d6 acid damage on a failed save or half as much on a successful one. Damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. Recharges on a short or long rest.',
          },
          {
            name: 'Damage Resistance',
            description: 'You have resistance to acid damage.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'gold-dragonborn',
        name: 'Gold Dragonborn',
        description:
          'Gold dragonborn carry the heritage of gold dragons, the most powerful metallic dragons. Their fire breath burns with righteous fury.',
        abilityBonuses: [],
        features: [
          {
            name: 'Breath Weapon (Fire)',
            description:
              'You can use your action to exhale destructive energy in a 5m cone. Creatures in the area must make a Dexterity saving throw, taking 2d6 fire damage on a failed save or half as much on a successful one. Damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. Recharges on a short or long rest.',
          },
          {
            name: 'Damage Resistance',
            description: 'You have resistance to fire damage.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'green-dragonborn',
        name: 'Green Dragonborn',
        description:
          'Green dragonborn carry the heritage of green dragons, cunning forest dwellers. Their poison gas breath is insidious and deadly.',
        abilityBonuses: [],
        features: [
          {
            name: 'Breath Weapon (Poison)',
            description:
              'You can use your action to exhale destructive energy in a 5m by 15m line. Creatures in the area must make a Constitution saving throw, taking 2d6 poison damage on a failed save or half as much on a successful one. Damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. Recharges on a short or long rest.',
          },
          {
            name: 'Damage Resistance',
            description: 'You have resistance to poison damage.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'red-dragonborn',
        name: 'Red Dragonborn',
        description:
          'Red dragonborn carry the heritage of red dragons, the most fearsome chromatic dragons. Their fire breath engulfs enemies in searing flames.',
        abilityBonuses: [],
        features: [
          {
            name: 'Breath Weapon (Fire)',
            description:
              'You can use your action to exhale destructive energy in a 5m cone. Creatures in the area must make a Dexterity saving throw, taking 2d6 fire damage on a failed save or half as much on a successful one. Damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. Recharges on a short or long rest.',
          },
          {
            name: 'Damage Resistance',
            description: 'You have resistance to fire damage.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'silver-dragonborn',
        name: 'Silver Dragonborn',
        description:
          'Silver dragonborn carry the heritage of silver dragons, noble protectors of the cold north. Their cold breath freezes all in its path.',
        abilityBonuses: [],
        features: [
          {
            name: 'Breath Weapon (Cold)',
            description:
              'You can use your action to exhale destructive energy in a 5m cone. Creatures in the area must make a Constitution saving throw, taking 2d6 cold damage on a failed save or half as much on a successful one. Damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. Recharges on a short or long rest.',
          },
          {
            name: 'Damage Resistance',
            description: 'You have resistance to cold damage.',
          },
        ],
        proficiencies: [],
      },
      {
        id: 'white-dragonborn',
        name: 'White Dragonborn',
        description:
          'White dragonborn carry the heritage of white dragons, the most feral of the chromatic dragons. Their icy breath chills to the bone.',
        abilityBonuses: [],
        features: [
          {
            name: 'Breath Weapon (Cold)',
            description:
              'You can use your action to exhale destructive energy in a 5m cone. Creatures in the area must make a Constitution saving throw, taking 2d6 cold damage on a failed save or half as much on a successful one. Damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. Recharges on a short or long rest.',
          },
          {
            name: 'Damage Resistance',
            description: 'You have resistance to cold damage.',
          },
        ],
        proficiencies: [],
      },
    ],
    speed: 30,
    size: 'Medium',
  },
];
