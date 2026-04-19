/**
 * UI string translations for Tadpole.
 * Only translate UI chrome — NOT data content (companion names, spell names, etc. stay English).
 */

export type Lang = 'en' | 'es' | 'fr' | 'de';

export const LANG_META: { code: Lang; flag: string; label: string }[] = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
];

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.live': 'Live',
    'nav.cheats': 'Cheats',
    'nav.settings': 'Settings',
    'nav.builds': 'Builds',
    'nav.spells': 'Spells',
    'nav.items': 'Items',
    'nav.companions': 'Companions',
    'nav.quests': 'Quests',
    'nav.areas': 'Areas',
    'nav.games': 'Games',
    'nav.browse': 'Browse',
    'nav.map': 'Map',
    'nav.search': 'Search',

    // Build planner
    'build.new': 'New Build',
    'build.saved': 'Saved Builds',
    'build.presets': 'Preset Builds',
    'build.share': 'Share Build',
    'build.edit': 'Edit Build',
    'build.delete': 'Delete Build',
    'build.race': 'Race',
    'build.class': 'Class',
    'build.background': 'Background',
    'build.abilities': 'Abilities',
    'build.feats': 'Feats',
    'build.skills': 'Skills',
    'build.level': 'Level',
    'build.planner': 'Build Planner',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.share': 'Share',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.back': 'Back',
    'common.noResults': 'No results',
    'common.disconnect': 'Disconnect',
    'common.connect': 'Connect',
    'common.connecting': 'Connecting...',
    'common.connected': 'Connected',
    'common.disconnected': 'Disconnected',

    // Sections
    'section.equipment': 'Equipment Guide',
    'section.romance': 'Romance Guide',
    'section.dicePoker': 'Dice Poker',
    'section.lootTracker': 'Loot Tracker',
    'section.buildPlanner': 'Build Planner',

    // Settings labels
    'settings.language': 'Language',
    'settings.spoilerMode': 'Spoiler Mode',
    'settings.about': 'About',
    'settings.version': 'Version',

    // Game terms
    'game.strength': 'Strength',
    'game.dexterity': 'Dexterity',
    'game.constitution': 'Constitution',
    'game.intelligence': 'Intelligence',
    'game.wisdom': 'Wisdom',
    'game.charisma': 'Charisma',
    'game.hitDie': 'Hit Die',
    'game.savingThrows': 'Saving Throws',
    'game.armorClass': 'Armor Class',
    'game.deathSaves': 'Death Saves',
    'game.characterSheets': 'Character Sheets',
    'game.combat': 'COMBAT',
    'game.dialog': 'DIALOG',

    // Home page
    'home.searchPrompt': 'Search spells, items, companions...',
    'home.notConnected': 'Not connected',
    'home.establishingLink': 'Establishing link...',
    'home.connectedAwaiting': 'Connected — awaiting data',
  },

  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.live': 'En vivo',
    'nav.cheats': 'Trucos',
    'nav.settings': 'Ajustes',
    'nav.builds': 'Builds',
    'nav.spells': 'Hechizos',
    'nav.items': 'Objetos',
    'nav.companions': 'Compañeros',
    'nav.quests': 'Misiones',
    'nav.areas': 'Zonas',
    'nav.games': 'Juegos',
    'nav.browse': 'Explorar',
    'nav.map': 'Mapa',
    'nav.search': 'Buscar',

    // Build planner
    'build.new': 'Nuevo Build',
    'build.saved': 'Builds Guardados',
    'build.presets': 'Builds Preestablecidos',
    'build.share': 'Compartir Build',
    'build.edit': 'Editar Build',
    'build.delete': 'Eliminar Build',
    'build.race': 'Raza',
    'build.class': 'Clase',
    'build.background': 'Trasfondo',
    'build.abilities': 'Habilidades',
    'build.feats': 'Dotes',
    'build.skills': 'Competencias',
    'build.level': 'Nivel',
    'build.planner': 'Planificador de Builds',

    // Common
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.share': 'Compartir',
    'common.search': 'Buscar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.back': 'Volver',
    'common.noResults': 'Sin resultados',
    'common.disconnect': 'Desconectar',
    'common.connect': 'Conectar',
    'common.connecting': 'Conectando...',
    'common.connected': 'Conectado',
    'common.disconnected': 'Desconectado',

    // Sections
    'section.equipment': 'Guía de Equipamiento',
    'section.romance': 'Guía de Romance',
    'section.dicePoker': 'Póker de Dados',
    'section.lootTracker': 'Rastreador de Botín',
    'section.buildPlanner': 'Planificador de Builds',

    // Settings labels
    'settings.language': 'Idioma',
    'settings.spoilerMode': 'Modo Spoiler',
    'settings.about': 'Acerca de',
    'settings.version': 'Versión',

    // Game terms
    'game.strength': 'Fuerza',
    'game.dexterity': 'Destreza',
    'game.constitution': 'Constitución',
    'game.intelligence': 'Inteligencia',
    'game.wisdom': 'Sabiduría',
    'game.charisma': 'Carisma',
    'game.hitDie': 'Dado de Golpe',
    'game.savingThrows': 'Tiradas de Salvación',
    'game.armorClass': 'Clase de Armadura',
    'game.deathSaves': 'Salvaciones de Muerte',
    'game.characterSheets': 'Hojas de Personaje',
    'game.combat': 'COMBATE',
    'game.dialog': 'DIÁLOGO',

    // Home page
    'home.searchPrompt': 'Buscar hechizos, objetos, compañeros...',
    'home.notConnected': 'No conectado',
    'home.establishingLink': 'Estableciendo enlace...',
    'home.connectedAwaiting': 'Conectado — esperando datos',
  },

  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.live': 'En direct',
    'nav.cheats': 'Triche',
    'nav.settings': 'Paramètres',
    'nav.builds': 'Builds',
    'nav.spells': 'Sorts',
    'nav.items': 'Objets',
    'nav.companions': 'Compagnons',
    'nav.quests': 'Quêtes',
    'nav.areas': 'Zones',
    'nav.games': 'Jeux',
    'nav.browse': 'Parcourir',
    'nav.map': 'Carte',
    'nav.search': 'Recherche',

    // Build planner
    'build.new': 'Nouveau Build',
    'build.saved': 'Builds Sauvegardés',
    'build.presets': 'Builds Préréglés',
    'build.share': 'Partager le Build',
    'build.edit': 'Modifier le Build',
    'build.delete': 'Supprimer le Build',
    'build.race': 'Race',
    'build.class': 'Classe',
    'build.background': 'Historique',
    'build.abilities': 'Caractéristiques',
    'build.feats': 'Dons',
    'build.skills': 'Compétences',
    'build.level': 'Niveau',
    'build.planner': 'Planificateur de Builds',

    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.share': 'Partager',
    'common.search': 'Rechercher',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.back': 'Retour',
    'common.noResults': 'Aucun résultat',
    'common.disconnect': 'Déconnecter',
    'common.connect': 'Connecter',
    'common.connecting': 'Connexion...',
    'common.connected': 'Connecté',
    'common.disconnected': 'Déconnecté',

    // Sections
    'section.equipment': "Guide d'Équipement",
    'section.romance': 'Guide Romance',
    'section.dicePoker': 'Poker aux Dés',
    'section.lootTracker': 'Suivi du Butin',
    'section.buildPlanner': 'Planificateur de Builds',

    // Settings labels
    'settings.language': 'Langue',
    'settings.spoilerMode': 'Mode Spoiler',
    'settings.about': 'À propos',
    'settings.version': 'Version',

    // Game terms
    'game.strength': 'Force',
    'game.dexterity': 'Dextérité',
    'game.constitution': 'Constitution',
    'game.intelligence': 'Intelligence',
    'game.wisdom': 'Sagesse',
    'game.charisma': 'Charisme',
    'game.hitDie': 'Dé de Vie',
    'game.savingThrows': 'Jets de Sauvegarde',
    'game.armorClass': "Classe d'Armure",
    'game.deathSaves': 'Sauvegardes contre la Mort',
    'game.characterSheets': 'Fiches de Personnage',
    'game.combat': 'COMBAT',
    'game.dialog': 'DIALOGUE',

    // Home page
    'home.searchPrompt': 'Rechercher sorts, objets, compagnons...',
    'home.notConnected': 'Non connecté',
    'home.establishingLink': 'Établissement du lien...',
    'home.connectedAwaiting': 'Connecté — en attente de données',
  },

  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.live': 'Live',
    'nav.cheats': 'Cheats',
    'nav.settings': 'Einstellungen',
    'nav.builds': 'Builds',
    'nav.spells': 'Zauber',
    'nav.items': 'Gegenstände',
    'nav.companions': 'Gefährten',
    'nav.quests': 'Quests',
    'nav.areas': 'Gebiete',
    'nav.games': 'Spiele',
    'nav.browse': 'Durchsuchen',
    'nav.map': 'Karte',
    'nav.search': 'Suche',

    // Build planner
    'build.new': 'Neuer Build',
    'build.saved': 'Gespeicherte Builds',
    'build.presets': 'Vorlagen',
    'build.share': 'Build teilen',
    'build.edit': 'Build bearbeiten',
    'build.delete': 'Build löschen',
    'build.race': 'Volk',
    'build.class': 'Klasse',
    'build.background': 'Hintergrund',
    'build.abilities': 'Eigenschaften',
    'build.feats': 'Talente',
    'build.skills': 'Fertigkeiten',
    'build.level': 'Stufe',
    'build.planner': 'Build-Planer',

    // Common
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.share': 'Teilen',
    'common.search': 'Suchen',
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.back': 'Zurück',
    'common.noResults': 'Keine Ergebnisse',
    'common.disconnect': 'Trennen',
    'common.connect': 'Verbinden',
    'common.connecting': 'Verbinde...',
    'common.connected': 'Verbunden',
    'common.disconnected': 'Getrennt',

    // Sections
    'section.equipment': 'Ausrüstungsleiter',
    'section.romance': 'Romanzenführer',
    'section.dicePoker': 'Würfelpoker',
    'section.lootTracker': 'Beute-Tracker',
    'section.buildPlanner': 'Build-Planer',

    // Settings labels
    'settings.language': 'Sprache',
    'settings.spoilerMode': 'Spoiler-Modus',
    'settings.about': 'Über',
    'settings.version': 'Version',

    // Game terms
    'game.strength': 'Stärke',
    'game.dexterity': 'Geschicklichkeit',
    'game.constitution': 'Konstitution',
    'game.intelligence': 'Intelligenz',
    'game.wisdom': 'Weisheit',
    'game.charisma': 'Charisma',
    'game.hitDie': 'Trefferwürfel',
    'game.savingThrows': 'Rettungswürfe',
    'game.armorClass': 'Rüstungsklasse',
    'game.deathSaves': 'Todesrettungswürfe',
    'game.characterSheets': 'Charakterbögen',
    'game.combat': 'KAMPF',
    'game.dialog': 'DIALOG',

    // Home page
    'home.searchPrompt': 'Zauber, Gegenstände, Gefährten suchen...',
    'home.notConnected': 'Nicht verbunden',
    'home.establishingLink': 'Verbindung wird hergestellt...',
    'home.connectedAwaiting': 'Verbunden — warte auf Daten',
  },
};

export default translations;
