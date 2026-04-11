import { Quest } from '@/types';

export const quests: Quest[] = [
  {
    id: 'escape-the-nautiloid',
    name: 'Escape the Nautiloid',
    act: 1,
    description: 'Awaken aboard a Mind Flayer nautiloid ship as it flies through the Hells. You must find a way to escape before the ship crashes.',
    status: 'active',
    steps: [
      { description: 'Wake up in the mind flayer pod and free yourself', spoilerLevel: 0 },
      { description: 'Navigate through the nautiloid and find the helm', spoilerLevel: 0 },
      { description: 'Rescue Shadowheart from her pod', spoilerLevel: 0 },
      { description: 'Reach the transponder and use it to steer the ship', spoilerLevel: 1 },
      { description: 'Escape before the nautiloid crashes', spoilerLevel: 0 },
    ],
    decisions: [
      {
        question: 'Do you free Us, the Intellect Devourer, from its cage?',
        options: [
          {
            label: 'Free Us',
            consequence: 'Us joins you as an ally for the rest of the nautiloid and can be found again later in the game.',
            spoilerLevel: 1,
            companionReactions: [{ companion: 'shadowheart', delta: 0 }],
          },
          {
            label: 'Leave Us in the cage',
            consequence: 'Us dies in the crash. You can still find Us later under different circumstances.',
            spoilerLevel: 2,
          },
        ],
      },
    ],
    relatedCompanions: ['shadowheart', 'laezel'],
    relatedAreas: ['ravaged-beach'],
  },
  {
    id: 'save-the-grove',
    name: 'Save the Grove',
    act: 1,
    description: 'The Emerald Grove is under siege by a goblin army worshipping someone called the Absolute. The tiefling refugees sheltering there are in grave danger.',
    status: 'active',
    steps: [
      { description: 'Arrive at the Emerald Grove and witness the goblin attack', spoilerLevel: 0 },
      { description: 'Speak with Zevlor and the tiefling refugees', spoilerLevel: 0 },
      { description: 'Decide whether to side with the druids or the tieflings', spoilerLevel: 1 },
      { description: 'Deal with the goblin threat at the Goblin Camp', spoilerLevel: 1 },
      { description: 'Resolve the Kagha situation and the shadow druids', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'How do you handle the ritual Kagha is performing to seal the grove?',
        options: [
          {
            label: 'Stop Kagha and expose the shadow druids',
            consequence: 'The grove remains open. The tieflings are safe. Kagha is removed from power.',
            spoilerLevel: 2,
            companionReactions: [
              { companion: 'halsin', delta: 5 },
              { companion: 'wyll', delta: 3 },
              { companion: 'karlach', delta: 3 },
            ],
          },
          {
            label: 'Side with Kagha and seal the grove',
            consequence: 'The tiefling refugees are expelled. Many die on the road. The grove is sealed.',
            spoilerLevel: 2,
            companionReactions: [
              { companion: 'wyll', delta: -10 },
              { companion: 'karlach', delta: -10 },
              { companion: 'gale', delta: -5 },
            ],
          },
          {
            label: 'Kill Kagha outright',
            consequence: 'The druids turn hostile unless you can prove the shadow druid conspiracy. The grove descends into chaos.',
            spoilerLevel: 2,
          },
        ],
      },
    ],
    relatedCompanions: ['halsin', 'wyll', 'karlach', 'shadowheart'],
    relatedAreas: ['emerald-grove', 'druid-grove', 'goblin-camp'],
  },
  {
    id: 'find-the-healer',
    name: 'Find the Healer',
    act: 1,
    description: 'With a mind flayer tadpole wriggling in your brain, you need to find a healer who can remove it before you undergo ceremorphosis.',
    status: 'active',
    steps: [
      { description: 'Learn about the tadpole from the dream visitor', spoilerLevel: 0 },
      { description: 'Seek out Father Lorgan at the Grove for healing advice', spoilerLevel: 0 },
      { description: 'Investigate the肟 parasite and its strange powers', spoilerLevel: 1 },
      { description: 'Meet with Nettie the druid healer', spoilerLevel: 0 },
      { description: 'Decide whether to trust the dream visitor or seek another cure', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'Nettie offers you a poisoned beverage to prevent ceremorphosis. What do you do?',
        options: [
          {
            label: 'Drink it willingly',
            consequence: 'You take poison damage. Nettie gives you a salve to slow the tadpole but you must promise to end yourself if you turn.',
            spoilerLevel: 1,
          },
          {
            label: 'Refuse and persuade her to help honestly',
            consequence: 'Nettie provides genuine aid and information about the tadpole.',
            spoilerLevel: 1,
            companionReactions: [{ companion: 'shadowheart', delta: 2 }],
          },
          {
            label: 'Attack Nettie',
            consequence: 'The druids in the grove turn hostile. You lose access to Nettie as a resource.',
            spoilerLevel: 2,
          },
        ],
      },
    ],
    relatedCompanions: ['shadowheart', 'laezel', 'gale'],
    relatedAreas: ['emerald-grove', 'druid-grove'],
  },
  {
    id: 'the-pale-elf',
    name: 'The Pale Elf',
    act: 1,
    description: 'You discover Astarion, a pale elven rogue, hiding in the woods near the beach. He has his own secrets and a powerful vampire master hunting him.',
    status: 'active',
    steps: [
      { description: 'Encounter Astarion on the road near the Ravaged Beach', spoilerLevel: 0 },
      { description: 'Discover Astarion is a vampire spawn', spoilerLevel: 1 },
      { description: 'Learn about his master Cazador Szarr', spoilerLevel: 1 },
      { description: 'Help Astarion confront his past', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'Astarion asks you to let him drink your blood. How do you respond?',
        options: [
          {
            label: 'Allow him to feed',
            consequence: 'Astarion gains temporary power. Your relationship deepens but you take damage.',
            spoilerLevel: 1,
            companionReactions: [{ companion: 'astarion', delta: 5 }],
          },
          {
            label: 'Refuse',
            consequence: 'Astarion respects your boundary but is disappointed.',
            spoilerLevel: 0,
            companionReactions: [{ companion: 'astarion', delta: -2 }],
          },
        ],
      },
    ],
    relatedCompanions: ['astarion'],
    relatedAreas: ['ravaged-beach', 'blighted-village', 'baldurs-gate-upper-city'],
  },
  {
    id: 'shadowhearts-artifact',
    name: "Shadowheart's Artifact",
    act: 1,
    description: 'Shadowheart carries a mysterious artifact she rescued from the nautiloid. It seems to be connected to a dark power and holds secrets she herself may not fully understand.',
    status: 'active',
    steps: [
      { description: 'Notice Shadowheart clutching a strange artifact', spoilerLevel: 0 },
      { description: 'Ask Shadowheart about the artifact and her mission', spoilerLevel: 1 },
      { description: 'Discover the artifact is connected to Shar', spoilerLevel: 2 },
      { description: 'Learn the true nature of the prism artifact', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'Do you press Shadowheart for details about her mission and artifact?',
        options: [
          {
            label: 'Respect her privacy',
            consequence: 'Shadowheart appreciates your patience. She opens up more over time.',
            spoilerLevel: 0,
            companionReactions: [{ companion: 'shadowheart', delta: 3 }],
          },
          {
            label: 'Demand answers',
            consequence: 'Shadowheart becomes defensive. She reveals fragments but resents the pressure.',
            spoilerLevel: 1,
            companionReactions: [{ companion: 'shadowheart', delta: -3 }],
          },
        ],
      },
    ],
    relatedCompanions: ['shadowheart'],
    relatedAreas: ['emerald-grove', 'shadow-cursed-lands', 'baldurs-gate-lower-city'],
  },
  {
    id: 'karlachs-infernal-engine',
    name: "Karlach's Infernal Engine",
    act: 1,
    description: 'Karlach was an enslaved soldier in the Blood War in Avernus. Her heart was replaced with an infernal engine that runs hot with rage and needs cooling. She seeks revenge against those who wronged her.',
    status: 'active',
    steps: [
      { description: 'Find Karlach near the river north of the Goblin Camp', spoilerLevel: 0 },
      { description: 'Learn about her infernal engine and her time in the Hells', spoilerLevel: 0 },
      { description: 'Help her get revenge on the paladins of Tyr hunting her', spoilerLevel: 1 },
      { description: 'Seek ways to repair or cool her engine', spoilerLevel: 1 },
      { description: 'Decide her fate regarding the infernal engine', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'The paladins of Tyr demand you hand Karlach over. What do you do?',
        options: [
          {
            label: 'Side with Karlach and fight the paladins',
            consequence: 'You kill the false paladins. Karlach joins your party with deep gratitude.',
            spoilerLevel: 1,
            companionReactions: [
              { companion: 'karlach', delta: 10 },
              { companion: 'wyll', delta: 5 },
            ],
          },
          {
            label: 'Side with the paladins against Karlach',
            consequence: 'You must fight Karlach. She is permanently killed or driven away.',
            spoilerLevel: 2,
            companionReactions: [{ companion: 'karlach', delta: -100 }],
          },
        ],
      },
    ],
    relatedCompanions: ['karlach', 'wyll'],
    relatedAreas: ['ravaged-beach', 'baldurs-gate-lower-city'],
  },
  {
    id: 'wylls-pact',
    name: "Wyll's Pact",
    act: 1,
    description: 'Wyll, the Blade of Frontiers, made a warlock pact with a devil named Mizora. His father is the Grand Duke of Baldur\'s Gate, and his pact has consequences that ripple far beyond his personal choices.',
    status: 'active',
    steps: [
      { description: 'Recruit Wyll at the Emerald Grove', spoilerLevel: 0 },
      { description: 'Learn about Wyll\'s pact with Mizora', spoilerLevel: 1 },
      { description: 'Help Wyll with Mizora\'s demands in the Goblin Camp', spoilerLevel: 1 },
      { description: 'Discover Wyll\'s father is Grand Duke Ravengard', spoilerLevel: 1 },
      { description: 'Confront Mizora about the terms of the pact', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'Mizora demands you kill Karlach as part of Wyll\'s pact. What do you do?',
        options: [
          {
            label: 'Refuse to kill Karlach and spare her',
            consequence: 'Wyll\'s pact is altered. Mizora punishes Wyll by transforming his appearance. Karlach lives.',
            spoilerLevel: 2,
            companionReactions: [
              { companion: 'wyll', delta: 5 },
              { companion: 'karlach', delta: 5 },
            ],
          },
          {
            label: 'Attempt to kill Karlach',
            consequence: 'You must fight Karlach. If she dies, Wyll fulfills his pact but at great moral cost.',
            spoilerLevel: 2,
            companionReactions: [{ companion: 'karlach', delta: -100 }],
          },
        ],
      },
    ],
    relatedCompanions: ['wyll', 'karlach'],
    relatedAreas: ['emerald-grove', 'moonrise-towers', 'baldurs-gate-lower-city'],
  },
  {
    id: 'halsins-quest',
    name: "Halsin's Quest",
    act: 1,
    description: 'Archdruid Halsin of the Emerald Grove has gone missing while investigating the goblin threat. He was last seen heading to the Goblin Camp to confront the leaders of the Absolute cult.',
    status: 'active',
    steps: [
      { description: 'Learn of Halsin\'s disappearance from the grove', spoilerLevel: 0 },
      { description: 'Travel to the Goblin Camp to find him', spoilerLevel: 0 },
      { description: 'Discover Halsin is trapped in bear form in the goblin pens', spoilerLevel: 1 },
      { description: 'Free Halsin and help him defeat the goblin leaders', spoilerLevel: 1 },
      { description: 'Convince Halsin to join your camp and help with the tadpole', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'How do you approach the goblin leaders?',
        options: [
          {
            label: 'Sneak in and assassinate the leaders one by one',
            consequence: 'A stealthy approach minimizes collateral damage but requires careful planning.',
            spoilerLevel: 1,
            companionReactions: [{ companion: 'astarion', delta: 3 }],
          },
          {
            label: 'Confront all three leaders openly',
            consequence: 'A bold frontal assault. Very dangerous but direct.',
            spoilerLevel: 1,
            companionReactions: [
              { companion: 'laezel', delta: 3 },
              { companion: 'karlach', delta: 3 },
            ],
          },
          {
            label: 'Infiltrate by pretending to worship the Absolute',
            consequence: 'You gain access to the inner sanctum. You can betray the cult from within.',
            spoilerLevel: 2,
            companionReactions: [{ companion: 'shadowheart', delta: 2 }],
          },
        ],
      },
    ],
    relatedCompanions: ['halsin'],
    relatedAreas: ['emerald-grove', 'goblin-camp'],
  },
  {
    id: 'the-paranoid-stuffed-bear',
    name: 'The Paranoid Stuffed Bear',
    act: 1,
    description: 'A mysterious stuffed bear in the blighted village seems to be watching you. It may hold a darker secret than its button eyes suggest.',
    status: 'active',
    steps: [
      { description: 'Discover the stuffed bear in the Blighted Village', spoilerLevel: 0 },
      { description: 'Notice the bear seems to move when you are not looking', spoilerLevel: 0 },
      { description: 'Investigate the bear and its connection to the nearby cellar', spoilerLevel: 1 },
      { description: 'Uncover the truth behind the bear\'s nature', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'The bear seems alive. What do you do with it?',
        options: [
          {
            label: 'Investigate further and speak with it',
            consequence: 'You discover the bear is connected to a polymorphed individual or entity.',
            spoilerLevel: 2,
          },
          {
            label: 'Leave it alone',
            consequence: 'You miss out on the mystery but avoid potential danger.',
            spoilerLevel: 0,
          },
        ],
      },
    ],
    relatedCompanions: ['gale', 'astarion'],
    relatedAreas: ['blighted-village'],
  },
  {
    id: 'help-the-hag-survivors',
    name: 'Help the Hag Survivors',
    act: 1,
    description: 'Several people in the region have fallen victim to a mysterious hag. Survivors need your help to recover from their ordeal and stop her from claiming more victims.',
    status: 'active',
    steps: [
      { description: 'Learn about the hag from survivors in the area', spoilerLevel: 0 },
      { description: 'Investigate the hag\'s lair beneath the Blighted Village', spoilerLevel: 1 },
      { description: 'Confront Auntie Ethel the hag', spoilerLevel: 1 },
      { description: 'Rescue Mayrina from the hag\'s clutches', spoilerLevel: 2 },
      { description: 'Decide what to do with the hag and her deals', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'Auntie Ethel offers you a powerful boon in exchange for letting her keep Mayrina. What do you do?',
        options: [
          {
            label: 'Accept the deal and take the boon',
            consequence: 'You gain a permanent buff but Mayrina suffers a terrible fate.',
            spoilerLevel: 2,
            companionReactions: [
              { companion: 'astarion', delta: 2 },
              { companion: 'wyll', delta: -5 },
              { companion: 'karlach', delta: -5 },
            ],
          },
          {
            label: 'Refuse and fight the hag to save Mayrina',
            consequence: 'A tough battle. If you win, Mayrina is saved. The hag may escape to return later.',
            spoilerLevel: 2,
            companionReactions: [
              { companion: 'karlach', delta: 3 },
              { companion: 'wyll', delta: 3 },
            ],
          },
        ],
      },
    ],
    relatedCompanions: ['astarion', 'shadowheart', 'wyll'],
    relatedAreas: ['blighted-village', 'baldurs-gate-lower-city'],
  },
  {
    id: 'infiltrate-moonrise-towers',
    name: 'Infiltrate Moonrise Towers',
    act: 2,
    description: 'Moonrise Towers is the seat of the Absolute\'s power in the Shadow-Cursed Lands. You must find a way inside to learn the truth about the cult and rescue those imprisoned within.',
    status: 'active',
    steps: [
      { description: 'Arrive at the Shadow-Cursed Lands and seek shelter at Last Light Inn', spoilerLevel: 0 },
      { description: 'Find a way past the shadow curse', spoilerLevel: 1 },
      { description: 'Infiltrate Moonrise Towers', spoilerLevel: 1 },
      { description: 'Gather intelligence on the Absolute cult leadership', spoilerLevel: 2 },
      { description: 'Free the prisoners in the towers', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'How do you gain entry to Moonrise Towers?',
        options: [
          {
            label: 'Disguise yourself as a True Soul',
            consequence: 'You walk right through the front door. The tadpole lets you blend in with the cultists.',
            spoilerLevel: 1,
          },
          {
            label: 'Sneak through the underbelly via the Waning Moon',
            consequence: 'A stealthier route through the prison level. Risky but less direct confrontation.',
            spoilerLevel: 2,
          },
          {
            label: 'Attack head-on',
            consequence: 'Direct assault is extremely dangerous due to the number of cultists and the general\'s power.',
            spoilerLevel: 2,
          },
        ],
      },
    ],
    relatedCompanions: ['shadowheart', 'laezel', 'wyll', 'halsin'],
    relatedAreas: ['shadow-cursed-lands', 'last-light-inn', 'moonrise-towers'],
  },
  {
    id: 'free-nightsong',
    name: 'Free Nightsong',
    act: 2,
    description: 'The Nightsong is a prisoner held deep beneath Moonrise Towers. Shadowheart has been tasked by her Shar cult to kill the Nightsong. The truth about this captive will shake your entire party.',
    status: 'active',
    steps: [
      { description: 'Learn about the Nightsong from various sources', spoilerLevel: 0 },
      { description: 'Descend into the Shadowfell beneath Moonrise Towers', spoilerLevel: 1 },
      { description: 'Find the Nightsong imprisoned in the Shar temple', spoilerLevel: 2 },
      { description: 'Confront the truth about the Nightsong\'s identity', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'Shadowheart is commanded to kill the Nightsong. Do you encourage her to follow through?',
        options: [
          {
            label: 'Tell Shadowheart to spare the Nightsong',
            consequence: 'Shadowheart begins to question her devotion to Shar. The Nightsong is freed and becomes a powerful ally.',
            spoilerLevel: 2,
            companionReactions: [{ companion: 'shadowheart', delta: 10 }],
          },
          {
            label: 'Tell Shadowheart to kill the Nightsong',
            consequence: 'Shadowheart fully embraces Shar and becomes a Dark Justiciar. The Nightsong dies. Ketheric cannot be weakened.',
            spoilerLevel: 2,
            companionReactions: [{ companion: 'shadowheart', delta: -5 }],
          },
        ],
      },
    ],
    relatedCompanions: ['shadowheart'],
    relatedAreas: ['moonrise-towers', 'shadow-cursed-lands'],
  },
  {
    id: 'avenge-the-ironhand',
    name: 'Avenge the Ironhand',
    act: 1,
    description: 'Wulbren Bongle and his fellow Ironhand Gnomes have been captured. They need rescue from the forces that threaten them.',
    status: 'active',
    steps: [
      { description: 'Learn about the captured Ironhand Gnomes', spoilerLevel: 0 },
      { description: 'Find where the gnomes are being held', spoilerLevel: 1 },
      { description: 'Free Wulbren and his companions', spoilerLevel: 2 },
      { description: 'Help the gnomes reach safety', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'Wulbren asks for your help in their escape. Do you prioritize stealth or speed?',
        options: [
          {
            label: 'Plan a careful stealthy escape',
            consequence: 'Fewer casualties but the escape takes longer and requires more planning.',
            spoilerLevel: 1,
          },
          {
            label: 'Break out with force',
            consequence: 'Faster but riskier. Some gnomes may not survive the escape.',
            spoilerLevel: 2,
          },
        ],
      },
    ],
    relatedCompanions: ['karlach', 'wyll'],
    relatedAreas: ['goblin-camp', 'moonrise-towers'],
  },
  {
    id: 'find-the-blood-of-lathander',
    name: 'Find the Blood of Lathander',
    act: 1,
    description: 'A legendary mace forged with the power of the sun god Lathander lies hidden in a githyanki creche. Finding it requires cunning and courage.',
    status: 'active',
    steps: [
      { description: 'Learn about the Blood of Lathander from various sources', spoilerLevel: 0 },
      { description: 'Reach the Githyanki Creche in the Mountain Pass', spoilerLevel: 0 },
      { description: 'Navigate the creche and its trials', spoilerLevel: 1 },
      { description: 'Solve the puzzles guarding the legendary weapon', spoilerLevel: 2 },
      { description: 'Claim the Blood of Lathander', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'The inquisitor challenges you for the artifact. How do you respond?',
        options: [
          {
            label: 'Fight the inquisitor for the mace',
            consequence: 'A difficult battle. Victory earns you the legendary weapon but makes the creche hostile.',
            spoilerLevel: 2,
          },
          {
            label: 'Attempt diplomacy with Vlaakith',
            consequence: 'You may gain access peacefully depending on your prior choices, but Vlaakith\'s favor is fickle.',
            spoilerLevel: 2,
          },
        ],
      },
    ],
    relatedCompanions: ['laezel', 'shadowheart'],
    relatedAreas: ['mountain-pass'],
  },
  {
    id: 'save-aylin',
    name: 'Save Aylin',
    act: 2,
    description: 'The aasimar Aylin, daughter of Selune, has been imprisoned and used as an immortal battery by Ketheric Thorm. Freeing her is key to breaking his invulnerability.',
    status: 'active',
    steps: [
      { description: 'Learn about Ketheric\'s immortality and its source', spoilerLevel: 1 },
      { description: 'Discover the Nightsong is Aylin, daughter of Selune', spoilerLevel: 2 },
      { description: 'Free Aylin from her prison in the Shar temple', spoilerLevel: 2 },
      { description: 'Help Aylin confront Ketheric Thorm', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'Aylin offers to sacrifice herself to weaken Ketheric. Do you let her?',
        options: [
          {
            label: 'Refuse the sacrifice and find another way',
            consequence: 'Aylin lives and fights alongside you. You must find another way to break Ketheric\'s invulnerability.',
            spoilerLevel: 2,
          },
          {
            label: 'Accept Aylin\'s sacrifice',
            consequence: 'Aylin gives her life to strip Ketheric of his immortality. A tragic but effective choice.',
            spoilerLevel: 2,
          },
        ],
      },
    ],
    relatedCompanions: ['shadowheart'],
    relatedAreas: ['moonrise-towers', 'shadow-cursed-lands'],
  },
  {
    id: 'the-grand-design',
    name: 'The Grand Design',
    act: 3,
    description: 'The true scope of the Absolute\'s plan is revealed. The Netherbrain seeks to control all of Faerun through ceremorphosis on a massive scale. Only you can stop it.',
    status: 'active',
    steps: [
      { description: 'Arrive in Baldur\'s Gate and learn the cult has infiltrated the city', spoilerLevel: 0 },
      { description: 'Uncover the Dead Three\'s involvement in the Absolute plot', spoilerLevel: 1 },
      { description: 'Find the Netherbrain beneath the city', spoilerLevel: 2 },
      { description: 'Rally your allies for the final assault', spoilerLevel: 2 },
      { description: 'Confront the Netherbrain and decide the fate of the tadpoles', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'The Netherbrain offers you dominion over the Absolute. Do you accept?',
        options: [
          {
            label: 'Accept and become the Absolute',
            consequence: 'You seize control of the Netherbrain and dominate all tadpoled individuals. An evil ending.',
            spoilerLevel: 2,
          },
          {
            label: 'Destroy the Netherbrain and free everyone',
            consequence: 'The Netherbrain is destroyed. All tadpoles die. You and your companions are free.',
            spoilerLevel: 2,
          },
          {
            label: 'Use the prism to contain the Netherbrain',
            consequence: 'The Emperor absorbs the Netherbrain\'s power. The outcome depends on your relationship with the Emperor.',
            spoilerLevel: 2,
          },
        ],
      },
    ],
    relatedCompanions: ['shadowheart', 'laezel', 'gale', 'astarion', 'wyll', 'karlach'],
    relatedAreas: ['baldurs-gate-lower-city', 'baldurs-gate-upper-city', 'wyrms-rock-fortress'],
  },
  {
    id: 'divergent-bloodlines',
    name: 'Divergent Bloodlines',
    act: 1,
    description: 'The githyanki warrior Lae\'zel is fierce and determined to find a creche where she can be purified of the tadpole. Her people\'s ways are harsh, and her quest will test your party.',
    status: 'active',
    steps: [
      { description: 'Recruit Lae\'zel after the nautiloid crash', spoilerLevel: 0 },
      { description: 'Find the githyanki patrol near the Mountain Pass', spoilerLevel: 0 },
      { description: 'Travel to the Githyanki Creche', spoilerLevel: 1 },
      { description: 'Learn the truth about Vlaakith\'s "purification"', spoilerLevel: 2 },
      { description: 'Decide Lae\'zel\'s path regarding Vlaakith and Orpheus', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'Vlaakith commands Lae\'zel to kill you. What does Lae\'zel do?',
        options: [
          {
            label: 'Lae\'zel sides with you against Vlaakith',
            consequence: 'Lae\'zel breaks from her queen and becomes a rebel. She dedicates herself to freeing Orpheus.',
            spoilerLevel: 2,
            companionReactions: [{ companion: 'laezel', delta: 10 }],
          },
          {
            label: 'Lae\'zel obeys Vlaakith',
            consequence: 'Lae\'zel turns on you. You must fight or flee from her.',
            spoilerLevel: 2,
            companionReactions: [{ companion: 'laezel', delta: -100 }],
          },
        ],
      },
    ],
    relatedCompanions: ['laezel'],
    relatedAreas: ['mountain-pass'],
  },
  {
    id: 'the-heart-of-gale',
    name: 'The Heart of Gale',
    act: 1,
    description: 'Gale Dekarios carries a magical catastrophe inside his chest. The orb of unstable magic within him could annihilate everything if not kept in check through the consumption of magical artifacts.',
    status: 'active',
    steps: [
      { description: 'Recruit Gale near the Roadside Cliffs', spoilerLevel: 0 },
      { description: 'Learn about Gale\'s condition and the orb in his chest', spoilerLevel: 1 },
      { description: 'Feed Gale magical items to stabilize the orb', spoilerLevel: 1 },
      { description: 'Discover Gale\'s past relationship with Mystra', spoilerLevel: 2 },
      { description: 'Help Gale decide his path regarding the orb and Mystra\'s request', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'Mystra asks Gale to sacrifice himself by detonating the orb to destroy the Netherbrain. What do you advise?',
        options: [
          {
            label: 'Encourage Gale to find another way',
            consequence: 'Gale defies Mystra and seeks an alternative path. He may pursue godhood or reconciliation.',
            spoilerLevel: 2,
            companionReactions: [{ companion: 'gale', delta: 5 }],
          },
          {
            label: 'Support Gale\'s sacrifice',
            consequence: 'Gale detonates the orb in the final battle. He dies but destroys the Absolute threat.',
            spoilerLevel: 2,
          },
        ],
      },
    ],
    relatedCompanions: ['gale'],
    relatedAreas: ['emerald-grove', 'baldurs-gate-upper-city'],
  },
  {
    id: 'investigate-the-temples',
    name: 'Investigate the Temples',
    act: 3,
    description: 'Three temples beneath Baldur\'s Gate are connected to the Dead Three gods. Each holds a piece of the conspiracy and must be investigated to understand the full scope of the Absolute threat.',
    status: 'active',
    steps: [
      { description: 'Learn about the cult operations in Baldur\'s Gate', spoilerLevel: 0 },
      { description: 'Investigate the Temple of Bane beneath Wyrm\'s Rock', spoilerLevel: 1 },
      { description: 'Discover the Temple of Bhaal in the Undercity', spoilerLevel: 1 },
      { description: 'Find the Temple of Myrkul and its dark purpose', spoilerLevel: 2 },
      { description: 'Confront the chosen of the Dead Three', spoilerLevel: 2 },
    ],
    decisions: [
      {
        question: 'You discover the identity of the chosen of Bhaal. How do you proceed?',
        options: [
          {
            label: 'Confront and fight them directly',
            consequence: 'A challenging battle. Defeating the chosen weakens the Dead Three\'s hold on the city.',
            spoilerLevel: 2,
          },
          {
            label: 'Attempt to turn them against the other chosen',
            consequence: 'A risky gambit that could divide the enemy forces if successful.',
            spoilerLevel: 2,
          },
        ],
      },
    ],
    relatedCompanions: ['shadowheart', 'astarion', 'wyll'],
    relatedAreas: ['baldurs-gate-lower-city', 'baldurs-gate-upper-city', 'wyrms-rock-fortress'],
  },
];
