import { Tour } from '@/types';

export const tours: Tour[] = [
  {
    id: 'act-1-completionist',
    name: 'Act 1 Completionist',
    description: 'A comprehensive tour of everything Act 1 has to offer. This guide covers every major quest, secret area, notable item, and hidden encounter across the Wilderness, Underdark, and Mountain Pass before you move to Act 2.',
    act: 1,
    steps: [
      {
        description: 'Start at the Ravaged Beach. Loot the nautiloid wreckage thoroughly, grab the mind flayer body for the brain, and check the overgrown tunnel for hidden loot.',
        area: 'ravaged-beach',
        spoilerLevel: 0,
        tips: [
          'Don\'t miss the hidden chest near the water behind rocks.',
          'Us the Intellect Devourer can reappear later if freed.',
          'Check the Dank Cave for a unique ring.',
        ],
      },
      {
        description: 'Head to the Emerald Grove. Resolve the goblin attack at the gate, then speak with Zevlor and the tieflings.',
        area: 'emerald-grove',
        spoilerLevel: 0,
        tips: [
          'Recruit Wyll near the grove entrance.',
          'Talk to Nettie about the tadpole for healing options.',
          'Visit Arron the trader for early supplies.',
        ],
      },
      {
        description: 'Explore the inner Druid Grove. Investigate Kagha\'s plans, discover the shadow druid conspiracy, and consider freeing the prisoner.',
        area: 'druid-grove',
        spoilerLevel: 1,
        tips: [
          'Stealing the Idol of Silvanus triggers chaos — be prepared.',
          'Check the hidden panel room for shadow druid evidence.',
          'The sacred pool area has hidden loot behind the waterfall.',
        ],
      },
      {
        description: 'Travel to the Blighted Village. Rescue Barcus from the windmill, explore the necromancer\'s cellar, and find the stuffed bear.',
        area: 'blighted-village',
        spoilerLevel: 0,
        tips: [
          'The well leads to underground passages.',
          'Don\'t kill the ogres immediately — they can be allies.',
          'The blacksmith basement has a secret passage to a larger dungeon.',
        ],
      },
      {
        description: 'Investigate Auntie Ethel\'s lair in the swamp. Deal with the hag and rescue Mayrina if possible.',
        area: 'blighted-village',
        spoilerLevel: 1,
        tips: [
          'Bring fire damage for the hag fight.',
          'The hag offers powerful boons — weigh the moral cost.',
          'Disabling the masks frees her thralls.',
        ],
      },
      {
        description: 'Assault the Goblin Camp. Deal with all three leaders — Priestess Gut, Dror Ragzlin, and Minthara — and rescue Halsin.',
        area: 'goblin-camp',
        spoilerLevel: 1,
        tips: [
          'You can sneak in by pretending to be a True Soul.',
          'Free Volo from his cage for a unique reward later.',
          'The Defiled Temple has a moon puzzle with a hidden passage.',
          'Minthara can be recruited as a companion in Act 2 if spared.',
        ],
      },
      {
        description: 'Descend into the Underdark through the Whispering Depths or the hatch in the Blighted Village.',
        area: 'underdark',
        spoilerLevel: 0,
        tips: [
          'The myconid colony offers peaceful trading and a unique questline.',
          'The Spectator fight can be avoided with high Perception.',
          'Sovereign Spaw rewards you for helping the colony.',
          'The Underdark has multiple entry points — find them all.',
        ],
      },
      {
        description: 'Take the boat to Grymforge from the Underdark beach. Craft adamantine equipment at the legendary forge.',
        area: 'grymforge',
        spoilerLevel: 1,
        tips: [
          'Collect mithral ore from multiple locations in Grymforge.',
          'The Adamantine Forge requires specific steps — save before activating.',
          'Philomeen has runepowder that can be used later.',
          'Free Wulbren and the Ironhand gnomes from their cell.',
        ],
      },
      {
        description: 'Travel to the Mountain Pass. Visit the Rosymorn Monastery and the Githyanki Creche.',
        area: 'mountain-pass',
        spoilerLevel: 1,
        tips: [
          'The Blood of Lathander requires solving the stained glass puzzle.',
          'Your choices in the creche deeply affect Lae\'zel\'s storyline.',
          'The Githyanki Inquisitor is a tough fight — prepare accordingly.',
          'Check the monastery for hidden items behind locked doors.',
        ],
      },
      {
        description: 'Before leaving Act 1, ensure all companion quests are advanced. Check your journal for any incomplete tasks.',
        area: 'emerald-grove',
        spoilerLevel: 0,
        tips: [
          'Give Karlach\'s engine to Dammon for repair at the forge.',
          'Feed Gale at least one magical item to stabilize his orb.',
          'Resolve the grove situation before departing.',
          'Visit Withers to respec any party members.',
          'Some Act 1 areas become permanently inaccessible in Act 2.',
        ],
      },
    ],
    estimatedTime: '25-35 hours',
  },
  {
    id: 'new-player-essentials',
    name: 'New Player Essentials',
    description: 'The key things every new BG3 player should know and not miss. This guide covers essential mechanics, important early decisions, and critical path highlights across all three acts.',
    act: 1,
    steps: [
      {
        description: 'After escaping the nautiloid, explore the Ravaged Beach thoroughly. This area teaches you the basics of exploration, combat, and dialogue.',
        area: 'ravaged-beach',
        spoilerLevel: 0,
        tips: [
          'Talk to everyone — NPCs provide valuable information and quests.',
          'Use "Examine" on enemies to see their resistances and weaknesses.',
          'You can sneak and pickpocket. Try it on the mind flayer body.',
          'Save often, especially before dialogue choices.',
        ],
      },
      {
        description: 'Recruit your first companions. Astarion is on the beach, Shadowheart is nearby, Gale is by the roadside cliff, and Lae\'zel is northeast on a rock.',
        area: 'ravaged-beach',
        spoilerLevel: 0,
        tips: [
          'You can have up to 4 party members including yourself.',
          'Long rests at camp advance companion storylines — use them!',
          'Party composition matters: balance melee, ranged, and magic.',
          'You can swap companions at camp at any time.',
        ],
      },
      {
        description: 'Reach the Emerald Grove and deal with the goblin attack. This is your first major quest hub.',
        area: 'emerald-grove',
        spoilerLevel: 0,
        tips: [
          'Speak to Zevlor to understand the refugee situation.',
          'Recruit Wyll near the grove — he\'s a great warlock companion.',
          'The grove has trainers, a merchant, and quest givers.',
          'Don\'t rush to leave — there\'s much to discover here.',
        ],
      },
      {
        description: 'Understand thetadpole mechanic. You can use illithid powers without immediately turning into a mind flayer.',
        area: 'emerald-grove',
        spoilerLevel: 1,
        tips: [
          'Using tadpole powers grants unique abilities in dialogue and combat.',
          'There are hidden costs to embracing the tadpole fully.',
          'The dream visitor is tied to the tadpole storyline.',
          'You can find more tadpoles to consume throughout the game.',
        ],
      },
      {
        description: 'Learn the resting system. Short rests recover hit dice, long rests at camp fully restore your party and advance story.',
        area: 'emerald-grove',
        spoilerLevel: 0,
        tips: [
          'You get 2 short rests between long rests — use them wisely.',
          'Long rests don\'t advance time in most cases, so rest freely.',
          'Camp supplies are consumed on long rest — keep some food.',
          'Camp events (companion dialogue) trigger on long rests.',
        ],
      },
      {
        description: 'Explore the Blighted Village and surrounding wilderness for valuable loot and experience.',
        area: 'blighted-village',
        spoilerLevel: 0,
        tips: [
          'Save Barcus from the windmill for a unique ally later.',
          'Jump and climb to reach hidden areas on rooftops.',
          'The village has multiple secret passages and hidden rooms.',
          'Talk to NPCs before fighting — some encounters can be resolved peacefully.',
        ],
      },
      {
        description: 'Before tackling the Goblin Camp, make sure your party is around level 4 and well-equipped.',
        area: 'goblin-camp',
        spoilerLevel: 0,
        tips: [
          'Level 4-5 is recommended for the goblin camp.',
          'You can approach the camp peacefully by playing along as a True Soul.',
          'Each goblin leader requires a different strategy.',
          'Freeing Halsin early makes the camp fight much easier.',
        ],
      },
      {
        description: 'Don\'t miss the Underdark — it\'s entirely optional but contains incredible loot and story content.',
        area: 'underdark',
        spoilerLevel: 0,
        tips: [
          'The Underdark is accessible from multiple points in Act 1.',
          'The myconid colony is a peaceful hub with unique rewards.',
          'The Adamantine Forge in Grymforge crafts some of the best armor.',
          'Underdark content is balanced for level 4-6.',
        ],
      },
      {
        description: 'Key things to remember: loot everything, talk to everyone, and use environment in combat.',
        area: 'emerald-grove',
        spoilerLevel: 0,
        tips: [
          'Barrels and surfaces can be used as weapons in combat.',
          'Height advantage gives +2 to attack rolls.',
          'Dip weapons in surfaces (fire, poison) for bonus damage.',
          'Pressing Alt highlights interactable objects.',
          'Shove can push enemies off cliffs for instant kills.',
        ],
      },
      {
        description: 'In Act 2, the Shadow-Cursed Lands require special protection. Always carry a light source.',
        area: 'shadow-cursed-lands',
        spoilerLevel: 1,
        tips: [
          'Moonlanterns and pixie blessings protect you from the shadow curse.',
          'Last Light Inn is your hub in Act 2.',
          'Jaheira is a powerful ally — recruit her.',
          'Ketheric Thorm is the main antagonist. His invulnerability must be broken.',
        ],
      },
      {
        description: 'Act 3 in Baldur\'s Gate is massive. Take your time and explore every district thoroughly.',
        area: 'baldurs-gate-lower-city',
        spoilerLevel: 0,
        tips: [
          'The Lower City is packed with quests, shops, and secrets.',
          'Don\'t ignore the sewer entrances — major content lies below.',
          'Steel Watchers patrol the city and are very dangerous early on.',
          'Your companion quests reach their conclusions here — prioritize them.',
        ],
      },
    ],
    estimatedTime: 'Full playthrough guidance',
  },
];
