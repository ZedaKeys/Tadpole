import type { Background } from '@/types';

export const backgrounds: Background[] = [
  {
    id: 'acolyte',
    name: 'Acolyte',
    description:
      'You have spent your life in the service of a temple to a specific god or pantheon of gods. You act as an intermediary between the realm of the sacred and the mortal world.',
    skillProficiencies: ['Insight', 'Religion'],
    feature: 'Shelter of the Faithful',
  },
  {
    id: 'charlatan',
    name: 'Charlatan',
    description:
      'You are a master of deception, skilled at bending others to your will through charm, trickery, and false promises.',
    skillProficiencies: ['Deception', 'Sleight of Hand'],
    feature: 'False Identity',
  },
  {
    id: 'criminal',
    name: 'Criminal',
    description:
      'You are an experienced criminal with a history of breaking the law. You have spent time among other criminals and still have contacts within the criminal underworld.',
    skillProficiencies: ['Deception', 'Stealth'],
    feature: 'Criminal Contact',
  },
  {
    id: 'entertainer',
    name: 'Entertainer',
    description:
      'You thrive in front of an audience, using your talents to wow crowds and earn a living through performance and showmanship.',
    skillProficiencies: ['Acrobatics', 'Performance'],
    feature: 'By Popular Demand',
  },
  {
    id: 'folk-hero',
    name: 'Folk Hero',
    description:
      'You come from a humble social rank, but you are destined for so much more. You have already proven yourself by standing up for the common people against oppression.',
    skillProficiencies: ['Animal Handling', 'Survival'],
    feature: 'Rustic Hospitality',
  },
  {
    id: 'guild-artisan',
    name: 'Guild Artisan',
    description:
      'You are a member of an artisan guild, skilled in a particular craft and well-versed in the art of commerce and negotiation.',
    skillProficiencies: ['Insight', 'Persuasion'],
    feature: 'Guild Membership',
  },
  {
    id: 'hermit',
    name: 'Hermit',
    description:
      'You lived in seclusion — either in a sheltered community or entirely alone — far from the bustling settlements of common folk.',
    skillProficiencies: ['Medicine', 'Religion'],
    feature: 'Discovery',
  },
  {
    id: 'noble',
    name: 'Noble',
    description:
      'You understand wealth, power, and privilege. You carry a noble title and your family owns land, collects taxes, and wields significant political influence.',
    skillProficiencies: ['History', 'Persuasion'],
    feature: 'Position of Privilege',
  },
  {
    id: 'outlander',
    name: 'Outlander',
    description:
      'You grew up in the wilds, far from civilization and the comforts of town and technology. You have witnessed the migrations of herds, survived brutal winters, and weathered hostile tribes.',
    skillProficiencies: ['Athletics', 'Survival'],
    feature: 'Wanderer',
  },
  {
    id: 'sage',
    name: 'Sage',
    description:
      'You spent years learning the lore of the multiverse, poring over ancient tomes and scrolls to unlock the secrets of the cosmos.',
    skillProficiencies: ['Arcana', 'History'],
    feature: 'Researcher',
  },
  {
    id: 'soldier',
    name: 'Soldier',
    description:
      'War has been your life for as long as you care to remember. You fought in battles, endured harsh conditions, and learned the art of combat and military strategy.',
    skillProficiencies: ['Athletics', 'Intimidation'],
    feature: 'Military Rank',
  },
  {
    id: 'urchin',
    name: 'Urchin',
    description:
      'You grew up on the streets, alone and impoverished, doing whatever it took to survive from day to day. You know the back alleys and hidden passages of cities better than anyone.',
    skillProficiencies: ['Sleight of Hand', 'Stealth'],
    feature: 'City Secrets',
  },
];
