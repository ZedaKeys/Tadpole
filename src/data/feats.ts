import type { Feat } from '@/types';

export const feats: Feat[] = [
  {
    id: 'ability-improvement',
    name: 'Ability Improvement',
    description:
      'Increase one ability score of your choice by 2, or two ability scores of your choice by 1 each. You cannot increase an ability score above 20 using this feature.',
    isHalfFeat: false,
  },
  {
    id: 'alert',
    name: 'Alert',
    description:
      'Always on the lookout for danger, you gain a +5 bonus to initiative. You cannot be surprised while you are conscious.',
    isHalfFeat: false,
  },
  {
    id: 'athlete',
    name: 'Athlete',
    description:
      'You become more nimble and athletic. Increase your Strength or Dexterity by 1. When you are prone, standing up uses only 5 feet of movement. Climbing does not halve your speed. You can make a running long jump or high jump after moving only 5 feet.',
    isHalfFeat: true,
    abilityOptions: ['strength', 'dexterity'],
  },
  {
    id: 'actor',
    name: 'Actor',
    description:
      'Skilled at mimicry and dramatics, you gain the following benefits. Increase your Charisma by 1. You have advantage on Charisma (Deception) and Charisma (Performance) checks when trying to pass yourself off as a different person. You can mimic the speech of another person or the sounds made by other creatures.',
    isHalfFeat: true,
    abilityOptions: ['charisma'],
  },
  {
    id: 'charger',
    name: 'Charger',
    description:
      'When you use your action to Dash, you can use a bonus action to make one melee weapon attack or shove a creature. If you move at least 10 feet in a straight line immediately before taking this bonus action, you gain a +5 bonus to the damage roll or push the target up to 10 feet away.',
    isHalfFeat: false,
  },
  {
    id: 'crossbow-expert',
    name: 'Crossbow Expert',
    description:
      'You ignore the loading quality of crossbows with which you are proficient. Being within 5 feet of a hostile creature does not impose disadvantage on your ranged attack rolls. When you use the Attack action and attack with a one-handed weapon, you can use a bonus action to attack with a hand crossbow you are holding.',
    isHalfFeat: false,
  },
  {
    id: 'defensive-duellist',
    name: 'Defensive Duellist',
    description:
      'When you are wielding a finesse weapon with which you are proficient and another creature hits you with a melee attack, you can use your reaction to add your proficiency bonus to your AC for that attack, potentially causing it to miss.',
    isHalfFeat: false,
    prerequisites: 'Dexterity 13 or higher',
  },
  {
    id: 'dual-wielder',
    name: 'Dual Wielder',
    description:
      'You master fighting with two weapons. You gain a +1 bonus to AC while you are wielding a separate melee weapon in each hand. You can use two-weapon fighting even when the one-handed melee weapons you are wielding are not light. You can draw or stow two one-handed weapons when you would normally be able to draw or stow only one.',
    isHalfFeat: false,
  },
  {
    id: 'dungeon-delver',
    name: 'Dungeon Delver',
    description:
      'Alert to the hidden traps and secret doors found in many dungeons, you gain the following benefits. You have advantage on Wisdom (Perception) and Intelligence (Investigation) checks made to detect the presence of secret doors. You have advantage on saving throws made to avoid or resist traps. You have resistance to damage dealt by traps. You can search for traps while travelling at a normal pace.',
    isHalfFeat: false,
  },
  {
    id: 'durable',
    name: 'Durable',
    description:
      'Hardy and resilient, you gain the following benefits. Increase your Constitution by 1. When you roll a Hit Die to regain hit points, the minimum number of hit points you regain from the roll equals twice your Constitution modifier (minimum of 2).',
    isHalfFeat: true,
    abilityOptions: ['constitution'],
  },
  {
    id: 'elemental-adept-fire',
    name: 'Elemental Adept: Fire',
    description:
      'Spells you cast ignore resistance to fire damage. When you roll damage for a spell that deals fire damage, you can treat any 1 on a damage die as a 2.',
    isHalfFeat: false,
    prerequisites: 'Ability to cast at least one spell',
  },
  {
    id: 'elemental-adept-cold',
    name: 'Elemental Adept: Cold',
    description:
      'Spells you cast ignore resistance to cold damage. When you roll damage for a spell that deals cold damage, you can treat any 1 on a damage die as a 2.',
    isHalfFeat: false,
    prerequisites: 'Ability to cast at least one spell',
  },
  {
    id: 'elemental-adept-lightning',
    name: 'Elemental Adept: Lightning',
    description:
      'Spells you cast ignore resistance to lightning damage. When you roll damage for a spell that deals lightning damage, you can treat any 1 on a damage die as a 2.',
    isHalfFeat: false,
    prerequisites: 'Ability to cast at least one spell',
  },
  {
    id: 'elemental-adept-thunder',
    name: 'Elemental Adept: Thunder',
    description:
      'Spells you cast ignore resistance to thunder damage. When you roll damage for a spell that deals thunder damage, you can treat any 1 on a damage die as a 2.',
    isHalfFeat: false,
    prerequisites: 'Ability to cast at least one spell',
  },
  {
    id: 'great-weapon-master',
    name: 'Great Weapon Master',
    description:
      'You have learned to put your weight behind a devastating strike. Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the damage. On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one extra melee attack as a bonus action.',
    isHalfFeat: false,
  },
  {
    id: 'heavy-armor-master',
    name: 'Heavy Armor Master',
    description:
      'Increase your Strength by 1. While you are wearing heavy armor, bludgeoning, piercing, and slashing damage that you take from nonmagical weapons is reduced by 3.',
    isHalfFeat: true,
    abilityOptions: ['strength'],
    prerequisites: 'Proficiency with heavy armor',
  },
  {
    id: 'heavily-armored',
    name: 'Heavily Armored',
    description:
      'You have trained to master the use of heavy armor. Increase your Strength by 1. You gain proficiency with heavy armor.',
    isHalfFeat: true,
    abilityOptions: ['strength'],
    prerequisites: 'Proficiency with medium armor',
  },
  {
    id: 'insightful-manipulator',
    name: 'Insightful Manipulator',
    description:
      'You have learned to read people with uncanny accuracy. Increase your Intelligence by 1. After spending 1 minute observing a creature outside combat, you learn whether the creature is your superior, equal, or inferior in two of the following: Intelligence, Wisdom, Charisma, or overall combat ability.',
    isHalfFeat: true,
    abilityOptions: ['intelligence'],
  },
  {
    id: 'lucky',
    name: 'Lucky',
    description:
      'You have inexplicable luck that seems to kick in at just the right moment. You have 3 luck points. Whenever you make an attack roll, ability check, or saving throw, you can spend one luck point to roll an additional d20. You can choose to spend one of your luck points after you roll the die, but before the outcome is determined.',
    isHalfFeat: false,
  },
  {
    id: 'mage-slayer',
    name: 'Mage Slayer',
    description:
      'You have practiced techniques useful in melee combat against spellcasters. When a creature within 5 feet of you casts a spell, you can use your reaction to make a melee weapon attack against that creature. When you damage a creature that is concentrating on a spell, that creature has disadvantage on the saving throw it makes to maintain concentration. You have advantage on saving throws against spells cast by creatures within 5 feet of you.',
    isHalfFeat: false,
  },
  {
    id: 'magic-initiate',
    name: 'Magic Initiate',
    description:
      'Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard. You learn two cantrips of your choice from that class. In addition, choose one 1st-level spell from that class. You learn that spell and can cast it at its lowest level. Once you cast it, you must finish a long rest before you can cast it again. Your spellcasting ability for these spells depends on the class you chose.',
    isHalfFeat: false,
  },
  {
    id: 'medium-armor-master',
    name: 'Medium Armor Master',
    description:
      'You have practiced moving in medium armor to gain the following benefits. Wearing medium armor does not impose disadvantage on your Dexterity (Stealth) checks. When you wear medium armor, you can add 3 rather than 2 to your AC if you have a Dexterity of 16 or higher.',
    isHalfFeat: false,
    prerequisites: 'Proficiency with medium armor',
  },
  {
    id: 'moderately-armored',
    name: 'Moderately Armored',
    description:
      'Increase your Strength or Dexterity by 1. You gain proficiency with medium armor and shields.',
    isHalfFeat: true,
    abilityOptions: ['strength', 'dexterity'],
    prerequisites: 'Proficiency with light armor',
  },
  {
    id: 'mounted-combatant',
    name: 'Mounted Combatant',
    description:
      'You are a dangerous foe to face while mounted. While you are mounted and are not incapacitated, you have advantage on melee attack rolls against any unmounted creature that is smaller than your mount. You can force an attack targeted at your mount to target you instead. If your mount is subjected to an effect that allows a Dexterity saving throw for half damage, it takes no damage on a success and half damage on a failure.',
    isHalfFeat: false,
  },
  {
    id: 'observant',
    name: 'Observant',
    description:
      'Quick to notice details, you gain the following benefits. Increase your Intelligence or Wisdom by 1. If you can see a creature casting a spell, you can identify the spell. You can read lips.',
    isHalfFeat: true,
    abilityOptions: ['intelligence', 'wisdom'],
  },
  {
    id: 'polearm-master',
    name: 'Polearm Master',
    description:
      'You can keep enemies at bay with reach weapons. While you are wielding a glaive, halberd, pike, or quarterstaff, other creatures provoke an opportunity attack from you when they enter your reach. When you take the Attack action and attack with only a glaive, halberd, pike, or quarterstaff, you can use a bonus action to make a melee attack with the opposite end of the weapon.',
    isHalfFeat: false,
  },
  {
    id: 'resilient',
    name: 'Resilient',
    description:
      'Choose one ability score. Increase the chosen ability score by 1. You gain proficiency in saving throws using the chosen ability.',
    isHalfFeat: true,
    abilityOptions: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
  },
  {
    id: 'ritual-caster',
    name: 'Ritual Caster',
    description:
      'You have learned a number of spells that you can cast as rituals. Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard. You acquire a ritual book holding two 1st-level spells of your choice from that class. If you come across a spell in written form, you can add it to the book if the spell is on the chosen class spell list and of a level for which you have spell slots.',
    isHalfFeat: false,
    prerequisites: 'Intelligence or Wisdom 13 or higher',
  },
  {
    id: 'savage-attacker',
    name: 'Savage Attacker',
    description:
      'Once per turn when you roll damage for a melee weapon attack, you can reroll the weapon damage dice and use either total.',
    isHalfFeat: false,
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    description:
      'You have mastered techniques to take advantage of every drop in any enemy guard. When you hit a creature with an opportunity attack, the creature speed becomes 0 for the rest of the turn. Creatures provoke opportunity attacks from you even if they take the Disengage action before leaving your reach. When a creature within 5 feet of you makes an attack against a target other than you, you can use your reaction to make a melee weapon attack against the attacking creature.',
    isHalfFeat: false,
  },
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description:
      'You have mastered ranged weapons and can make shots that others find impossible. Attacking at long range does not impose disadvantage on your ranged weapon attack rolls. Your ranged weapon attacks ignore half cover and three-quarters cover. Before you make an attack with a ranged weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack damage.',
    isHalfFeat: false,
  },
  {
    id: 'shield-master',
    name: 'Shield Master',
    description:
      'You use shields not just for protection but also for offense. You gain the following benefits while wielding a shield. If you take the Attack action on your turn, you can use a bonus action to try to shove a creature within 5 feet with your shield. If you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you can use your reaction to take no damage if you succeed on the saving throw.',
    isHalfFeat: false,
  },
  {
    id: 'skilled',
    name: 'Skilled',
    description:
      'You gain proficiency in any combination of three skills or tools of your choice.',
    isHalfFeat: false,
  },
  {
    id: 'skulker',
    name: 'Skulker',
    description:
      'You are expert at slinking through shadows. You can try to hide when you are lightly obscured from the creature from which you are hiding. When you are hidden from a creature and miss it with a ranged weapon attack, making the attack does not reveal your position. Dim light does not impose disadvantage on your Wisdom (Perception) checks.',
    isHalfFeat: false,
    prerequisites: 'Dexterity 13 or higher',
  },
  {
    id: 'spell-sniper',
    name: 'Spell Sniper',
    description:
      'You have learned techniques to enhance your attacks with certain kinds of spells. Choose a type of spell: ray or line. When you cast a spell of that type that requires you to make an attack roll, the spell range is doubled. You ignore half and three-quarters cover against targets. You learn one cantrip that requires an attack roll from the spell list of a class you choose.',
    isHalfFeat: false,
    prerequisites: 'Ability to cast at least one spell',
  },
  {
    id: 'tavern-brawler',
    name: 'Tavern Brawler',
    description:
      'Accustomed to rough-and-tumble fighting, you gain the following benefits. Increase your Strength or Constitution by 1. You are proficient with improvised weapons. Your unarmed strike uses a d4 for damage. When you hit a creature with an unarmed strike or an improvised weapon on your turn, you can use a bonus action to attempt to grapple the target.',
    isHalfFeat: true,
    abilityOptions: ['strength', 'constitution'],
  },
  {
    id: 'tough',
    name: 'Tough',
    description:
      'Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points.',
    isHalfFeat: false,
  },
  {
    id: 'war-caster',
    name: 'War Caster',
    description:
      'You have practiced casting spells in the midst of combat, gaining the following benefits. You have advantage on Constitution saving throws that you make to maintain your concentration on a spell when you take damage. You can perform the somatic components of spells even when you have weapons or a shield in one or both hands. When a hostile creature provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature.',
    isHalfFeat: false,
    prerequisites: 'Ability to cast at least one spell',
  },
  {
    id: 'weapon-master',
    name: 'Weapon Master',
    description:
      'You have practiced extensively with a variety of weapons, gaining the following benefits. Increase your Strength or Dexterity by 1. You gain proficiency with four weapons of your choice.',
    isHalfFeat: true,
    abilityOptions: ['strength', 'dexterity'],
  },
];
